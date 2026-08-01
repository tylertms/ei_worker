import assert from "node:assert/strict";
import test from "node:test";

import { calculate_buffs } from "../handlers/coop_buffs.js";
import { get_cxp_extremes } from "../handlers/minmax_cxp_change.js";
import { find_farm_index, get_active_artifacts, select_report_farms } from "../utils/artifacts.js";
import { get_colleggtible_rows, get_maximum_farm_sizes } from "../utils/colleggtibles.js";

test("calculates current coop buffs without cumulative rounding error", () => {
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

test("preserves original farm indexes when report farms are filtered", () => {
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

test("prefers the highest v73 colleggtible availability value", () => {
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
