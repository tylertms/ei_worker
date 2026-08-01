import { basic_request, post_message } from "../services/egg_api.js";

async function handle(_request, context) {
	const { eid, mission_id } = context.params;
	const mission = new context.proto.MissionInfo().setIdentifier(mission_id);
	const request = new context.proto.MissionRequest()
		.setRinfo(basic_request(context, eid))
		.setInfo(mission)
		.setEiUserId(eid);
	const response = await post_message(
		context,
		"/ei_afx/complete_mission",
		request,
		context.proto.CompleteMissionResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
