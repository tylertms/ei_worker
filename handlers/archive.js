import { basicRequest, postMessage } from "../egg-api.js";

async function getArchive(context) {
	return postMessage(
		context,
		"/ei_ctx/get_contracts_archive",
		basicRequest(context, context.params.eid),
		context.proto.ContractsArchive,
	);
}

async function handle(_request, context) {
	const archive = await getArchive(context);
	return new Response(JSON.stringify(archive.toObject()));
}

export { getArchive, handle };
