import { post_message } from "../services/egg_api.js";

async function handle(_request, context) {
	const response = await post_message(
		context,
		`/ei_srv/subscription_status/${encodeURIComponent(context.params.eid)}`,
		undefined,
		context.proto.UserSubscriptionInfo,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
