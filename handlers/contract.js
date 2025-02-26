import { Buffer } from 'node:buffer';

async function handle(request, context) {
	const reqParams = new URL(request.url).searchParams
	const EID = reqParams.get("EID")
	const contract = reqParams.get("contract");
	const coop = reqParams.get("coop")

	try {
		const bri = new context.proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const ccsr = new context.proto.ContractCoopStatusRequest()
			.setContractIdentifier(contract)
			.setCoopIdentifier(coop)
			.setUserId(EID)
			.setRinfo(bri)

		const b64encoded = Buffer.from(context.decoder.decode(ccsr.serializeBinary())).toString('base64');

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(context.baseURL + "/ei/coop_status", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const contractInfo = context.proto.ContractCoopStatusResponse.deserializeBinary(authMessage);
		const string = JSON.stringify(contractInfo.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };