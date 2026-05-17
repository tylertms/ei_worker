const { decompressMessage } = require("../utils/tools");

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const response = await fetch(context.baseURL + "/ei_srv/subscription_status/" + EID, {
			method: "POST"
		});

		const text = await response.text();
		const authMessage = await decompressMessage(context.proto.AuthenticatedMessage.deserializeBinary(text));
		const subStatusResp = context.proto.UserSubscriptionInfo.deserializeBinary(authMessage);

		const string = JSON.stringify(subStatusResp.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };