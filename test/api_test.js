import assert from "node:assert/strict";
import { Buffer as buffer } from "node:buffer";
import test from "node:test";

import proto from "../ei_pb.cjs";
import { handle_request } from "../index.js";

async function with_fetch(response_body, run) {
	const original_fetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(response_body);
	try {
		return await run();
	} finally {
		globalThis.fetch = original_fetch;
	}
}

test("preserves endpoint status and adds public headers", async () => {
	const response = await with_fetch("invalid protobuf", () =>
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
	const original_fetch = globalThis.fetch;
	globalThis.fetch = async () => new Response(null, { status: 503 });
	try {
		const response = await handle_request(new Request("https://worker.example/backup?eid=EI123"));
		assert.equal(response.status, 502);
		assert.equal((await response.json()).error.code, "upstream_error");
	} finally {
		globalThis.fetch = original_fetch;
	}
});

test("handles preflight without calling the endpoint", async () => {
	const original_fetch = globalThis.fetch;
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
		globalThis.fetch = original_fetch;
	}
});

test("rejects methods other than GET and OPTIONS", async () => {
	const response = await handle_request(
		new Request("https://worker.example/backup?eid=EI123", { method: "POST" }),
	);

	assert.equal(response.status, 405);
	assert.equal(response.headers.get("Allow"), "GET, OPTIONS");
	assert.deepEqual(await response.json(), {
		error: { code: "method_not_allowed", message: "Only GET and OPTIONS are supported" },
	});
});

test("maps legacy parameter names and advertises the canonical URL", async () => {
	const first_contact = new proto.EggIncFirstContactResponse().setBackup(new proto.Backup());
	const payload = buffer.from(first_contact.serializeBinary()).toString("base64");
	const response = await with_fetch(payload, () =>
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
	const backup = new proto.Backup();
	backup.addFarms(new proto.Backup.Simulation().setFarmType(2));
	const first_contact = new proto.EggIncFirstContactResponse().setBackup(backup);
	const payload = buffer.from(first_contact.serializeBinary()).toString("base64");
	const response = await with_fetch(payload, () =>
		handle_request(new Request("https://worker.example/activeArtifacts?EID=EI123")),
	);

	assert.equal(response.status, 200);
	assert.equal(response.headers.get("Deprecation"), "true");
	assert.match(response.headers.get("Link"), /\/active_artifacts\?eid=EI123/);
});

test("advertises canonical aliases on endpoint errors", async () => {
	const first_contact = new proto.EggIncFirstContactResponse().setBackup(new proto.Backup());
	const payload = buffer.from(first_contact.serializeBinary()).toString("base64");
	const response = await with_fetch(payload, () =>
		handle_request(new Request("https://worker.example/activeArtifacts?EID=EI123")),
	);

	assert.equal(response.status, 404);
	assert.equal(response.headers.get("Deprecation"), "true");
	assert.match(response.headers.get("Link"), /\/active_artifacts\?eid=EI123/);
});

test("rejects missing, unknown, conflicting, and out-of-range parameters", async () => {
	const requests = [
		"https://worker.example/backup",
		"https://worker.example/backup?eid=EI123&typo=value",
		"https://worker.example/backup?eid=EI123&EID=EI456",
		"https://worker.example/leaderboard?eid=EI123&scope=invalid.value&grade=1",
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

test("caches only account-independent metadata responses", async () => {
	const original_fetch = globalThis.fetch;
	const original_caches = globalThis.caches;
	let fetch_count = 0;
	let cached_response;
	const message = new proto.AuthenticatedMessage().setMessage(
		new proto.LeaderboardInfo().serializeBinary(),
	);
	const payload = buffer.from(message.serializeBinary()).toString("base64");
	globalThis.fetch = async () => {
		fetch_count += 1;
		return new Response(payload);
	};
	globalThis.caches = {
		default: {
			match: async () => cached_response?.clone(),
			put: async (_request, response) => {
				cached_response = response.clone();
			},
		},
	};

	try {
		const request = new Request("https://worker.example/leaderboard_info");
		const first = await handle_request(request);
		const second = await handle_request(request);
		assert.equal(first.status, 200);
		assert.equal(second.status, 200);
		assert.equal(fetch_count, 1);
		assert.equal(first.headers.get("Cache-Control"), "public, max-age=300, s-maxage=300");
	} finally {
		globalThis.fetch = original_fetch;
		if (original_caches === undefined) delete globalThis.caches;
		else globalThis.caches = original_caches;
	}
});
