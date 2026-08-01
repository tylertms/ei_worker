import assert from "node:assert/strict";
import test from "node:test";

import { calculate_buffs } from "../handlers/coop_buffs.js";
import { find_farm_index, get_active_artifacts, select_report_farms } from "../utils/artifacts.js";

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
