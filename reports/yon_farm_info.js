import { api_error } from "../api/errors.js";
import { get_active_artifacts, select_report_farms } from "../utils/artifacts.js";
import { get_colleggtible_rows, get_maximum_farm_sizes } from "../utils/colleggtibles.js";
import { csv_row } from "../utils/csv.js";
import {
	big_number_to_string,
	convert_grade,
	get_artifact_level,
	get_artifact_name,
	get_artifact_rarity,
	get_egg_name,
} from "../utils/tools.js";

const boost_ids = [
	"jimbos_blue",
	"jimbos_blue_v2",
	"jimbos_blue_big",
	"jimbos_purple",
	"jimbos_purple_v2",
	"jimbos_purple_big",
	"jimbos_orange",
	"jimbos_orange_big",
	"subsidy_application",
	"blank_check",
	"money_printer",
	"tachyon_prism_blue",
	"tachyon_prism_blue_v2",
	"tachyon_prism_blue_big",
	"tachyon_prism_purple",
	"tachyon_prism_purple_v2",
	"tachyon_prism_purple_big",
	"tachyon_prism_orange",
	"tachyon_prism_orange_big",
	"soul_beacon_blue",
	"soul_beacon_blue_v2",
	"soul_beacon_purple",
	"soul_beacon_purple_v2",
	"soul_beacon_orange",
	"boost_beacon_blue",
	"boost_beacon_purple",
	"boost_beacon_blue_big",
	"boost_beacon_orange",
	"soul_mirror_blue",
	"soul_mirror_purple",
	"soul_mirror_orange",
	"quantum_bulb",
	"dilithium_bulb",
];

function require_report_data(backup, periodicals) {
	if (!backup.game || !backup.contracts || !backup.farmsList?.length || !periodicals.contracts) {
		throw new api_error(502, "invalid_upstream_response", "Backup data was incomplete");
	}
}

function get_farm_egg_name(farm, contracts) {
	const egg_name = get_egg_name(farm.eggType);
	if (egg_name !== "CUSTOM") return egg_name;
	const matching_contract = contracts.find(
		(local_contract) => local_contract.contract?.identifier === farm.contractId,
	);
	return matching_contract?.contract?.customEggId ?? farm.contractId ?? "CUSTOM";
}

function get_artifact_rows(backup, farm_records) {
	const rows = [
		["Farm", "ArtifactType", "ArtifactRarity", "ArtifactTier", "Stone1", "Stone2", "Stone3"],
	];
	for (const { farm, farm_index } of farm_records) {
		for (const inventory_item of get_active_artifacts(backup.artifactsDb, farm_index)) {
			const artifact = inventory_item.artifact;
			if (!artifact?.spec) continue;
			const stones = (artifact.stonesList ?? []).slice(0, 3).map((stone) => {
				const parsed_level = Number.parseInt(stone.level, 10);
				const level = Number.isNaN(parsed_level) ? "UNKNOWN" : parsed_level + 2;
				return `${get_artifact_name(stone.name)}_${level}`;
			});
			rows.push([
				farm.contractId ?? "Home",
				get_artifact_name(artifact.spec.name),
				get_artifact_rarity(artifact.spec.rarity),
				get_artifact_level(artifact.spec.level),
				...stones,
			]);
		}
	}
	return rows;
}

function append_profile(lines, backup) {
	const research = backup.game.epicResearchList ?? [];
	lines.push(
		csv_row(["SE", "PE", "Grade", "PermitLevel", ...research.map(({ id }) => id.toUpperCase())]),
	);
	lines.push(
		csv_row([
			big_number_to_string(backup.game.soulEggsD ?? 0, 3),
			backup.game.eggsOfProphecy ?? 0,
			convert_grade(backup.contracts.lastCpi?.grade),
			backup.game.permitLevel ?? 0,
			...research.map(({ level }) => level),
		]),
	);
}

function append_events(lines, periodicals) {
	const events = periodicals.events?.eventsList ?? [];
	lines.push("");
	lines.push(csv_row(["Event", ...events.map(({ subtitle }) => subtitle)]));
	lines.push(csv_row(["ID", ...events.map(({ type }) => type)]));
	lines.push(csv_row(["Multiplier", ...events.map(({ multiplier }) => multiplier)]));
	lines.push(csv_row(["Ultra Only", ...events.map(({ ccOnly }) => (ccOnly ? "Yes" : "No"))]));
}

