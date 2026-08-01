import { decompressMessage } from "../utils/tools.js";

async function handle(request, context) {
	const { eid: EID } = context.params;

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

export { handle };
