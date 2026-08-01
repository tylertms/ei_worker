import { basic_request, post_message, signed_request } from "../services/egg_api.js";

async function handle(_request, context) {
	const { eid, grade, scope } = context.params;
	const request = new context.proto.LeaderboardRequest()
		.setRinfo(basic_request(context, eid))
		.setScope(scope)
		.setGrade(grade);
	const authenticated = await signed_request(context, request);
	const response = await post_message(
		context,
		"/ei_ctx/get_leaderboard",
		authenticated,
		context.proto.LeaderboardResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
