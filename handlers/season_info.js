async function handle(request, context) {
	try {
		const response = await fetch(context.baseURL + "/ei_ctx/get_season_infos_v2", {
			method: "POST"
		});

		const text = await response.text();
		console.log(text);
		const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject();
		const lbresp = context.proto.ContractSeasonInfos.deserializeBinary(authMessage.message);
		const string = JSON.stringify(lbresp.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };