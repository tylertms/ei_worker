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

function select_report_farms(farms, active_contract_ids) {
	return farms
		.map((farm, farm_index) => ({ farm, farm_index }))
		.filter(({ farm }) => farm.farmType === 2 || active_contract_ids.includes(farm.contractId));
}

export { find_farm_index, get_active_artifacts, select_report_farms };
