import { postMessage } from "../egg-api.js";

async function handle(_request, context) {
	const response = await postMessage(
		context,
		"/ei_ctx/get_leaderboard_info",
		undefined,
		context.proto.LeaderboardInfo,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
