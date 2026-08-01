import assert from "node:assert/strict";
import { Buffer as buffer } from "node:buffer";
import test from "node:test";

import { endpoints } from "../api/schema.js";
import proto from "../ei_pb.cjs";
import { handle_request } from "../index.js";

const test_env = { INDEX: "1", MAGIC: "secret", MARKER: "42" };

function authenticated_payload(message) {
	const authenticated = new proto.AuthenticatedMessage().setMessage(message.serializeBinary());
	return buffer.from(authenticated.serializeBinary()).toString("base64");
}

function backup_payload(backup) {
	const first_contact = new proto.EggIncFirstContactResponse().setBackup(backup);
	return buffer.from(first_contact.serializeBinary()).toString("base64");
}

function create_backup() {
	const backup = new proto.Backup()
		.setEiUserId("EI123")
		.setGame(new proto.Backup.Game())
		.setContracts(new proto.MyContracts());
	backup.addFarms(new proto.Backup.Simulation().setFarmType(2));
	return backup;
}

function create_archive() {
	const local_contract = new proto.LocalContract()
		.setContract(new proto.Contract().setIdentifier("contract_id"))
		.setEvaluation(new proto.ContractEvaluation().setCxpChange(1));
	const archive = new proto.ContractsArchive();
	archive.addArchive(local_contract);
	return archive;
}

function create_periodicals() {
	return new proto.PeriodicalsResponse().setContracts(new proto.ContractsResponse());
}

function fixed_response(payload) {
	return async () => new Response(payload);
}

const backup = create_backup();
const archive = create_archive();
const periodicals = create_periodicals();
const cases = [
	{
		content_type: "application/json",
		fetch: fixed_response(backup_payload(backup)),
		path: "active_artifacts?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.GetActiveMissionsResponse())),
		path: "active_missions?eid=EI123&reset_index=0",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.ArtifactsConfigurationResponse())),
		path: "afx_config?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(archive)),
		path: "archive?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(backup_payload(backup)),
		path: "artifact_inventory?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(backup_payload(backup)),
		path: "backup?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei/bot_first_contact")
					? backup_payload(backup)
					: authenticated_payload(periodicals),
			),
		path: "colleggtibles?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.CompleteMissionResponse())),
		path: "completed_mission?eid=EI123&mission_id=mission_id",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.ContractCoopStatusResponse())),
		path: "contract?eid=EI123&contract=contract_id&coop=coop_id",
	},
	{
		content_type: "application/json",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei_ctx/get_contracts_archive")
					? authenticated_payload(archive)
					: authenticated_payload(periodicals),
			),
		path: "contract_evaluations?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei/bot_first_contact")
					? backup_payload(backup)
					: authenticated_payload(periodicals),
			),
		path: "contracts?eid=EI123",
	},
	{
		content_type: "text/csv",
		fetch: fixed_response(authenticated_payload(new proto.ContractCoopStatusResponse())),
		path: "coop_buffs?eid=EI123&contract=contract_id&coop=coop_id",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.ContractCoopStatusResponse())),
		path: "coop_summary?eid=EI123&contract=contract_id&coop=coop_id",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(backup_payload(backup)),
		path: "farms?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(periodicals)),
		path: "events?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.LeaderboardResponse())),
		path: "leaderboard?eid=EI123&scope=ALL_TIME&grade=5",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.LeaderboardInfo())),
		path: "leaderboard_info",
	},
	{
		content_type: "text/plain",
		fetch: fixed_response(authenticated_payload(archive)),
		path: "minmax_cxp_change?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei/bot_first_contact")
					? backup_payload(backup)
					: authenticated_payload(periodicals),
			),
		path: "missions?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(periodicals)),
		path: "periodicals?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei/bot_first_contact")
					? backup_payload(backup)
					: authenticated_payload(periodicals),
			),
		path: "player_summary?eid=EI123",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.ContractSeasonInfos())),
		path: "season_info",
	},
	{
		content_type: "application/json",
		fetch: fixed_response(authenticated_payload(new proto.UserSubscriptionInfo())),
		path: "sub_status?eid=EI123",
	},
	{
		content_type: "text/csv",
		fetch: async (input) =>
			new Response(
				String(input).endsWith("/ei/bot_first_contact")
					? backup_payload(backup)
					: authenticated_payload(periodicals),
			),
		path: "yon_farm_info?eid=EI123",
	},
];

test("serves every public endpoint", async (context) => {
	const tested_endpoints = cases.map(({ path }) => path.split("?")[0]).sort();
	assert.deepEqual(tested_endpoints, Object.keys(endpoints).sort());

	for (const endpoint of cases) {
		await context.test(`GET /${endpoint.path}`, async () => {
			const original_fetch = globalThis.fetch;
			globalThis.fetch = endpoint.fetch;
			try {
				const response = await handle_request(
					new Request(`https://worker.example/${endpoint.path}`),
					test_env,
				);
				assert.equal(response.status, 200);
				assert.match(
					response.headers.get("Content-Type") ?? "",
					new RegExp(`^${endpoint.content_type}`),
				);
				assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
				if (endpoint.content_type === "application/json") await response.json();
				else assert.notEqual(await response.text(), "");
			} finally {
				globalThis.fetch = original_fetch;
			}
		});
	}
});
