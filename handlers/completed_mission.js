import { basicRequest, postMessage } from "../egg-api.js";

async function handle(_request, context) {
	const { eid, mission_id: missionId } = context.params;
	const mission = new context.proto.MissionInfo().setIdentifier(missionId);
	const request = new context.proto.MissionRequest()
		.setRinfo(basicRequest(context, eid))
		.setInfo(mission)
		.setEiUserId(eid);
	const response = await postMessage(
		context,
		"/ei_afx/complete_mission",
		request,
		context.proto.CompleteMissionResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
