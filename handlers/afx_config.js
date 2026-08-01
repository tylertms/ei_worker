import { basicRequest, postMessage } from "../egg-api.js";

async function handle(_request, context) {
	const request = new context.proto.ArtifactsConfigurationRequest().setRinfo(
		basicRequest(context, context.params.eid),
	);
	const response = await postMessage(
		context,
		"/ei_afx/config",
		request,
		context.proto.ArtifactsConfigurationResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
