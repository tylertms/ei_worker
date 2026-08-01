import { client_version, post_message } from "../egg_api.js";

async function handle(_request, context) {
	const request = new context.proto.GetPeriodicalsRequest()
		.setUserId(context.params.eid)
		.setCurrentClientVersion(client_version);
	const response = await post_message(
		context,
		"/ei/get_periodicals",
		request,
		context.proto.PeriodicalsResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
