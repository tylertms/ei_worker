import { Buffer } from 'node:buffer';

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {

		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const fcr = new context.proto.EggIncFirstContactRequest()
			.setRinfo(bri)
			.setEiUserId(EID);

		const b64encoded = Buffer.from(context.decoder.decode(fcr.serializeBinary())).toString('base64');

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei/bot_first_contact", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const fcresp = context.proto.EggIncFirstContactResponse.deserializeBinary(text);
		const string = JSON.stringify(fcresp.toObject().backup);

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };