import { basic_request, get_backup, post_message, signed_request } from "../services/egg_api.js";

async function handle(_request, context) {
	const { eid, reset_index: requested_reset_index } = context.params;
	let reset_index = requested_reset_index;

	if (reset_index === undefined) {
		const backup = await get_backup(context, eid);
		reset_index = backup.hasVirtue() ? backup.getVirtue().getResets() : 0;
	}

	const request = new context.proto.GetActiveMissionsRequest()
		.setRinfo(basic_request(context, eid))
		.setResetIndex(reset_index);
	const authenticated = await signed_request(context, request);
	const response = await post_message(
		context,
		"/ei_afx/get_active_missions_v2",
		authenticated,
		context.proto.GetActiveMissionsResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
