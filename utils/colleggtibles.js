import { get_buff_level, get_dimension } from "./tools.js";

function set_maximum(maximums, egg_id, value) {
	if (!egg_id || !Number.isFinite(value)) return;
	maximums.set(egg_id, Math.max(maximums.get(egg_id) ?? 0, value));
}

function get_maximum_farm_sizes(contracts, availability) {
	const maximums = new Map();
	for (const local_contract of contracts) {
		if (local_contract.contract?.egg === 200) {
			set_maximum(maximums, local_contract.contract.customEggId, local_contract.maxFarmSizeReached);
		}
	}
	for (const entry of availability) {
		set_maximum(maximums, entry.eggId, entry.maxFarmSizeReached);
	}
	return maximums;
}

function get_colleggtible_rows(custom_eggs, maximums) {
	return custom_eggs.map((custom_egg) => {
		const maximum_farm_size = maximums.get(custom_egg.identifier) ?? 0;
		const buff_level = get_buff_level(maximum_farm_size);
		const buffs = custom_egg.buffsList ?? [];
		const buff_index = Math.min(buffs.length - 1, buff_level - 1);
		const buff = buff_level > 0 ? buffs[buff_index] : undefined;
		return {
			buff_type: get_dimension(buffs[0]?.dimension ?? 0),
			buff_value: buff?.value ?? 1,
			egg_value: custom_egg.value,
			id: custom_egg.identifier,
			image_url: custom_egg.icon?.url ?? "",
			maximum_farm_size,
			name: custom_egg.name,
		};
	});
}

export { get_colleggtible_rows, get_maximum_farm_sizes };
