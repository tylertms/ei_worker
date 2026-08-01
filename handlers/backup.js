import { get_backup } from "../services/egg_api.js";

async function handle(_request, context) {
	const backup = await get_backup(context, context.params.eid);
	return new Response(JSON.stringify(backup.toObject()));
}

export { handle };
