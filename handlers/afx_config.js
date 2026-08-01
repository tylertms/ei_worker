import { basic_request, post_message } from "../services/egg_api.js";

async function handle(_request, context) {
	const request = new context.proto.ArtifactsConfigurationRequest().setRinfo(
		basic_request(context, context.params.eid),
	);
	const response = await post_message(
		context,
		"/ei_afx/config",
		request,
		context.proto.ArtifactsConfigurationResponse,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
