async function handle(request, context) {
	try {
		const response = await fetch(context.baseURL + "/ei_ctx/get_leaderboard_info", {
			method: "POST"
		});

		const text = await response.text();
		const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const lbresp = context.proto.LeaderboardInfo.deserializeBinary(authMessage);

		const string = JSON.stringify(lbresp.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };