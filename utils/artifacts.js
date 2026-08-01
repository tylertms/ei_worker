function find_farm_index(farms, contract) {
	return contract
		? farms.findIndex((farm) => farm.contractId === contract)
		: farms.findIndex((farm) => farm.farmType === 2);
}

function get_active_artifacts(artifacts_database, farm_index) {
	const slots = artifacts_database?.activeArtifactSetsList?.[farm_index]?.slotsList ?? [];
	const inventory = new Map(
		(artifacts_database?.inventoryItemsList ?? []).map((item) => [item.itemId, item]),
	);
	return slots.map((slot) => inventory.get(slot.itemId)).filter(Boolean);
}

function format_artifact(item) {
	const spec = item.artifact?.spec ?? {};
	return {
		item_id: item.itemId ?? 0,
		quantity: item.quantity ?? 0,
		rarity: get_artifact_rarity(spec.rarity),
		rarity_id: spec.rarity ?? 0,
		stones: (item.artifact?.stonesList ?? []).map((stone) => ({
			level: stone.level,
			name: get_artifact_name(stone.name),
			name_id: stone.name ?? 0,
		})),
		tier: get_artifact_level(spec.level),
		tier_id: spec.level ?? 0,
		type: get_artifact_name(spec.name),
		type_id: spec.name ?? 0,
	};
}

function select_report_farms(farms, active_contract_ids) {
	return farms
		.map((farm, farm_index) => ({ farm, farm_index }))
		.filter(({ farm }) => farm.farmType === 2 || active_contract_ids.includes(farm.contractId));
}

import { get_artifact_level, get_artifact_name, get_artifact_rarity } from "./tools.js";

export { find_farm_index, format_artifact, get_active_artifacts, select_report_farms };
