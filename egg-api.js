import { Buffer } from "node:buffer";

import { createAuthHash, decompressMessage } from "./utils/tools.js";

const clientVersion = 73;
const maxResponseLength = 20_000_000;
const timeoutMilliseconds = 15_000;

class UpstreamError extends Error {
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
		this.expose = true;
	}
}

function basicRequest(context, eid) {
	return new context.proto.BasicRequestInfo().setEiUserId(eid).setClientVersion(clientVersion);
}

async function post(context, path, message) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);
	const body = message
		? new URLSearchParams({
				data: Buffer.from(message.serializeBinary()).toString("base64"),
			})
		: undefined;

	try {
		const response = await fetch(`${context.baseURL}${path}`, {
			body,
			method: "POST",
			signal: controller.signal,
		});

		if (!response.ok) {
			throw new UpstreamError(502, "upstream_error", `Egg, Inc. returned HTTP ${response.status}`);
		}

		const text = await response.text();
		if (text.length > maxResponseLength) {
			throw new UpstreamError(502, "upstream_error", "Egg, Inc. response was too large");
		}
		return text;
	} catch (error) {
		if (error instanceof UpstreamError) {
			throw error;
		}
		if (controller.signal.aborted) {
			throw new UpstreamError(504, "upstream_timeout", "Egg, Inc. request timed out");
		}
		throw new UpstreamError(502, "upstream_unavailable", "Egg, Inc. request failed");
	} finally {
		clearTimeout(timeout);
	}
}

async function postMessage(context, path, request, ResponseType, authenticated = true) {
	const text = await post(context, path, request);

	try {
		const bytes = authenticated
			? await decompressMessage(context.proto.AuthenticatedMessage.deserializeBinary(text))
			: text;
		return ResponseType.deserializeBinary(bytes);
	} catch {
		throw new UpstreamError(502, "invalid_upstream_response", "Egg, Inc. response was invalid");
	}
}

async function signedRequest(context, request) {
	const message = request.serializeBinary();
	const code = await createAuthHash(message, context.env);
	return new context.proto.AuthenticatedMessage().setMessage(message).setCode(code);
}

async function getBackup(context, eid) {
	const request = new context.proto.EggIncFirstContactRequest()
		.setRinfo(basicRequest(context, eid))
		.setEiUserId(eid)
		.setClientVersion(clientVersion);
	const response = await postMessage(
		context,
		"/ei/bot_first_contact",
		request,
		context.proto.EggIncFirstContactResponse,
		false,
	);

	if (!response.hasBackup()) {
		throw new UpstreamError(502, "invalid_upstream_response", "Egg, Inc. response had no backup");
	}

	return response.getBackup();
}

export { basicRequest, clientVersion, getBackup, postMessage, signedRequest };
