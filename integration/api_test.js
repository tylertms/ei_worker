import assert from "node:assert/strict";
import test from "node:test";

import { handle_request } from "../index.js";

const test_eid = process.env.EI_TEST_EID;

if (!test_eid) {
	throw new Error("EI_TEST_EID is required for live API tests");
}
if (!/^EI\d+$/.test(test_eid)) {
	throw new Error("EI_TEST_EID must start with EI and contain only digits after the prefix");
}

async function get_live_response(path) {
	const url = new URL(`https://worker.example/${path}`);
	url.searchParams.set("eid", test_eid);
	const response = await handle_request(new Request(url), process.env);
	assert.equal(response.status, 200, `${path} returned HTTP ${response.status}`);
	return response;
}

test("retrieves and decodes a live v73 backup", { timeout: 30_000 }, async () => {
	const response = await get_live_response("backup");
	assert.match(response.headers.get("Content-Type") ?? "", /^application\/json/);
	assert.equal(response.headers.get("Cache-Control"), "no-store");

	const backup = await response.json();
	assert.equal(backup.eiUserId === test_eid, true, "backup belongs to the requested test account");
	assert.equal(typeof backup.game, "object");
	assert.equal(Array.isArray(backup.farmsList), true);
});

test("retrieves and decodes live periodicals", { timeout: 30_000 }, async () => {
	const response = await get_live_response("periodicals");
	assert.match(response.headers.get("Content-Type") ?? "", /^application\/json/);

	const periodicals = await response.json();
	assert.equal(typeof periodicals, "object");
	assert.equal(Array.isArray(periodicals.evaluationsList), true);
	assert.equal(Array.isArray(periodicals.artifactCasesList), true);
});

test("builds a live colleggtible farm report", { timeout: 30_000 }, async () => {
	const response = await get_live_response("yon_farm_info");
	assert.match(response.headers.get("Content-Type") ?? "", /^text\/csv/);

	const report = await response.text();
	assert.match(report, /Farm,ArtifactType,ArtifactRarity,ArtifactTier/);
	assert.match(report, /\nColleggtibles\n/);
	assert.match(report, /ID,Buff Type,Buff Value,Image URL,Egg Value,Name/);
});
