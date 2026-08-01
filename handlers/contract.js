import { basic_request, post_message } from "../egg_api.js";

async function get_contract(context) {
	const { contract, coop, eid } = context.params;
	const request = new context.proto.ContractCoopStatusRequest()
		.setContractIdentifier(contract)
		.setCoopIdentifier(coop)
		.setUserId(eid)
		.setRinfo(basic_request(context, eid));
	return post_message(context, "/ei/coop_status", request, context.proto.ContractCoopStatusResponse);
}

async function handle(_request, context) {
	const response = await get_contract(context);
	return new Response(JSON.stringify(response.toObject()));
}

export { get_contract, handle };
