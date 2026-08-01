import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import test from "node:test";

import proto from "../ei_pb.cjs";
import { handle_request } from "../index.js";

async function withFetch(responseBody, run) {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(responseBody);
	try {
		return await run();
	} finally {
		globalThis.fetch = originalFetch;
	}
}

test("preserves endpoint status and adds public headers", async () => {
	const response = await withFetch("invalid protobuf", () =>
		handle_request(new Request("https://worker.example/backup?eid=EI123")),
	);

	assert.equal(response.status, 502);
	assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
	assert.equal(response.headers.get("Cache-Control"), "no-store");
	assert.equal(response.headers.get("Content-Type"), "application/json; charset=utf-8");
	assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
	assert.equal((await response.json()).error.code, "invalid_upstream_response");
});

test("translates upstream HTTP failures to a public gateway error", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(null, { status: 503 });
	try {
		const response = await handle_request(new Request("https://worker.example/backup?eid=EI123"));
		assert.equal(response.status, 502);
		assert.equal((await response.json()).error.code, "upstream_error");
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("handles preflight without calling the endpoint", async () => {
	const originalFetch = globalThis.fetch;
	let calls = 0;
	globalThis.fetch = async () => {
		calls += 1;
		return new Response();
	};
	try {
		const response = await handle_request(
			new Request("https://worker.example/backup?eid=EI123", { method: "OPTIONS" }),
		);
		assert.equal(response.status, 204);
		assert.equal(response.headers.get("Access-Control-Allow-Methods"), "GET, OPTIONS");
		assert.equal(calls, 0);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("rejects methods other than GET and OPTIONS", async () => {
	const response = await handle_request(
		new Request("https://worker.example/backup?eid=EI123", { method: "POST" }),
	);

	assert.equal(response.status, 405);
	assert.equal(response.headers.get("Allow"), "GET, OPTIONS");
});

test("maps legacy parameter names and advertises the canonical URL", async () => {
	const firstContact = new proto.EggIncFirstContactResponse().setBackup(new proto.Backup());
	const payload = Buffer.from(firstContact.serializeBinary()).toString("base64");
	const response = await withFetch(payload, () =>
		handle_request(new Request("https://worker.example/backup?EID=EI123")),
	);

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("Deprecation"), "true");
	assert.equal(
		response.headers.get("Link"),
		'<https://worker.example/backup?eid=EI123>; rel="successor-version"',
	);
});

test("maps legacy endpoint names", async () => {
	const archive = new proto.ContractsArchive();
	const authenticated = new proto.AuthenticatedMessage().setMessage(archive.serializeBinary());
	const payload = Buffer.from(authenticated.serializeBinary()).toString("base64");
	const response = await withFetch(payload, () =>
		handle_request(new Request("https://worker.example/minmaxCxPChange?EID=EI123")),
	);

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("Deprecation"), "true");
	assert.match(response.headers.get("Link"), /\/minmax_cxp_change\?eid=EI123/);
});

test("rejects missing, unknown, conflicting, and out-of-range parameters", async () => {
	const requests = [
		"https://worker.example/backup",
		"https://worker.example/backup?eid=EI123&typo=value",
		"https://worker.example/backup?eid=EI123&EID=EI456",
		"https://worker.example/leaderboard?eid=EI123&scope=2&grade=1",
	];

	for (const request of requests) {
		const response = await handle_request(new Request(request));
		assert.equal(response.status, 400);
		assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
	}
});

test("returns a structured public error for unknown endpoints", async () => {
	const response = await handle_request(new Request("https://worker.example/missing"));

	assert.equal(response.status, 404);
	assert.deepEqual(await response.json(), {
		error: { code: "endpoint_not_found", message: "Endpoint not found: missing" },
	});
	assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
});
