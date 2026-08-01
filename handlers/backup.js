import { getBackup } from "../egg-api.js";

async function handle(_request, context) {
	const backup = await getBackup(context, context.params.eid);
	return new Response(JSON.stringify(backup.toObject()));
}

export { handle };