function append_farms(lines, farm_records, contracts) {
	const farms = farm_records.map(({ farm }) => farm);
	lines.push("");
	lines.push(csv_row(["-", ...farms.map((farm) => farm.contractId ?? "Home")]));
	lines.push(csv_row(["Egg", ...farms.map((farm) => get_farm_egg_name(farm, contracts))]));
	lines.push(csv_row(["Population", ...farms.map(({ numChickens }) => numChickens ?? 0)]));
	lines.push(
		csv_row([
			"Token Count",
			...farms.map((farm) =>
				farm.farmType === 3
					? (farm.boostTokensReceived ?? 0) -
						(farm.boostTokensSpent ?? 0) -
						(farm.boostTokensGiven ?? 0)
					: "-",
			),
		]),
	);
	lines.push(
		csv_row([
			"Cash",
			...farms.map((farm) =>
				big_number_to_string((farm.cashEarned ?? 0) - (farm.cashSpent ?? 0), 3),
			),
		]),
	);
}

function append_research(lines, backup, farm_records) {
	const home_record = farm_records.find(({ farm }) => farm.farmType === 2);
	if (!home_record) {
		throw new api_error(502, "invalid_upstream_response", "Backup data had no home farm");
	}
	const research_ids = (home_record.farm.commonResearchList ?? []).map(({ id }) => id);
	const research_by_farm = farm_records.map(
		({ farm }) => new Map((farm.commonResearchList ?? []).map((item) => [item.id, item.level])),
	);
	const boosts = new Map((backup.game.boostsList ?? []).map((item) => [item.boostId, item.count]));
	const artifact_rows = get_artifact_rows(backup, farm_records);
	const row_count = Math.max(research_ids.length, boost_ids.length, artifact_rows.length);

	for (let index = 0; index < row_count; index += 1) {
		const research_id = research_ids[index];
		const row = [
			research_id?.toUpperCase() ?? "",
			...research_by_farm.map((items) => (research_id ? (items.get(research_id) ?? "") : "")),
		];
		while (row.length < 10) row.push("");
		const boost_id = boost_ids[index];
		row.push(boost_id ?? "", boost_id ? (boosts.get(boost_id) ?? 0) : "");
		row.push(...(artifact_rows[index] ?? []));
		lines.push(csv_row(row));
	}
}

function append_coops(lines, farm_records, active_contracts) {
	const coops = new Map(
		active_contracts.map((local_contract) => [
			local_contract.contract?.identifier,
			local_contract.coopIdentifier,
		]),
	);
	lines.push(
		csv_row([
			"coop",
			...farm_records.map(({ farm }) =>
				farm.contractId ? (coops.get(farm.contractId) ?? "") : "Home",
			),
		]),
	);
}

function append_colleggtibles(lines, backup, periodicals, contracts) {
	const maximums = get_maximum_farm_sizes(
		contracts,
		backup.contracts.colleggtibleMaxFarmSizeReachedList ?? [],
	);
	const rows = get_colleggtible_rows(periodicals.contracts.customEggsList ?? [], maximums);
	lines.push("", "Colleggtibles");
	lines.push(csv_row(["ID", "Buff Type", "Buff Value", "Image URL", "Egg Value", "Name"]));
	for (const row of rows) {
		lines.push(
			csv_row([row.id, row.buff_type, row.buff_value, row.image_url, row.egg_value, row.name]),
		);
	}
}

function build_yon_farm_info(backup, periodicals) {
	require_report_data(backup, periodicals);
	const active_contracts = backup.contracts.contractsList ?? [];
	const contracts = [...(backup.contracts.archiveList ?? []), ...active_contracts];
	const active_contract_ids = active_contracts
		.map((local_contract) => local_contract.contract?.identifier)
		.filter(Boolean);
	const selected_records = select_report_farms(backup.farmsList, active_contract_ids);
	const home_record = selected_records.find(({ farm }) => farm.farmType === 2);
	const farm_records = [
		home_record,
		...selected_records.filter((record) => record !== home_record),
	].filter(Boolean);
	const lines = [];

	append_profile(lines, backup);
	append_events(lines, periodicals);
	append_farms(lines, farm_records, contracts);
	append_research(lines, backup, farm_records);
	append_coops(lines, farm_records, active_contracts);
	append_colleggtibles(lines, backup, periodicals, contracts);
	return lines.join("\n");
}

export { build_yon_farm_info };
