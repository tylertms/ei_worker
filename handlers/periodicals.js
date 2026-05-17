import { Buffer } from 'node:buffer';
const { decompressMessage } = require("../utils/tools");

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const pr = new context.proto.GetPeriodicalsRequest()
			.setUserId(EID)
			.setCurrentClientVersion(99);

		const b64encoded = Buffer.from(context.decoder.decode(pr.serializeBinary())).toString('base64');

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei/get_periodicals", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = await decompressMessage(context.proto.AuthenticatedMessage.deserializeBinary(text));
		const periodicals = context.proto.PeriodicalsResponse.deserializeBinary(authMessage);
		const string = JSON.stringify(periodicals.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };