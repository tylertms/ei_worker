import { get_backup } from "../services/egg_api.js";
import { format_artifact } from "../utils/artifacts.js";
import { get_artifact_level, get_artifact_name } from "../utils/tools.js";

function format_item(item) {
	return { ...format_artifact(item), server_id: item.serverId ?? null };
}

function format_set(set, index) {
	return {
		index,
		slots: (set.slotsList ?? []).map((slot) => ({
			item_id: slot.itemId ?? null,
			occupied: slot.occupied ?? Boolean(slot.itemId),
		})),
		uid: set.uid ?? null,
	};
}

function format_status(status) {
	const spec = status.spec ?? {};
	return {
		count: status.count ?? 0,
		craftable: status.craftable ?? false,
		discovered: status.discovered ?? false,
		recipe_discovered: status.recipeDiscovered ?? false,
		seen: status.seen ?? false,
		tier: get_artifact_level(spec.level),
		tier_id: spec.level ?? 0,
		type: get_artifact_name(spec.name),
		type_id: spec.name ?? 0,
	};
}

function format_database(database) {
	const items = (database?.inventoryItemsList ?? []).map(format_item);
	return {
		active_sets: (database?.activeArtifactSetsList ?? []).map(format_set),
		items,
		saved_sets: (database?.savedArtifactSetsList ?? []).map(format_set),
		statuses: (database?.artifactStatusList ?? []).map(format_status),
		total_quantity: items.reduce((total, item) => total + item.quantity, 0),
	};
}

function build_artifact_inventory(backup) {
	const inventory = format_database(backup.artifactsDb);
	return {
		...inventory,
		crafting_xp: backup.artifacts?.craftingXp ?? 0,
		inventory_score: backup.artifacts?.inventoryScore ?? 0,
		item_sequence: backup.artifactsDb?.itemSequence ?? 0,
		virtue: format_database(backup.artifactsDb?.virtueAfxDb),
	};
}

async function handle(_request, context) {
	const backup = (await get_backup(context, context.params.eid)).toObject();
	return new Response(JSON.stringify(build_artifact_inventory(backup)));
}

export { build_artifact_inventory, handle };
