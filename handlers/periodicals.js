import { client_version, post_message } from "../services/egg_api.js";

async function get_periodicals(context) {
	const request = new context.proto.GetPeriodicalsRequest()
		.setUserId(context.params.eid)
		.setCurrentClientVersion(client_version);
	return post_message(context, "/ei/get_periodicals", request, context.proto.PeriodicalsResponse);
}

async function handle(_request, context) {
	const response = await get_periodicals(context);
	return new Response(JSON.stringify(response.toObject()));
}

export { get_periodicals, handle };
