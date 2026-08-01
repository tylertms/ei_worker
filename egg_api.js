import { Buffer as buffer } from "node:buffer";

import { create_auth_hash, decompress_message } from "./utils/tools.js";

const client_version = 73;
const max_response_length = 20_000_000;
const timeout_milliseconds = 15_000;

class upstream_error extends Error {
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
		this.expose = true;
	}
}

function basic_request(context, eid) {
	return new context.proto.BasicRequestInfo().setEiUserId(eid).setClientVersion(client_version);
}

async function post(context, path, message) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeout_milliseconds);
	const body = message
		? new URLSearchParams({
				data: buffer.from(message.serializeBinary()).toString("base64"),
			})
		: undefined;

	try {
		const response = await fetch(`${context.base_url}${path}`, {
			body,
			method: "POST",
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new upstream_error(502, "upstream_error", `Egg, Inc. returned HTTP ${response.status}`);
		}

		const response_text = await response.text();
		if (response_text.length > max_response_length) {
			throw new upstream_error(502, "upstream_error", "Egg, Inc. response was too large");
		}
		return response_text;
	} catch (error) {
		if (error instanceof upstream_error) {
			throw error;
		}
		if (controller.signal.aborted) {
			throw new upstream_error(504, "upstream_timeout", "Egg, Inc. request timed out");
		}
		throw new upstream_error(502, "upstream_unavailable", "Egg, Inc. request failed");
	} finally {
		clearTimeout(timeout);
	}
}

async function post_message(context, path, request, response_type, authenticated = true) {
	const response_text = await post(context, path, request);

	try {
		const bytes = authenticated
			? await decompress_message(
					context.proto.AuthenticatedMessage.deserializeBinary(response_text),
				)
			: response_text;
		return response_type.deserializeBinary(bytes);
	} catch {
		throw new upstream_error(502, "invalid_upstream_response", "Egg, Inc. response was invalid");
	}
}

async function signed_request(context, request) {
	const message = request.serializeBinary();
	const code = await create_auth_hash(message, context.env);
	return new context.proto.AuthenticatedMessage().setMessage(message).setCode(code);
}

async function get_backup(context, eid) {
	const request = new context.proto.EggIncFirstContactRequest()
		.setRinfo(basic_request(context, eid))
		.setEiUserId(eid)
		.setClientVersion(client_version);
	const response = await post_message(
		context,
		"/ei/bot_first_contact",
		request,
		context.proto.EggIncFirstContactResponse,
		false,
	);

	if (!response.hasBackup()) {
		throw new upstream_error(502, "invalid_upstream_response", "Egg, Inc. response had no backup");
	}

	return response.getBackup();
}

export { basic_request, client_version, get_backup, post_message, signed_request };
