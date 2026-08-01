import assert from "node:assert/strict";
import test from "node:test";
import { build_artifact_inventory } from "../handlers/artifact_inventory.js";
import { build_colleggtibles } from "../handlers/colleggtibles.js";
import { build_contract_evaluations } from "../handlers/contract_evaluations.js";
import { build_contracts } from "../handlers/contracts.js";
import { calculate_buffs } from "../handlers/coop_buffs.js";
import { build_coop_summary } from "../handlers/coop_summary.js";
import { build_events } from "../handlers/events.js";
import { build_farms } from "../handlers/farms.js";
import { get_cxp_extremes } from "../handlers/minmax_cxp_change.js";
import { build_missions } from "../handlers/missions.js";
import { find_farm_index, get_active_artifacts, select_report_farms } from "../utils/artifacts.js";
import { get_colleggtible_rows, get_maximum_farm_sizes } from "../utils/colleggtibles.js";

test("aggregates fractional coop buffs before rounding", () => {
	const contributors = [
		{
			buffHistoryList: [{ earnings: 1.004, eggLayingRate: 1.004 }],
			userId: "EI_OTHER_1",
		},
		{
			buffHistoryList: [{ earnings: 1.004, eggLayingRate: 1.004 }],
			userId: "EI_OTHER_2",
		},
		{
			buffHistoryList: [{ earnings: 2, eggLayingRate: 2 }],
			userId: "EI_SELF",
		},
	];

	assert.deepEqual(calculate_buffs(contributors, "EI_SELF"), { deflector: 1, siab: 1 });
});

test("ignores contributors without buff history", () => {
	assert.deepEqual(calculate_buffs([{ userId: "EI_OTHER" }], "EI_SELF"), {
		deflector: 0,
		siab: 0,
	});
});

test("ranks coop members and reports their current buffs", () => {
	const summary = build_coop_summary({
		contractIdentifier: "contract_id",
		contributorsList: [
			{ contributionAmount: 5, userName: "Second" },
			{
				buffHistoryList: [{ earnings: 1.2, eggLayingRate: 1.1 }],
				contributionAmount: 10,
				productionParams: { farmPopulation: 12 },
				userName: "First",
			},
		],
		coopIdentifier: "coop_id",
		grade: 5,
	});

	assert.equal(summary.contract_id, "contract_id");
	assert.equal(summary.grade.name, "AAA");
	assert.equal(summary.members[0].user_name, "First");
	assert.equal(summary.members[0].rank, 1);
	assert.equal(summary.members[0].buffs.deflector_percent, 10);
	assert.equal(summary.members[0].production.farm_population, 12);
});

test("selects report farms with their source indexes", () => {
	const farms = [
		{ contractId: "inactive", farmType: 3 },
		{ farmType: 2 },
		{ contractId: "active", farmType: 3 },
	];

	assert.deepEqual(select_report_farms(farms, ["active"]), [
		{ farm: farms[1], farm_index: 1 },
		{ farm: farms[2], farm_index: 2 },
	]);
	assert.equal(find_farm_index(farms), 1);
	assert.equal(find_farm_index(farms, "active"), 2);
	assert.equal(find_farm_index(farms, "missing"), -1);
});

test("builds structured home and contract farms", () => {
	const farms = build_farms({
		artifactsDb: { activeArtifactSetsList: [], inventoryItemsList: [] },
		contracts: {
			archiveList: [],
			contractsList: [{ contractIdentifier: "contract_id", coopIdentifier: "coop_id" }],
		},
		farmsList: [
			{ cashEarned: 10, cashSpent: 3, eggType: 1, farmType: 2, numChickens: 4 },
			{
				boostTokensGiven: 1,
				boostTokensReceived: 5,
				boostTokensSpent: 2,
				contractId: "contract_id",
				eggType: 200,
				farmType: 3,
			},
		],
	});

	assert.equal(farms[0].type, "HOME");
	assert.equal(farms[0].cash.net, 7);
	assert.equal(farms[0].tokens, null);
	assert.equal(farms[1].contract_id, "contract_id");
	assert.equal(farms[1].coop_id, "coop_id");
	assert.equal(farms[1].egg.name, "contract_id");
	assert.equal(farms[1].tokens.balance, 2);
});

