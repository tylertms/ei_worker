import { get_backup } from "../services/egg_api.js";
import { format_artifact, get_active_artifacts } from "../utils/artifacts.js";
import { get_egg_name } from "../utils/tools.js";

function get_contract_id(local_contract) {
	return local_contract.contract?.identifier ?? local_contract.contractIdentifier;
}

function get_egg(farm, contracts) {
	const name = get_egg_name(farm.eggType);
	if (name !== "CUSTOM" && name !== "CUSTOM_EGG") return { id: farm.eggType ?? 0, name };
	const local_contract = contracts.find(
		(contract) => get_contract_id(contract) === farm.contractId,
	);
	return {
		id: farm.eggType ?? 0,
		name: local_contract?.contract?.customEggId ?? local_contract?.customEggId ?? farm.contractId,
	};
}

function get_farm_type(farm_type) {
	if (farm_type === 2) return "HOME";
	if (farm_type === 3) return "CONTRACT";
	return "UNKNOWN";
}

function build_farms(backup) {
	const contracts = [
		...(backup.contracts?.contractsList ?? []),
		...(backup.contracts?.archiveList ?? []),
	];
	const coops = new Map(
		(backup.contracts?.contractsList ?? []).map((contract) => [
			get_contract_id(contract),
			contract.coopIdentifier ?? null,
		]),
	);

	return (backup.farmsList ?? []).map((farm, index) => ({
		active_boosts: (farm.activeBoostsList ?? []).map(({ boostId, timeRemaining }) => ({
			boost_id: boostId,
			time_remaining: timeRemaining,
		})),
		cash: {
			earned: farm.cashEarned ?? 0,
			net: (farm.cashEarned ?? 0) - (farm.cashSpent ?? 0),
			spent: farm.cashSpent ?? 0,
			unclaimed: farm.unclaimedCash ?? 0,
		},
		contract_id: farm.contractId ?? null,
		coop_id: coops.get(farm.contractId) ?? null,
		egg: get_egg(farm, contracts),
		equipped_artifacts: get_active_artifacts(backup.artifactsDb, index).map(format_artifact),
		index,
		population: {
			hatchery: farm.hatcheryPopulation ?? 0,
			running: farm.numChickensRunning ?? 0,
			total: farm.numChickens ?? 0,
			unsettled: farm.numChickensUnsettled ?? 0,
		},
		production: {
			eggs_laid: farm.eggsLaid ?? 0,
			eggs_paid_for: farm.eggsPaidFor ?? 0,
			eggs_shipped: farm.eggsShipped ?? 0,
		},
		research: (farm.commonResearchList ?? []).map(({ id, level }) => ({ id, level })),
		tokens:
			farm.farmType === 3
				? {
						balance:
							(farm.boostTokensReceived ?? 0) -
							(farm.boostTokensSpent ?? 0) -
							(farm.boostTokensGiven ?? 0),
						given: farm.boostTokensGiven ?? 0,
						next_seconds: farm.gametimeUntilNextBoostToken ?? 0,
						received: farm.boostTokensReceived ?? 0,
						spent: farm.boostTokensSpent ?? 0,
						unclaimed: farm.unclaimedBoostTokens ?? 0,
					}
				: null,
		type: get_farm_type(farm.farmType),
	}));
}

async function handle(_request, context) {
	const backup = (await get_backup(context, context.params.eid)).toObject();
	return new Response(JSON.stringify(build_farms(backup)));
}

export { build_farms, handle };
