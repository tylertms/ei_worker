import { build_yon_farm_info } from "../reports/yon_farm_info.js";
import { get_backup } from "../services/egg_api.js";
import { get_periodicals } from "./periodicals.js";

async function handle(_request, context) {
	const [backup, periodicals] = await Promise.all([
		get_backup(context, context.params.eid),
		get_periodicals(context),
	]);
	return new Response(build_yon_farm_info(backup.toObject(), periodicals.toObject()));
}

export { handle };
