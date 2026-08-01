import { to_snake_case } from "../utils/json.js";
import { get_archive } from "./archive.js";
import { get_periodicals } from "./periodicals.js";

function evaluation_record(value) {
	const evaluation = value.evaluation ?? value;
	const contract_identifier =
		evaluation.contractIdentifier ?? value.contractIdentifier ?? value.contract?.identifier ?? null;
	return {
		...to_snake_case(evaluation),
		contract_identifier,
		contract_name: value.contract?.name ?? null,
		coop_identifier: evaluation.coopIdentifier ?? value.coopIdentifier ?? null,
	};
}

function evaluation_key(evaluation) {
	return [
		evaluation.contract_identifier,
		evaluation.coop_identifier,
		evaluation.evaluation_start_time,
		evaluation.completion_time,
		evaluation.cxp,
		evaluation.cxp_change,
		evaluation.grade,
		evaluation.replay,
	].join("|");
}

function build_contract_evaluations(archive, periodicals) {
	const sources = [
		...(archive.archiveList ?? []).filter((contract) => contract.evaluation),
		...(periodicals.evaluationsList ?? []),
		...(periodicals.contractPlayerInfo?.unreadEvaluationsList ?? []),
	];
	const evaluations = [
		...new Map(
			sources.map((source) => {
				const evaluation = evaluation_record(source);
				return [evaluation_key(evaluation), evaluation];
			}),
		).values(),
	].sort(
		(first, second) =>
			(second.evaluation_start_time ?? second.completion_time ?? 0) -
			(first.evaluation_start_time ?? first.completion_time ?? 0),
	);
	const changes = evaluations.map(({ cxp_change }) => cxp_change).filter(Number.isFinite);

	return {
		evaluations,
		summary: {
			average_cxp_change:
				changes.length === 0
					? null
					: changes.reduce((total, change) => total + change, 0) / changes.length,
			count: evaluations.length,
			maximum_cxp_change: changes.length === 0 ? null : Math.max(...changes),
			minimum_cxp_change: changes.length === 0 ? null : Math.min(...changes),
			total_cxp_change: changes.reduce((total, change) => total + change, 0),
		},
	};
}

async function handle(_request, context) {
	const [archive, periodicals] = await Promise.all([
		get_archive(context),
		get_periodicals(context),
	]);
	return new Response(
		JSON.stringify(build_contract_evaluations(archive.toObject(), periodicals.toObject())),
	);
}

export { build_contract_evaluations, handle };
