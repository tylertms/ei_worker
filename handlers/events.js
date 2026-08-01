import { to_snake_case } from "../utils/json.js";
import { get_periodicals } from "./periodicals.js";

function build_events(periodicals) {
	return (periodicals.events?.eventsList ?? [])
		.map((event) => ({
			...to_snake_case(event),
			end_time:
				typeof event.startTime === "number" && typeof event.duration === "number"
					? event.startTime + event.duration
					: null,
		}))
		.sort((first, second) => (first.seconds_remaining ?? 0) - (second.seconds_remaining ?? 0));
}

async function handle(_request, context) {
	const periodicals = (await get_periodicals(context)).toObject();
	return new Response(JSON.stringify(build_events(periodicals)));
}

export { build_events, handle };
