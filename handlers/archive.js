import { Buffer } from 'node:buffer';
const { decompressMessage } = require("../utils/tools");

async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const b64encoded = Buffer.from(bri.serializeBinary()).toString('base64');

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei_ctx/get_contracts_archive", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = await decompressMessage(context.proto.AuthenticatedMessage.deserializeBinary(text));
		const archive = context.proto.ContractsArchive.deserializeBinary(authMessage);
		const string = JSON.stringify(archive.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };