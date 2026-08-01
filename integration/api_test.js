import assert from "node:assert/strict";
import { after, test } from "node:test";

import { endpoints } from "../api/schema.js";
import { handle_request } from "../index.js";

const test_eid = process.env.EI_TEST_EID;
const timeout = 45_000;
const signing_keys = ["MAGIC", "INDEX", "MARKER"];
const missing_signing_keys = signing_keys.filter((key) => !process.env[key]);
const requested_endpoints = new Set();

if (!test_eid) {
	throw new Error("EI_TEST_EID is required for live API tests");
}
if (!/^EI\d+$/.test(test_eid)) {
	throw new Error("EI_TEST_EID must start with EI and contain only digits after the prefix");
}
if (missing_signing_keys.length > 0) {
	throw new Error(`${missing_signing_keys.join(", ")} are required for live API tests`);
}

after(() => {
	assert.deepEqual([...requested_endpoints].sort(), Object.keys(endpoints).sort());
});

async function get_live_response(path, params = {}) {
	requested_endpoints.add(path);
	const url = new URL(`https://worker.example/${path}`);
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}
	return handle_request(new Request(url), process.env);
}

async function get_successful_response(path, params = {}) {
	let response = await get_live_response(path, params);
	if (response.status === 502 || response.status === 504) {
		await new Promise((resolve) => setTimeout(resolve, 250));
		response = await get_live_response(path, params);
	}
	assert.equal(response.status, 200, `${path} returned HTTP ${response.status}`);
	return response;
}

async function get_json(path, params = {}) {
	const response = await get_successful_response(path, params);
	assert.match(response.headers.get("Content-Type") ?? "", /^application\/json/);
	return response.json();
}

let backup_promise;
let leaderboard_info_promise;

function get_backup() {
	backup_promise ??= get_json("backup", { eid: test_eid });
	return backup_promise;
}

function get_leaderboard_info() {
	leaderboard_info_promise ??= get_json("leaderboard_info");
	return leaderboard_info_promise;
}

function find_active_coop(backup) {
	return (
		backup.contracts?.contractsList?.find(
			(local_contract) => local_contract.contract?.identifier && local_contract.coopIdentifier,
		) ?? {
			contract: { identifier: "integration_test_missing_contract" },
			coopIdentifier: "integration_test_missing_coop",
		}
	);
}

test("retrieves and decodes a live backup", { timeout }, async () => {
	const backup = await get_backup();
	assert.equal(backup.eiUserId === test_eid, true, "backup belongs to the requested test account");
	assert.equal(typeof backup.game, "object");
	assert.equal(Array.isArray(backup.farmsList), true);
});

test("rejects a nonexistent completed mission safely", { timeout }, async () => {
	const response = await get_live_response("completed_mission", {
		eid: test_eid,
		mission_id: "integration_test_missing_mission",
	});
	assert.equal([502, 504].includes(response.status), true);
	assert.match((await response.json()).error.code, /^upstream_(error|timeout)$/);
});

test("retrieves live active artifacts", { timeout }, async () => {
	const artifacts = await get_json("active_artifacts", { eid: test_eid });
	assert.equal(Array.isArray(artifacts), true);
});

test("retrieves structured live farms", { timeout }, async () => {
	const farms = await get_json("farms", { eid: test_eid });
	assert.equal(Array.isArray(farms), true);
	assert.equal(
		farms.some((farm) => farm.type === "HOME"),
		true,
	);
	for (const farm of farms) {
		assert.equal(typeof farm.population.total, "number");
		assert.equal(Array.isArray(farm.equipped_artifacts), true);
	}
});

test("retrieves and decodes the live artifact configuration", { timeout }, async () => {
	const configuration = await get_json("afx_config", { eid: test_eid });
	assert.equal(typeof configuration, "object");
});

test("retrieves and decodes the live contract archive", { timeout }, async () => {
	const archive = await get_json("archive", { eid: test_eid });
	assert.equal(Array.isArray(archive.archiveList), true);
});

test("retrieves and decodes live leaderboard metadata", { timeout }, async () => {
	const info = await get_leaderboard_info();
	assert.equal(typeof info.allTimeScope, "string");
	assert.equal(Array.isArray(info.seasonsList), true);
});

test("retrieves and decodes live periodicals", { timeout }, async () => {
	const periodicals = await get_json("periodicals", { eid: test_eid });
	assert.equal(Array.isArray(periodicals.evaluationsList), true);
	assert.equal(Array.isArray(periodicals.artifactCasesList), true);
});

test("retrieves live colleggtible progress", { timeout }, async () => {
	const colleggtibles = await get_json("colleggtibles", { eid: test_eid });
	assert.equal(Array.isArray(colleggtibles), true);
	for (const colleggtible of colleggtibles) {
		assert.equal(typeof colleggtible.id, "string");
		assert.equal(typeof colleggtible.buff_level, "number");
	}
});

test("retrieves and decodes live season metadata", { timeout }, async () => {
	const seasons = await get_json("season_info");
	assert.equal(typeof seasons, "object");
});

test("retrieves and decodes live subscription status", { timeout }, async () => {
	const subscription = await get_json("sub_status", { eid: test_eid });
	assert.equal(typeof subscription, "object");
});

test("retrieves live contract XP extremes", { timeout }, async () => {
	const response = await get_live_response("minmax_cxp_change", { eid: test_eid });
	if (response.status === 404) {
		assert.equal((await response.json()).error.code, "no_evaluations");
		return;
	}
	assert.equal(response.status, 200);
	assert.match(response.headers.get("Content-Type") ?? "", /^text\/plain/);
	assert.match(await response.text(), /^Highest cxpChange:/);
});

test("retrieves a live coop status", { timeout }, async () => {
	const active_coop = find_active_coop(await get_backup());
	const contract = await get_json("contract", {
		contract: active_coop.contract.identifier,
		coop: active_coop.coopIdentifier,
		eid: test_eid,
	});
	assert.equal(Array.isArray(contract.contributorsList), true);
});

test("calculates live coop buffs", { timeout }, async () => {
	const active_coop = find_active_coop(await get_backup());
	const response = await get_successful_response("coop_buffs", {
		contract: active_coop.contract.identifier,
		coop: active_coop.coopIdentifier,
		eid: test_eid,
	});
	assert.match(response.headers.get("Content-Type") ?? "", /^text\/csv/);
	assert.match(await response.text(), /^deflector,\d+\nsiab,\d+$/);
});

test("retrieves live active missions", { timeout }, async () => {
	const backup = await get_backup();
	const missions = await get_json("active_missions", {
		eid: test_eid,
		reset_index: backup.virtue?.resets ?? 0,
	});
	assert.equal(typeof missions, "object");
});

test("retrieves a live leaderboard", { timeout }, async () => {
	const info = await get_leaderboard_info();
	const leaderboard = await get_json("leaderboard", {
		eid: test_eid,
		grade: 5,
		scope: info.allTimeScope,
	});
	assert.equal(typeof leaderboard, "object");
});

test("builds a live farm report", { timeout }, async () => {
	const response = await get_successful_response("yon_farm_info", { eid: test_eid });
	assert.match(response.headers.get("Content-Type") ?? "", /^text\/csv/);

	const report = await response.text();
	assert.match(report, /Farm,ArtifactType,ArtifactRarity,ArtifactTier/);
	assert.match(report, /\nColleggtibles\n/);
	assert.match(report, /ID,Buff Type,Buff Value,Image URL,Egg Value,Name/);
});
