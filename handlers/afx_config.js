import { Buffer } from 'node:buffer';

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');
	try {

		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const acr = new context.proto.ArtifactsConfigurationRequest()
			.setRinfo(bri);

		const b64encoded = Buffer.from(context.decoder.decode(acr.serializeBinary())).toString('base64');

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei_afx/config", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const fcresp = context.proto.ArtifactsConfigurationResponse.deserializeBinary(authMessage);
		const string = JSON.stringify(fcresp.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };