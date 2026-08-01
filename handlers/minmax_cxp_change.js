import { get_archive } from "./archive.js";

async function handle(_request, context) {
	const archive = (await get_archive(context)).toObject().archiveList;
	let maximum = { contract: null, value: -Infinity };
	let minimum = { contract: null, value: Infinity };

	for (const item of archive) {
		const value = item.evaluation.cxpChange;
		if (value > maximum.value) {
			maximum = { contract: item.contract.identifier, value };
		}
		if (value < minimum.value) {
			minimum = { contract: item.contract.identifier, value };
		}
	}

	const output =
		`Highest cxpChange: ${maximum.value} for contract: ${maximum.contract}\n` +
		`Lowest cxpChange : ${minimum.value} for contract: ${minimum.contract}`;
	return new Response(output);
}

export { handle };
