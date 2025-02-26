import { Buffer } from 'node:buffer';
const { createAuthHash } = require("../utils/tools");

async function handle(request, context) {
    const searchParams = new URL(request.url).searchParams;
    const EID = searchParams.get('EID');
    const scope = searchParams.get('scope');
    const grade = searchParams.get('grade');

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

        const b64encoded = Buffer.from(context.decoder.decode(authReqMessage.serializeBinary())).toString('base64');

        const params = new URLSearchParams();
        params.append('data', b64encoded);

        const response = await fetch(context.baseURL + "/ei_ctx/get_leaderboard", {
            method: "POST",
            body: params
        });

        const text = await response.text();
        const authRespMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject();
        const lbresp = context.proto.LeaderboardResponse.deserializeBinary(authRespMessage.message);

        return new Response(JSON.stringify(lbresp.toObject()));
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

module.exports = { handle };