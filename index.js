import proto from "./ei_pb.cjs";
import { handle as activeMissions } from "./handlers/active_missions.js";
import { handle as activeArtifacts } from "./handlers/activeArtifacts.js";
import { handle as afxConfig } from "./handlers/afx_config.js";
import { handle as archive } from "./handlers/archive.js";
import { handle as backup } from "./handlers/backup.js";
import { handle as completedMission } from "./handlers/completed_mission.js";
import { handle as contract } from "./handlers/contract.js";
import { handle as coopBuffs } from "./handlers/coop_buffs.js";
import { handle as leaderboard } from "./handlers/leaderboard.js";
import { handle as leaderboardInfo } from "./handlers/leaderboard_info.js";
import { handle as minmaxCxpChange } from "./handlers/minmaxCxPChange.js";
import { handle as periodicals } from "./handlers/periodicals.js";
import { handle as seasonInfo } from "./handlers/season_info.js";
import { handle as subStatus } from "./handlers/sub_status.js";
import { handle as yonFarmInfo } from "./handlers/yonFarmInfo.js";

const baseURL = "https://ctx-dot-auxbrainhome.appspot.com";
const json = "application/json; charset=utf-8";
const csv = "text/csv; charset=utf-8";
const text = "text/plain; charset=utf-8";

const endpoints = {
	active_artifacts: {
		handle: activeArtifacts,
		optionalParams: ["contract"],
		params: ["eid"],
		type: json,
	},
	active_missions: {
		handle: activeMissions,
		optionalParams: ["reset_index"],
		params: ["eid"],
		type: json,
	},
	afx_config: { handle: afxConfig, params: ["eid"], type: json },
	archive: { handle: archive, params: ["eid"], type: json },
	backup: { handle: backup, params: ["eid"], type: json },
	completed_mission: { handle: completedMission, params: ["eid", "mission_id"], type: json },
	contract: { handle: contract, params: ["eid", "contract", "coop"], type: json },
	coop_buffs: { handle: coopBuffs, params: ["eid", "contract", "coop"], type: csv },
	leaderboard: { handle: leaderboard, params: ["eid", "scope", "grade"], type: json },
	leaderboard_info: { handle: leaderboardInfo, type: json },
	minmax_cxp_change: { handle: minmaxCxpChange, params: ["eid"], type: text },
	periodicals: { handle: periodicals, params: ["eid"], type: json },
	season_info: { handle: seasonInfo, type: json },
	sub_status: { handle: subStatus, params: ["eid"], type: json },
	yon_farm_info: { handle: yonFarmInfo, params: ["eid"], type: csv },
};

const endpointAliases = {
	activeArtifacts: "active_artifacts",
	minmaxCxPChange: "minmax_cxp_change",
	yonFarmInfo: "yon_farm_info",
};

const parameterRules = {
	contract: { maxLength: 128 },
	coop: { maxLength: 128 },
	eid: { aliases: ["EID"], maxLength: 64, minLength: 3, pattern: /^[A-Za-z0-9_-]+$/ },
	grade: { integer: true, max: 5, min: 0 },
	mission_id: { aliases: ["id"], maxLength: 128 },
	reset_index: { aliases: ["resetIndex"], integer: true, max: 1_000_000_000, min: 0 },
	scope: { integer: true, max: 1, min: 0 },
};

const publicHeaders = {
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Max-Age": "86400",
	"Cross-Origin-Resource-Policy": "cross-origin",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
};

class ApiError extends Error {
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
		this.expose = true;
	}
}

function parseParameters(url, endpoint) {
	const required = endpoint.params ?? [];
	const optional = endpoint.optionalParams ?? [];
	const names = [...required, ...optional];
	const allowed = new Set(names.flatMap((name) => [name, ...(parameterRules[name].aliases ?? [])]));

	for (const name of url.searchParams.keys()) {
		if (!allowed.has(name)) {
			throw new ApiError(400, "unknown_parameter", `Unknown parameter: ${name}`);
		}
	}

	const params = {};
	const usedAliases = [];
	for (const name of names) {
		const rule = parameterRules[name];
		const entries = [name, ...(rule.aliases ?? [])].flatMap((key) =>
			url.searchParams.getAll(key).map((value) => ({ key, value })),
		);

		if (entries.length === 0) {
			if (required.includes(name)) {
				throw new ApiError(400, "missing_parameter", `Missing required parameter: ${name}`);
			}
			continue;
		}

		if (new Set(entries.map(({ value }) => value)).size > 1) {
			throw new ApiError(400, "conflicting_parameter", `Conflicting values for parameter: ${name}`);
		}

		let value = entries[0].value;
		if (rule.integer) {
			if (!/^\d+$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) {
				throw new ApiError(400, "invalid_parameter", `Invalid parameter: ${name}`);
			}
			value = Number(value);
		} else if (
			value.length < (rule.minLength ?? 1) ||
			value.length > rule.maxLength ||
			(rule.pattern && !rule.pattern.test(value))
		) {
			throw new ApiError(400, "invalid_parameter", `Invalid parameter: ${name}`);
		}

		params[name] = value;
		usedAliases.push(
			...entries.filter(({ key }) => key !== name).map(({ key }) => ({ key, name })),
		);
	}

	return { params, usedAliases };
}

function successorUrl(requestUrl, path, usedAliases) {
	const url = new URL(requestUrl);
	url.pathname = `/${path}`;
	for (const { key, name } of usedAliases) {
		const value = url.searchParams.get(key);
		url.searchParams.delete(key);
		if (!url.searchParams.has(name) && value !== null) {
			url.searchParams.set(name, value);
		}
	}
	return url.toString();
}

function addHeaders(response, type, successor) {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(publicHeaders)) {
		headers.set(name, value);
	}
	headers.set("Cache-Control", headers.get("Cache-Control") ?? "no-store");
	if (type) {
		headers.set("Content-Type", type);
	}
	if (successor) {
		headers.set("Deprecation", "true");
		headers.set("Link", `<${successor}>; rel="successor-version"`);
	}
	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	});
}

function errorResponse(error) {
	if (!error?.expose) {
		console.error(error);
	}
	const status = error?.expose ? error.status : 500;
	const code = error?.expose ? error.code : "internal_error";
	const message = error?.expose ? error.message : "Internal server error";
	return new Response(JSON.stringify({ error: { code, message } }), {
		headers: { "Content-Type": json },
		status,
	});
}

async function handleRequest(request, env) {
	const url = new URL(request.url);
	const requestedPath = url.pathname.replace(/^\/+|\/+$/g, "");
	const path = endpointAliases[requestedPath] ?? requestedPath;
	const endpoint = endpoints[path];

	try {
		if (!endpoint) {
			throw new ApiError(404, "endpoint_not_found", `Endpoint not found: ${requestedPath}`);
		}
		if (request.method === "OPTIONS") {
			return addHeaders(new Response(null, { status: 204 }));
		}
		if (request.method !== "GET") {
			return addHeaders(new Response(null, { headers: { Allow: "GET, OPTIONS" }, status: 405 }));
		}

		const { params, usedAliases } = parseParameters(url, endpoint);
		const response = await endpoint.handle(request, { baseURL, env, params, proto });
		const deprecated = requestedPath !== path || usedAliases.length > 0;
		const successor = deprecated ? successorUrl(request.url, path, usedAliases) : undefined;
		return addHeaders(response, endpoint.type, successor);
	} catch (error) {
		return addHeaders(errorResponse(error));
	}
}

export { handleRequest };

export default {
	fetch: handleRequest,
};