test("builds ordered current events with snake case fields", () => {
	const events = build_events({
		events: {
			eventsList: [
				{ ccOnly: true, duration: 100, identifier: "later", secondsRemaining: 20, startTime: 10 },
				{ identifier: "sooner", secondsRemaining: 5 },
			],
		},
	});

	assert.equal(events[0].identifier, "sooner");
	assert.equal(events[1].cc_only, true);
	assert.equal(events[1].end_time, 110);
});

test("maps equipped artifacts and omits empty slots", () => {
	const artifacts_database = {
		activeArtifactSetsList: [
			{ slotsList: [] },
			{ slotsList: [{ itemId: 20 }, { itemId: 999 }, { itemId: 10 }] },
		],
		inventoryItemsList: [{ itemId: 10 }, { itemId: 20 }],
	};

	assert.deepEqual(get_active_artifacts(artifacts_database, 1), [
		artifacts_database.inventoryItemsList[1],
		artifacts_database.inventoryItemsList[0],
	]);
	assert.deepEqual(get_active_artifacts(undefined, 0), []);
});

test("builds artifact inventory, sets, and crafting status", () => {
	const inventory = build_artifact_inventory({
		artifacts: { craftingXp: 12, inventoryScore: 34 },
		artifactsDb: {
			activeArtifactSetsList: [{ slotsList: [{ itemId: 7, occupied: true }] }],
			artifactStatusList: [
				{ count: 2, craftable: true, discovered: true, spec: { level: 1, name: 2 } },
			],
			inventoryItemsList: [
				{ artifact: { spec: { level: 1, name: 2, rarity: 0 } }, itemId: 7, quantity: 3 },
			],
			itemSequence: 8,
			savedArtifactSetsList: [],
		},
	});

	assert.equal(inventory.inventory_score, 34);
	assert.equal(inventory.crafting_xp, 12);
	assert.equal(inventory.total_quantity, 3);
	assert.equal(inventory.items[0].item_id, 7);
	assert.equal(inventory.active_sets[0].slots[0].occupied, true);
	assert.equal(inventory.statuses[0].craftable, true);
	assert.deepEqual(inventory.virtue.items, []);
});

test("prefers the highest colleggtible availability value", () => {
	const contracts = [
		{
			contract: { customEggId: "chocolate", egg: 200 },
			maxFarmSizeReached: 100_000_000,
		},
	];
	const availability = [
		{ eggId: "chocolate", maxFarmSizeReached: 1_000_000_000 },
		{ eggId: "waterballoon", maxFarmSizeReached: 10_000_000 },
	];

	assert.deepEqual(
		[...get_maximum_farm_sizes(contracts, availability)],
		[
			["chocolate", 1_000_000_000],
			["waterballoon", 10_000_000],
		],
	);
});

test("builds safe colleggtible rows when buff metadata is missing", () => {
	const maximums = new Map([["chocolate", 1_000_000_000]]);
	const rows = get_colleggtible_rows(
		[
			{
				buffsList: [],
				identifier: "chocolate",
				name: "Chocolate",
				value: 10,
			},
		],
		maximums,
	);

	assert.deepEqual(rows, [
		{
			buff_type: "INVALID",
			buff_value: 1,
			egg_value: 10,
			id: "chocolate",
			image_url: "",
			maximum_farm_size: 1_000_000_000,
			name: "Chocolate",
		},
	]);
});

