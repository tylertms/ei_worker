import { json_content_type, parameter_rules } from "./api_schema.js";

const public_headers = {
	"Access-Control-Allow-Headers": "Content-Type",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Max-Age": "86400",
	"Cross-Origin-Resource-Policy": "cross-origin",
	"Referrer-Policy": "no-referrer",
	"X-Content-Type-Options": "nosniff",
};

class api_error extends Error {
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
		this.expose = true;
	}
}

function parse_parameters(url, endpoint) {
	const required = endpoint.params ?? [];
	const optional = endpoint.optional_params ?? [];
	const names = [...required, ...optional];
	const allowed = new Set(
		names.flatMap((name) => [name, ...(parameter_rules[name].aliases ?? [])]),
	);

	for (const name of url.searchParams.keys()) {
		if (!allowed.has(name)) {
			throw new api_error(400, "unknown_parameter", `Unknown parameter: ${name}`);
		}
	}

	const params = {};
	const used_aliases = [];
	for (const name of names) {
		const rule = parameter_rules[name];
		const entries = [name, ...(rule.aliases ?? [])].flatMap((key) =>
			url.searchParams.getAll(key).map((value) => ({ key, value })),
		);

		if (entries.length === 0) {
			if (required.includes(name)) {
				throw new api_error(400, "missing_parameter", `Missing required parameter: ${name}`);
			}
			continue;
		}

		if (new Set(entries.map(({ value }) => value)).size > 1) {
			throw new api_error(
				400,
				"conflicting_parameter",
				`Conflicting values for parameter: ${name}`,
			);
		}

		let value = entries[0].value;
		if (rule.integer) {
			if (!/^\d+$/.test(value) || Number(value) < rule.min || Number(value) > rule.max) {
				throw new api_error(400, "invalid_parameter", `Invalid parameter: ${name}`);
			}
			value = Number(value);
		} else if (
			value.length < (rule.min_length ?? 1) ||
			value.length > rule.max_length ||
			(rule.pattern && !rule.pattern.test(value))
		) {
			throw new api_error(400, "invalid_parameter", `Invalid parameter: ${name}`);
		}

		params[name] = value;
		used_aliases.push(
			...entries.filter(({ key }) => key !== name).map(({ key }) => ({ key, name })),
		);
	}

	return { params, used_aliases };
}

function successor_url(request_url, path, used_aliases) {
	const url = new URL(request_url);
	url.pathname = `/${path}`;
	for (const { key, name } of used_aliases) {
		const value = url.searchParams.get(key);
		url.searchParams.delete(key);
		if (!url.searchParams.has(name) && value !== null) {
			url.searchParams.set(name, value);
		}
	}
	return url.toString();
}

function add_headers(response, type, successor) {
	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(public_headers)) {
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

function error_response(error) {
	if (!error?.expose) {
		console.error(error);
	}
	const status = error?.expose ? error.status : 500;
	const code = error?.expose ? error.code : "internal_error";
	const message = error?.expose ? error.message : "Internal server error";
	return new Response(JSON.stringify({ error: { code, message } }), {
		headers: { "Content-Type": json_content_type },
		status,
	});
}

export { add_headers, api_error, error_response, parse_parameters, successor_url };
