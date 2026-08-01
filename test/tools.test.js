import assert from "node:assert/strict";
import test from "node:test";

import { decompressMessage } from "../utils/tools.js";

async function compress(bytes) {
	const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}

function authenticatedMessage(message, originalSize) {
	return {
		getCompressed: () => true,
		getMessage_asU8: () => message,
		getOriginalSize: () => originalSize,
		hasOriginalSize: () => originalSize !== undefined,
	};
}

test("decompresses authenticated messages", async () => {
	const original = new TextEncoder().encode("compressed protobuf payload");
	const compressed = await compress(original);
	const decompressed = await decompressMessage(authenticatedMessage(compressed, original.length));

	assert.deepEqual(decompressed, original);
});

test("returns uncompressed authenticated messages unchanged", async () => {
	const original = new Uint8Array([1, 2, 3]);
	const message = {
		getCompressed: () => false,
		getMessage_asU8: () => original,
	};

	assert.equal(await decompressMessage(message), original);
});

test("rejects invalid compressed data", async () => {
	const message = authenticatedMessage(new Uint8Array([1, 2, 3]));
	await assert.rejects(decompressMessage(message));
});

test("rejects decompressed data with the wrong declared size", async () => {
	const original = new TextEncoder().encode("payload");
	const compressed = await compress(original);
	await assert.rejects(
		decompressMessage(authenticatedMessage(compressed, original.length + 1)),
		/size did not match/,
	);
});
