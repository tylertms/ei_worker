import { getBackup } from "../egg-api.js";

async function handle(_request, context) {
	const backup = (await getBackup(context, context.params.eid)).toObject();
	const farmIndex = context.params.contract
		? backup.farmsList.findIndex((farm) => farm.contractId === context.params.contract)
		: backup.farmsList.findIndex((farm) => farm.farmType === 2);
	const artifacts = (backup.artifactsDb.activeArtifactSetsList[farmIndex]?.slotsList ?? []).map(
		(slot) => backup.artifactsDb.inventoryItemsList.find((item) => item.itemId === slot.itemId),
	);
	return new Response(JSON.stringify(artifacts));
}

export { handle };
