import assert from "node:assert/strict";
import test from "node:test";

import { build_yon_farm_info } from "../reports/yon_farm_info.js";
import { csv_row, escape_csv_cell } from "../utils/csv.js";

test("escapes CSV syntax and spreadsheet formulas", () => {
	assert.equal(escape_csv_cell('Egg, "One"'), '"Egg, ""One"""');
	assert.equal(escape_csv_cell("=SUM(1,2)"), '"\'=SUM(1,2)"');
	assert.equal(escape_csv_cell("-command"), "'-command");
	assert.equal(escape_csv_cell("-1.5"), "-1.5");
	assert.equal(csv_row(["plain", "line\nbreak", 10]), 'plain,"line\nbreak",10');
});

test("builds a stable farm report from minimal backup data", () => {
	const backup = {
		artifactsDb: {
			activeArtifactSetsList: [{ slotsList: [{ itemId: 1 }] }],
			inventoryItemsList: [
				{
					artifact: {
						spec: { level: 0, name: 0, rarity: 0 },
						stonesList: [{ level: "invalid", name: 0 }],
					},
					itemId: 1,
				},
			],
		},
		contracts: {
			archiveList: [],
			colleggtibleMaxFarmSizeReachedList: [],
			contractsList: [],
			lastCpi: { grade: 1 },
		},
		farmsList: [
			{
				cashEarned: 10,
				cashSpent: 2,
				commonResearchList: [],
				eggType: 1,
				farmType: 2,
				numChickens: 5,
			},
		],
		game: {
			boostsList: [],
			eggsOfProphecy: 2,
			epicResearchList: [],
			permitLevel: 1,
			soulEggsD: 100,
		},
	};
	const periodicals = {
		contracts: {
			customEggsList: [
				{
					buffsList: [],
					identifier: "egg_one",
					name: 'Egg, "One"',
					value: 5,
				},
			],
		},
		events: { eventsList: [{ ccOnly: false, multiplier: 2, subtitle: "=SUM(1,2)", type: 1 }] },
	};

	const report = build_yon_farm_info(backup, periodicals);
	assert.match(report, /^SE,PE,Grade,PermitLevel\n100,2,C,1/m);
	assert.match(report, /Event,"'=SUM\(1,2\)"/);
	assert.match(report, /egg_one,INVALID,1,,5,"Egg, ""One"""/);
	assert.doesNotMatch(report, /undefined|NaN/);
});
