import { to_snake_case } from "../utils/json.js";
import { convert_grade } from "../utils/tools.js";
import { get_contract } from "./contract.js";

function current_buffs(contributor) {
	const current = contributor.buffHistoryList?.at(-1);
	const percentage = (multiplier) =>
		multiplier ? Number((Math.max(0, multiplier - 1) * 100).toFixed(6)) : 0;
	return {
		deflector_percent: percentage(current?.eggLayingRate),
		siab_percent: percentage(current?.earnings),
	};
}

function build_coop_summary(contract) {
	const members = [...(contract.contributorsList ?? [])]
		.sort((first, second) => (second.contributionAmount ?? 0) - (first.contributionAmount ?? 0))
		.map((contributor, index) => ({
			active: contributor.active ?? false,
			boost_tokens: contributor.boostTokens ?? 0,
			boost_tokens_spent: contributor.boostTokensSpent ?? 0,
			buffs: current_buffs(contributor),
			chicken_run_cooldown: contributor.chickenRunCooldown ?? 0,
			colleggtible_info: to_snake_case(contributor.colleggtibleInfo ?? null),
			delivered: contributor.contributionAmount ?? 0,
			finalized: contributor.finalized ?? false,
			production: to_snake_case(contributor.productionParams ?? null),
			production_rate: contributor.contributionRate ?? 0,
			rank: index + 1,
			recently_active: contributor.recentlyActive ?? false,
			soul_power: contributor.soulPower ?? 0,
			time_cheat_detected: contributor.timeCheatDetected ?? false,
			user_id: contributor.userId ?? null,
			user_name: contributor.userName ?? "",
		}));

	return {
		all_goals_achieved: contract.allGoalsAchieved ?? false,
		all_members_reporting: contract.allMembersReporting ?? false,
		cleared_for_exit: contract.clearedForExit ?? false,
		contract_id: contract.contractIdentifier ?? null,
		coop_id: contract.coopIdentifier ?? null,
		creator_id: contract.creatorId ?? null,
		grade: { id: contract.grade ?? 0, name: convert_grade(contract.grade) },
		grace_period_seconds_remaining: contract.gracePeriodSecondsRemaining ?? 0,
		members,
		public: contract.pb_public ?? false,
		response_status: contract.responseStatus ?? 0,
		seconds_remaining: contract.secondsRemaining ?? 0,
		total_amount: contract.totalAmount ?? 0,
	};
}

async function handle(_request, context) {
	const contract = (await get_contract(context)).toObject();
	return new Response(JSON.stringify(build_coop_summary(contract)));
}

export { build_coop_summary, handle };
