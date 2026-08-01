import { get_backup } from "../services/egg_api.js";
import { convert_grade, get_egg_name } from "../utils/tools.js";
import { get_periodicals } from "./periodicals.js";

function build_player_summary(backup, periodicals) {
	const game = backup.game ?? {};
	const contracts = backup.contracts ?? {};
	const contract_player = periodicals.contractPlayerInfo ?? contracts.lastCpi ?? {};
	const artifacts = backup.artifacts ?? {};
	const artifact_database = backup.artifactsDb ?? {};
	const subscription = backup.subInfo ?? {};
	const farms = backup.farmsList ?? [];
	const home_farm = farms.find((farm) => farm.farmType === 2);

	return {
		artifacts: {
			active_missions: artifact_database.missionInfosList?.length ?? 0,
			crafting_xp: artifacts.craftingXp ?? 0,
			enabled: artifacts.enabled ?? false,
			inventory_items: artifact_database.inventoryItemsList?.length ?? 0,
			inventory_score: artifacts.inventoryScore ?? 0,
			returned_missions: periodicals.artifactCasesList?.length ?? 0,
		},
		contracts: {
			active: contracts.contractsList?.length ?? 0,
			completed: contracts.archiveList?.length ?? 0,
			grade: {
				id: contract_player.grade ?? 0,
				name: convert_grade(contract_player.grade),
			},
			grade_progress: contract_player.gradeProgress ?? 0,
			grade_score: contract_player.gradeScore ?? 0,
			issues: contract_player.issuesList ?? [],
			season_cxp: contract_player.seasonCxp ?? 0,
			total_cxp: contract_player.totalCxp ?? 0,
		},
		ei_user_id: backup.eiUserId ?? null,
		farms: {
			contracts: farms.filter((farm) => farm.farmType === 3).length,
			home_population: home_farm?.numChickens ?? 0,
			total: farms.length,
		},
		game: {
			current_farm: game.currentFarm ?? 0,
			eggs_of_prophecy: game.eggsOfProphecy ?? 0,
			golden_eggs: (game.goldenEggsEarned ?? 0) - (game.goldenEggsSpent ?? 0),
			max_egg: { id: game.maxEggReached ?? 0, name: get_egg_name(game.maxEggReached) },
			permit_level: game.permitLevel ?? 0,
			shell_scripts: (game.shellScriptsEarned ?? 0) - (game.shellScriptsSpent ?? 0),
			soul_eggs: game.soulEggsD ?? game.soulEggs ?? 0,
		},
		subscription: {
			auto_renew: subscription.autoRenew ?? false,
			level: subscription.subscriptionLevel ?? 0,
			period_end: subscription.periodEnd ?? null,
			status: subscription.status ?? 0,
		},
		user_name: backup.userName ?? "",
	};
}

async function handle(_request, context) {
	const [backup, periodicals] = await Promise.all([
		get_backup(context, context.params.eid),
		get_periodicals(context),
	]);
	return new Response(
		JSON.stringify(build_player_summary(backup.toObject(), periodicals.toObject())),
	);
}

export { build_player_summary, handle };