test("builds colleggtible progress from all availability sources", () => {
	const backup = {
		contracts: {
			archiveList: [],
			colleggtibleMaxFarmSizeReachedList: [{ eggId: "chocolate", maxFarmSizeReached: 100_000_000 }],
			contractsList: [],
			customEggInfoList: [],
		},
	};
	const periodicals = {
		contractPlayerInfo: {
			colleggtibleMaxFarmSizeReachedList: [
				{ eggId: "chocolate", maxFarmSizeReached: 1_000_000_000 },
			],
		},
		contracts: {
			customEggsList: [
				{
					buffsList: [
						{ dimension: 1, value: 1.1 },
						{ dimension: 1, value: 1.2 },
						{ dimension: 1, value: 1.3 },
					],
					identifier: "chocolate",
					name: "Chocolate",
					value: 10,
				},
			],
		},
	};

	assert.deepEqual(build_colleggtibles(backup, periodicals), [
		{
			buff_level: 3,
			buff_type: "EARNINGS",
			buff_value: 1.3,
			egg_value: 10,
			id: "chocolate",
			image_url: "",
			maximum_farm_size: 1_000_000_000,
			name: "Chocolate",
			next_threshold: 10_000_000_000,
			remaining_to_next_threshold: 9_000_000_000,
		},
	]);
});

test("ignores incomplete contract XP evaluations", () => {
	const archive = [
		{},
		{ contract: { identifier: "missing_evaluation" } },
		{ contract: { identifier: "low" }, evaluation: { cxpChange: -5 } },
		{ contract: { identifier: "high" }, evaluation: { cxpChange: 10 } },
		{ contract: { identifier: "invalid" }, evaluation: { cxpChange: Number.NaN } },
	];

	assert.deepEqual(get_cxp_extremes(archive), {
		maximum: { contract: "high", value: 10 },
		minimum: { contract: "low", value: -5 },
	});
	assert.equal(get_cxp_extremes([{}]), undefined);
});

test("merges and summarizes contract evaluations", () => {
	const evaluation = {
		completionTime: 10,
		contractIdentifier: "contract_id",
		coopIdentifier: "coop_id",
		cxpChange: 5,
		grade: 4,
	};
	const result = build_contract_evaluations(
		{ archiveList: [{ contract: { name: "Contract" }, evaluation }] },
		{ evaluationsList: [evaluation] },
	);

	assert.equal(result.evaluations.length, 1);
	assert.equal(result.evaluations[0].contract_identifier, "contract_id");
	assert.equal(result.evaluations[0].completion_time, 10);
	assert.deepEqual(result.summary, {
		average_cxp_change: 5,
		count: 1,
		maximum_cxp_change: 5,
		minimum_cxp_change: 5,
		total_cxp_change: 5,
	});
});

test("groups active, available, and completed contracts", () => {
	const backup = {
		contracts: {
			archiveList: [{ cancelled: false, contractIdentifier: "complete", grade: 4 }],
			contractsList: [{ contractIdentifier: "active", coopIdentifier: "coop", grade: 5 }],
		},
	};
	const periodicals = {
		contracts: {
			contractsList: [
				{ identifier: "active", name: "Active" },
				{ identifier: "complete", name: "Complete" },
				{ identifier: "available", name: "Available" },
			],
		},
	};

	const contracts = build_contracts(backup, periodicals);
	assert.equal(contracts.active[0].identifier, "active");
	assert.equal(contracts.active[0].coop_id, "coop");
	assert.equal(contracts.active[0].grade.name, "AAA");
	assert.equal(contracts.available[0].identifier, "available");
	assert.equal(contracts.completed[0].state, "COMPLETED");
});

test("builds read-only mission state with snake case fields", () => {
	const missions = build_missions(
		{
			artifactsDb: {
				fuelingMission: { identifier: "fueling", resetIndex: 2 },
				missionArchiveList: [{ identifier: "archived", secondsRemaining: 0 }],
				missionInfosList: [{ identifier: "active", secondsRemaining: 10 }],
			},
			mission: { missionsList: [{ completed: true, referenceValue: 4 }] },
		},
		{ artifactCasesList: [{ success: true }] },
	);

	assert.equal(missions.fueling.reset_index, 2);
	assert.equal(missions.active[0].seconds_remaining, 10);
	assert.equal(missions.archive[0].identifier, "archived");
	assert.equal(missions.progress[0].reference_value, 4);
	assert.equal(missions.returned[0].success, true);
});
