async function handle(request, context) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const b64encoded = btoa(context.decoder.decode(bri.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei_ctx/get_contracts_archive", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const archive = context.proto.ContractsArchive.deserializeBinary(authMessage);
		const string = JSON.stringify(archive.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };