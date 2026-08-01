import { api_error } from "../errors.js";
import { get_archive } from "./archive.js";

function get_cxp_extremes(archive) {
	let maximum;
	let minimum;
	for (const item of archive) {
		const value = item.evaluation?.cxpChange;
		const contract = item.contract?.identifier;
		if (!Number.isFinite(value) || !contract) continue;
		if (!maximum || value > maximum.value) maximum = { contract, value };
		if (!minimum || value < minimum.value) minimum = { contract, value };
	}
	return maximum && minimum ? { maximum, minimum } : undefined;
}

async function handle(_request, context) {
	const archive = (await get_archive(context)).toObject().archiveList ?? [];
	const extremes = get_cxp_extremes(archive);
	if (!extremes) {
		throw new api_error(404, "no_evaluations", "No contract XP evaluations were found");
	}
	const output =
		`Highest cxpChange: ${extremes.maximum.value} for contract: ${extremes.maximum.contract}\n` +
		`Lowest cxpChange : ${extremes.minimum.value} for contract: ${extremes.minimum.contract}`;
	return new Response(output);
}

export { get_cxp_extremes, handle };
