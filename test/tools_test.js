import assert from "node:assert/strict";
import test from "node:test";

import { create_auth_hash, decompress_message, get_buff_level } from "../utils/tools.js";

async function compress(bytes) {
	const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

function authenticated_message(message, original_size) {
	return {
		getCompressed: () => true,
		getMessage_asU8: () => message,
		getOriginalSize: () => original_size,
		hasOriginalSize: () => original_size !== undefined,
	};
}

test("decompresses authenticated messages", async () => {
	const original = new TextEncoder().encode("compressed protobuf payload");
	const compressed = await compress(original);
	const decompressed = await decompress_message(authenticated_message(compressed, original.length));

	assert.deepEqual(decompressed, original);
});

test("returns uncompressed authenticated messages unchanged", async () => {
	const original = new Uint8Array([1, 2, 3]);
	const message = {
		getCompressed: () => false,
		getMessage_asU8: () => original,
	};

	assert.equal(await decompress_message(message), original);
});

test("rejects invalid compressed data", async () => {
	const message = authenticated_message(new Uint8Array([1, 2, 3]));
	await assert.rejects(decompress_message(message));
});

test("rejects decompressed data with the wrong declared size", async () => {
	const original = new TextEncoder().encode("payload");
	const compressed = await compress(original);
	await assert.rejects(
		decompress_message(authenticated_message(compressed, original.length + 1)),
		/size did not match/,
	);
});

test("maps colleggtible population thresholds to stable buff levels", () => {
	assert.equal(get_buff_level(0), 0);
	assert.equal(get_buff_level(9_999_999), 0);
	assert.equal(get_buff_level(10_000_000), 1);
	assert.equal(get_buff_level(100_000_000), 2);
	assert.equal(get_buff_level(1_000_000_000), 3);
	assert.equal(get_buff_level(10_000_000_000), 4);
});

test("validates authenticated request configuration", async () => {
	const hash = await create_auth_hash(new Uint8Array([1, 2, 3]), {
		INDEX: "1",
		MAGIC: "secret",
		MARKER: "42",
	});
	assert.match(hash, /^[0-9a-f]{64}$/);

	await assert.rejects(
		create_auth_hash(new Uint8Array([1]), {}),
		(error) => error.code === "configuration_error",
	);
	await assert.rejects(
		create_auth_hash(new Uint8Array(), { INDEX: 0, MAGIC: "secret", MARKER: 42 }),
		(error) => error.code === "invalid_auth_message",
	);
});
