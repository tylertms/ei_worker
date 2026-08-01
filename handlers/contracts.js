import { get_backup } from "../services/egg_api.js";
import { convert_grade, get_egg_name } from "../utils/tools.js";
import { get_periodicals } from "./periodicals.js";

function get_contract_id(contract) {
	return contract.contract?.identifier ?? contract.contractIdentifier ?? contract.identifier;
}

function format_goal(goal) {
	return {
		reward_amount: goal.rewardAmount ?? 0,
		reward_sub_type: goal.rewardSubType ?? "",
		reward_type: goal.rewardType ?? 0,
		target_amount: goal.targetAmount ?? 0,
		target_soul_eggs: goal.targetSoulEggs ?? 0,
		type: goal.type ?? 0,
	};
}

function format_contract(definition, local, state) {
	const grade_id = local?.grade ?? 0;
	const grade_spec = definition?.gradeSpecsList?.find((spec) => spec.grade === grade_id);
	const egg_id = definition?.egg ?? local?.contract?.egg ?? 0;
	const custom_egg_id =
		definition?.customEggId ?? local?.contract?.customEggId ?? local?.customEggId;
	return {
		accepted: local?.accepted ?? false,
		cancelled: local?.cancelled ?? false,
		coop_allowed: definition?.coopAllowed ?? false,
		coop_id: local?.coopIdentifier ?? null,
		custom_egg_id: custom_egg_id ?? null,
		description: definition?.description ?? local?.contract?.description ?? "",
		egg: { id: egg_id, name: custom_egg_id ?? get_egg_name(egg_id) },
		expiration_time: definition?.expirationTime ?? null,
		grade: { id: grade_id, name: convert_grade(grade_id) },
		goals: (grade_spec?.goalsList ?? definition?.goalsList ?? []).map(format_goal),
		identifier: get_contract_id(local ?? definition),
		length_seconds: grade_spec?.lengthSeconds ?? definition?.lengthSeconds ?? 0,
		max_boosts: definition?.maxBoosts ?? 0,
		max_coop_size: definition?.maxCoopSize ?? 0,
		minutes_per_token: definition?.minutesPerToken ?? 0,
		name: definition?.name ?? local?.contract?.name ?? "",
		num_goals_achieved: local?.numGoalsAchieved ?? 0,
		season_id: definition?.seasonId ?? null,
		start_time: definition?.startTime ?? null,
		state,
		time_accepted: local?.timeAccepted ?? null,
	};
}

function build_contracts(backup, periodicals) {
	const definitions = periodicals.contracts?.contractsList ?? [];
	const definitions_by_id = new Map(
		definitions.map((contract) => [get_contract_id(contract), contract]),
	);
	const active = backup.contracts?.contractsList ?? [];
	const completed = backup.contracts?.archiveList ?? [];
	const claimed_ids = new Set([...active, ...completed].map(get_contract_id));

	return {
		active: active.map((local) =>
			format_contract(
				definitions_by_id.get(get_contract_id(local)) ?? local.contract,
				local,
				"ACTIVE",
			),
		),
		available: definitions
			.filter((definition) => !claimed_ids.has(get_contract_id(definition)))
			.map((definition) => format_contract(definition, undefined, "AVAILABLE")),
		completed: completed.map((local) =>
			format_contract(
				definitions_by_id.get(get_contract_id(local)) ?? local.contract,
				local,
				local.cancelled ? "CANCELLED" : "COMPLETED",
			),
		),
	};
}

async function handle(_request, context) {
	const [backup, periodicals] = await Promise.all([
		get_backup(context, context.params.eid),
		get_periodicals(context),
	]);
	return new Response(JSON.stringify(build_contracts(backup.toObject(), periodicals.toObject())));
}

export { build_contracts, handle };
