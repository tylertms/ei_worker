import { basicRequest, getBackup, postMessage, signedRequest } from "../egg-api.js";

async function handle(_request, context) {
	const { eid, reset_index: requestedResetIndex } = context.params;
	let resetIndex = requestedResetIndex;

	if (resetIndex === undefined) {
		const backup = await getBackup(context, eid);
		resetIndex = backup.hasVirtue() ? backup.getVirtue().getResets() : 0;
	}

	const request = new context.proto.GetActiveMissionsRequest()
		.setRinfo(basicRequest(context, eid))
		.setResetIndex(resetIndex);
	const authenticated = await signedRequest(context, request);
	const response = await postMessage(
		context,
		"/ei_afx/get_active_missions_v2",
		authenticated,
		context.proto.GetActiveMissionsResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
