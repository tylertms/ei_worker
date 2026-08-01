import { get_backup } from "../services/egg_api.js";
import { to_snake_case } from "../utils/json.js";
import { get_periodicals } from "./periodicals.js";

function build_missions(backup, periodicals) {
	const database = backup.artifactsDb ?? {};
	return to_snake_case({
		active: database.missionInfosList ?? [],
		archive: database.missionArchiveList ?? [],
		fueling: database.fuelingMission ?? null,
		progress: backup.mission?.missionsList ?? [],
		returned: periodicals.artifactCasesList ?? [],
		virtueFueling: database.virtueAfxDb?.fuelingMission ?? null,
	});
}

async function handle(_request, context) {
	const [backup, periodicals] = await Promise.all([
		get_backup(context, context.params.eid),
		get_periodicals(context),
	]);
	return new Response(JSON.stringify(build_missions(backup.toObject(), periodicals.toObject())));
}

export { build_missions, handle };
