import { basic_request, post_message } from "../services/egg_api.js";

async function get_archive(context) {
	return post_message(
		context,
		"/ei_ctx/get_contracts_archive",
		basic_request(context, context.params.eid),
		context.proto.ContractsArchive,
	);
}

async function handle(_request, context) {
	const archive = await get_archive(context);
	return new Response(JSON.stringify(archive.toObject()));
}

export { get_archive, handle };
