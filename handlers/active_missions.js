import { Buffer } from "node:buffer";
const { createAuthHash } = require("../utils/tools");

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get("EID");

	try {
		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const fcr = new context.proto.EggIncFirstContactRequest()
			.setRinfo(bri)
			.setEiUserId(EID);

		const fcrEncoded = Buffer.from(
			context.decoder.decode(fcr.serializeBinary()),
		).toString("base64");

		const fcrParams = new URLSearchParams();
		fcrParams.append("data", fcrEncoded);

		const fcrResponse = await fetch(context.baseURL + "/ei/bot_first_contact", {
			method: "POST",
			body: fcrParams,
		});

		const fcrText = await fcrResponse.text();
		const fcrResp =
			context.proto.EggIncFirstContactResponse.deserializeBinary(fcrText);
		const resetCount = fcrResp.getBackup().getVirtue().getResets();

		const getActiveMissionsReq = new context.proto.GetActiveMissionsRequest()
			.setRinfo(bri)
			.setResetIndex(resetCount);

		console.log(getActiveMissionsReq.toObject());

		const rawMessage = getActiveMissionsReq.serializeBinary();

		const code = await createAuthHash(rawMessage, context.env);

		const authReqMessage = new context.proto.AuthenticatedMessage()
			.setMessage(rawMessage)
			.setCode(code);

		const b64encoded = Buffer.from(
			context.decoder.decode(authReqMessage.serializeBinary()),
		).toString("base64");

		const params = new URLSearchParams();
		params.append("data", b64encoded);

		const response = await fetch(
			context.baseURL + "/ei_afx/get_active_missions_v2",
			{
				method: "POST",
				body: params,
			},
		);

		const text = await response.text();
		const authRespMessage =
			context.proto.AuthenticatedMessage.deserializeBinary(text).toObject();
		const activeMissionsResp =
			context.proto.GetActiveMissionsResponse.deserializeBinary(
				authRespMessage.message,
			);
		const string = JSON.stringify(activeMissionsResp.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
		});
	}
}

module.exports = { handle };
