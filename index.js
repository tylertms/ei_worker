import { endpoint_aliases, endpoints } from "./api_schema.js";
import proto from "./ei_pb.cjs";
import { add_headers, api_error, error_response, parse_parameters, successor_url } from "./http.js";

const base_url = "https://ctx-dot-auxbrainhome.appspot.com";

async function handle_request(request, env, execution_context) {
	const url = new URL(request.url);
	const requested_path = url.pathname.replace(/^\/+|\/+$/g, "");
	const path = endpoint_aliases[requested_path] ?? requested_path;
	const endpoint = endpoints[path];

	try {
		if (!endpoint) {
			throw new api_error(404, "endpoint_not_found", `Endpoint not found: ${requested_path}`);
		}
		if (request.method === "OPTIONS") {
			return add_headers(new Response(null, { status: 204 }));
		}
		if (request.method !== "GET") {
			return add_headers(new Response(null, { headers: { Allow: "GET, OPTIONS" }, status: 405 }));
		}

		const { params, used_aliases } = parse_parameters(url, endpoint);
		const cache = endpoint.cache_seconds ? globalThis.caches?.default : undefined;
		const cached_response = await cache?.match(request);
		if (cached_response) return cached_response;
		const response = await endpoint.handle(request, { base_url, env, params, proto });
		const deprecated = requested_path !== path || used_aliases.length > 0;
		const successor = deprecated ? successor_url(request.url, path, used_aliases) : undefined;
		const cache_control = endpoint.cache_seconds
			? `public, max-age=${endpoint.cache_seconds}, s-maxage=${endpoint.cache_seconds}`
			: undefined;
		const public_response = add_headers(response, endpoint.type, successor, cache_control);
		if (cache && public_response.ok) {
			const cache_write = cache.put(request, public_response.clone());
			if (execution_context) execution_context.waitUntil(cache_write);
			else await cache_write;
		}
		return public_response;
	} catch (error) {
		return add_headers(error_response(error));
	}
}

export { handle_request };

export default {
	fetch: handle_request,
};
