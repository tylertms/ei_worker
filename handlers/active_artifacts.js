import { get_backup } from "../egg_api.js";

async function handle(_request, context) {
	const backup = (await get_backup(context, context.params.eid)).toObject();
	const farm_index = context.params.contract
		? backup.farmsList.findIndex((farm) => farm.contractId === context.params.contract)
		: backup.farmsList.findIndex((farm) => farm.farmType === 2);
	const artifacts = (backup.artifactsDb.activeArtifactSetsList[farm_index]?.slotsList ?? []).map(
		(slot) => backup.artifactsDb.inventoryItemsList.find((item) => item.itemId === slot.itemId),
	);
	return new Response(JSON.stringify(artifacts));
}

export { handle };
