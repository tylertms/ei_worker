import { handle as active_artifacts } from "../handlers/active_artifacts.js";
import { handle as active_missions } from "../handlers/active_missions.js";
import { handle as afx_config } from "../handlers/afx_config.js";
import { handle as archive } from "../handlers/archive.js";
import { handle as artifact_inventory } from "../handlers/artifact_inventory.js";
import { handle as backup } from "../handlers/backup.js";
import { handle as colleggtibles } from "../handlers/colleggtibles.js";
import { handle as completed_mission } from "../handlers/completed_mission.js";
import { handle as contract } from "../handlers/contract.js";
import { handle as contracts } from "../handlers/contracts.js";
import { handle as coop_buffs } from "../handlers/coop_buffs.js";
import { handle as farms } from "../handlers/farms.js";
import { handle as leaderboard } from "../handlers/leaderboard.js";
import { handle as leaderboard_info } from "../handlers/leaderboard_info.js";
import { handle as minmax_cxp_change } from "../handlers/minmax_cxp_change.js";
import { handle as missions } from "../handlers/missions.js";
import { handle as periodicals } from "../handlers/periodicals.js";
import { handle as season_info } from "../handlers/season_info.js";
import { handle as sub_status } from "../handlers/sub_status.js";
import { handle as yon_farm_info } from "../handlers/yon_farm_info.js";

const json_content_type = "application/json; charset=utf-8";
const csv_content_type = "text/csv; charset=utf-8";
const text_content_type = "text/plain; charset=utf-8";

const endpoints = {
	active_artifacts: {
		handle: active_artifacts,
		optional_params: ["contract"],
		params: ["eid"],
		type: json_content_type,
	},
	active_missions: {
		handle: active_missions,
		optional_params: ["reset_index"],
		params: ["eid"],
		type: json_content_type,
	},
	afx_config: { handle: afx_config, params: ["eid"], type: json_content_type },
	archive: { handle: archive, params: ["eid"], type: json_content_type },
	artifact_inventory: { handle: artifact_inventory, params: ["eid"], type: json_content_type },
	backup: { handle: backup, params: ["eid"], type: json_content_type },
	completed_mission: {
		handle: completed_mission,
		params: ["eid", "mission_id"],
		type: json_content_type,
	},
	colleggtibles: { handle: colleggtibles, params: ["eid"], type: json_content_type },
	contract: {
		handle: contract,
		params: ["eid", "contract", "coop"],
		type: json_content_type,
	},
	contracts: { handle: contracts, params: ["eid"], type: json_content_type },
	coop_buffs: { handle: coop_buffs, params: ["eid", "contract", "coop"], type: csv_content_type },
	farms: { handle: farms, params: ["eid"], type: json_content_type },
	leaderboard: {
		handle: leaderboard,
		params: ["eid", "scope", "grade"],
		type: json_content_type,
	},
	leaderboard_info: { cache_seconds: 300, handle: leaderboard_info, type: json_content_type },
	minmax_cxp_change: { handle: minmax_cxp_change, params: ["eid"], type: text_content_type },
	missions: { handle: missions, params: ["eid"], type: json_content_type },
	periodicals: { handle: periodicals, params: ["eid"], type: json_content_type },
	season_info: { cache_seconds: 300, handle: season_info, type: json_content_type },
	sub_status: { handle: sub_status, params: ["eid"], type: json_content_type },
	yon_farm_info: { handle: yon_farm_info, params: ["eid"], type: csv_content_type },
};

const endpoint_aliases = {
	activeArtifacts: "active_artifacts",
	minmaxCxPChange: "minmax_cxp_change",
	yonFarmInfo: "yon_farm_info",
};

const parameter_rules = {
	contract: { max_length: 128 },
	coop: { max_length: 128 },
	eid: { aliases: ["EID"], max_length: 64, min_length: 3, pattern: /^[A-Za-z0-9_-]+$/ },
	grade: { integer: true, max: 5, min: 0 },
	mission_id: { aliases: ["id"], max_length: 128 },
	reset_index: { aliases: ["resetIndex"], integer: true, max: 1_000_000_000, min: 0 },
	scope: { max_length: 64, pattern: /^[A-Za-z0-9_-]+$/ },
};

export { endpoint_aliases, endpoints, json_content_type, parameter_rules };
