const proto = require('./ei_pb');
const decoder = new TextDecoder('utf-8');
const baseURL = "https://ctx-dot-auxbrainhome.appspot.com"

async function handleFirstContactRequest(request) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const bri = new proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const fcr = new proto.EggIncFirstContactRequest()
			.setRinfo(bri)
			.setEiUserId(EID);

		const b64encoded = btoa(decoder.decode(fcr.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(baseURL + "/ei/bot_first_contact", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const fcresp = proto.EggIncFirstContactResponse.deserializeBinary(text);
		const string = JSON.stringify(fcresp.toObject().backup);

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}


async function handleContractArchiveRequest(request) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const bri = new proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const b64encoded = btoa(decoder.decode(bri.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(baseURL + "/ei_ctx/get_contracts_archive", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const archive = proto.ContractsArchive.deserializeBinary(authMessage);
		const string = JSON.stringify(archive.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

async function handleContractInfoRequest(request) {
	const reqParams = new URL(request.url).searchParams
	let EID = reqParams.get("EID")
	let contract = reqParams.get("contract");
	let coop = reqParams.get("coop")

	try {
		const bri = new proto.BasicRequestInfo()
			.setEiUserId(EID)
			.setClientVersion(99);

		const ccsr = new proto.ContractCoopStatusRequest()
			.setContractIdentifier(contract)
			.setCoopIdentifier(coop)
			.setUserId(EID)
			.setRinfo(bri)

		const b64encoded = btoa(decoder.decode(ccsr.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(baseURL + "/ei/coop_status", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const contractInfo = proto.ContractCoopStatusResponse.deserializeBinary(authMessage);
		const string = JSON.stringify(contractInfo.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

async function handlePeriodicalsRequest(request) {
	const EID = new URL(request.url).searchParams.get('EID');

	try {
		const pr = new proto.GetPeriodicalsRequest()
			.setUserId(EID)
			.setCurrentClientVersion(99)

		const b64encoded = btoa(decoder.decode(pr.serializeBinary()));

		const params = new URLSearchParams();
		params.append('data', b64encoded);

		const response = await fetch(baseURL + "/ei/get_periodicals", {
			method: "POST",
			body: params
		});

		const text = await response.text();
		const authMessage = proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
		const periodicals = proto.PeriodicalsResponse.deserializeBinary(authMessage);
		const string = JSON.stringify(periodicals.toObject());

		return new Response(string);
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}


async function handleRequest(request) {
	const path = new URL(request.url).pathname;

	// Route requests to appropriate handlers based on the path
	switch (path) {
		case '/backup':
			return handleFirstContactRequest(request);
		case '/archive':
			return handleContractArchiveRequest(request);
		case '/contract':
			return handleContractInfoRequest(request);
		case '/periodicals':
			return handlePeriodicalsRequest(request);
		default:
			return new Response('Not found', { status: 404 });
	}
}

export default {
	fetch: handleRequest,
};
