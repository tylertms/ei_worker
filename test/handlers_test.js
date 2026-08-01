import assert from "node:assert/strict";
import test from "node:test";

import { calculate_buffs } from "../handlers/coop_buffs.js";

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
