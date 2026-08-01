import { post_message } from "../egg_api.js";

async function handle(_request, context) {
	const response = await post_message(
		context,
		"/ei_ctx/get_season_infos_v2",
		undefined,
		context.proto.ContractSeasonInfos,
	);
	return new Response(JSON.stringify(response.toObject()));
}

export { handle };
