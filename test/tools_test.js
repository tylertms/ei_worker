import assert from "node:assert/strict";
import test from "node:test";

import { decompress_message } from "../utils/tools.js";

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
