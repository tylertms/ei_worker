import { get_contract } from "./contract.js";

function calculate_buffs(contributors, eid) {
	let deflector = 0;
	let siab = 0;

	for (const contributor of contributors) {
		if (contributor.userId === eid) continue;
		const history = contributor.buffHistoryList ?? [];
		const current = history.at(-1);
		if (!current) continue;
		deflector += typeof current.eggLayingRate === "number" ? (current.eggLayingRate - 1) * 100 : 0;
		siab += typeof current.earnings === "number" ? (current.earnings - 1) * 100 : 0;
	}

	return { deflector: Math.round(deflector), siab: Math.round(siab) };
}

async function handle(_request, context) {
	const contract = (await get_contract(context)).toObject();
	const buffs = calculate_buffs(contract.contributorsList ?? [], context.params.eid);
	return new Response(`deflector,${buffs.deflector}\nsiab,${buffs.siab}`);
}

export { calculate_buffs, handle };
