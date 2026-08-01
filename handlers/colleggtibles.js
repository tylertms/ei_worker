import { get_backup } from "../services/egg_api.js";
import { get_colleggtible_rows, get_maximum_farm_sizes } from "../utils/colleggtibles.js";
import { get_buff_level } from "../utils/tools.js";
import { get_periodicals } from "./periodicals.js";

const thresholds = [10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000];

function merge_custom_eggs(...groups) {
	return [...new Map(groups.flat().map((egg) => [egg.identifier, egg])).values()];
}

function build_colleggtibles(backup, periodicals) {
	const contracts = backup.contracts ?? {};
	const contract_history = [...(contracts.archiveList ?? []), ...(contracts.contractsList ?? [])];
	const availability = [
		...(contracts.colleggtibleMaxFarmSizeReachedList ?? []),
		...(periodicals.contractPlayerInfo?.colleggtibleMaxFarmSizeReachedList ?? []),
	];
	const maximums = get_maximum_farm_sizes(contract_history, availability);
	const custom_eggs = merge_custom_eggs(
		contracts.customEggInfoList ?? [],
		periodicals.contracts?.customEggsList ?? [],
	);

	return get_colleggtible_rows(custom_eggs, maximums).map((row) => {
		const buff_level = get_buff_level(row.maximum_farm_size);
		const next_threshold = thresholds[buff_level] ?? null;
		return {
			...row,
			buff_level,
			next_threshold,
			remaining_to_next_threshold:
				next_threshold === null ? 0 : Math.max(0, next_threshold - row.maximum_farm_size),
		};
	});
}

async function handle(_request, context) {
	const [backup, periodicals] = await Promise.all([
		get_backup(context, context.params.eid),
		get_periodicals(context),
	]);
	return new Response(
		JSON.stringify(build_colleggtibles(backup.toObject(), periodicals.toObject())),
	);
}

export { build_colleggtibles, handle };
