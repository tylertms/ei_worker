import { basicRequest, postMessage } from "../egg-api.js";

async function getContract(context) {
	const { contract, coop, eid } = context.params;
	const request = new context.proto.ContractCoopStatusRequest()
		.setContractIdentifier(contract)
		.setCoopIdentifier(coop)
		.setUserId(eid)
		.setRinfo(basicRequest(context, eid));
	return postMessage(context, "/ei/coop_status", request, context.proto.ContractCoopStatusResponse);
}

async function handle(_request, context) {
	const response = await getContract(context);
	return new Response(JSON.stringify(response.toObject()));
}

export { getContract, handle };
