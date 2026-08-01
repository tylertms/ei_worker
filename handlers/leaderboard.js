import { basicRequest, postMessage, signedRequest } from "../egg-api.js";

async function handle(_request, context) {
	const { eid, grade, scope } = context.params;
	const request = new context.proto.LeaderboardRequest()
		.setRinfo(basicRequest(context, eid))
		.setScope(scope)
		.setGrade(grade);
	const authenticated = await signedRequest(context, request);
	const response = await postMessage(
		context,
		"/ei_ctx/get_leaderboard",
		authenticated,
		context.proto.LeaderboardResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
