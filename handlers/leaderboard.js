import { Buffer } from 'node:buffer';
import { createAuthHash, decompressMessage } from "../utils/tools.js";

async function handle(request, context) {
    const { eid: EID, grade, scope } = context.params;

    try {
        const bri = new context.proto.BasicRequestInfo()
            .setEiUserId(EID)
            .setClientVersion(99);

        const leaderboardRequest = new context.proto.LeaderboardRequest()
            .setRinfo(bri)
            .setScope(scope)
            .setGrade(grade);

        const rawMessage = leaderboardRequest.serializeBinary();

		const code = await createAuthHash(rawMessage, context.env);

		const authReqMessage = new context.proto.AuthenticatedMessage()
            .setMessage(rawMessage)
            .setCode(code);

        const b64encoded = Buffer.from(authReqMessage.serializeBinary()).toString('base64');

        const params = new URLSearchParams();
        params.append('data', b64encoded);

        const response = await fetch(context.baseURL + "/ei_ctx/get_leaderboard", {
            method: "POST",
            body: params
        });

        const text = await response.text();
        const authMessage = await decompressMessage(context.proto.AuthenticatedMessage.deserializeBinary(text));
        const lbresp = context.proto.LeaderboardResponse.deserializeBinary(authMessage);

        return new Response(JSON.stringify(lbresp.toObject()));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export { handle };
