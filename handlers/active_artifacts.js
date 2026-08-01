import { api_error } from "../api/errors.js";
import { get_backup } from "../services/egg_api.js";
import { find_farm_index, get_active_artifacts } from "../utils/artifacts.js";

async function handle(_request, context) {
	const backup = (await get_backup(context, context.params.eid)).toObject();
	const farm_index = find_farm_index(backup.farmsList, context.params.contract);
	if (farm_index < 0) {
		throw new api_error(404, "farm_not_found", "Requested farm was not found");
	}
	const artifacts = get_active_artifacts(backup.artifactsDb, farm_index);
	return new Response(JSON.stringify(artifacts));
}

export { handle };
