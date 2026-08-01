import { clientVersion, postMessage } from "../egg-api.js";

async function handle(_request, context) {
	const request = new context.proto.GetPeriodicalsRequest()
		.setUserId(context.params.eid)
		.setCurrentClientVersion(clientVersion);
	const response = await postMessage(
		context,
		"/ei/get_periodicals",
		request,
		context.proto.PeriodicalsResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
