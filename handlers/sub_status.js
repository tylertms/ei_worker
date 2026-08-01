import { postMessage } from "../egg-api.js";

async function handle(_request, context) {
	const response = await postMessage(
		context,
		`/ei_srv/subscription_status/${encodeURIComponent(context.params.eid)}`,
		undefined,
		context.proto.UserSubscriptionInfo,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
