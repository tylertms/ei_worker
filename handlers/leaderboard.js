import { Buffer } from 'node:buffer';

async function hashExample(message, env) {
    const magic = env.MAGIC;
    const data = new Uint8Array(message.length + magic.length);
    data.set(message, 0);
    data[env.INDEX % message.length] = env.MARKER;
    for (let i = 0; i < magic.length; i++) {
        data[message.length + i] = magic.charCodeAt(i);
    }
    const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function handle(request, context) {
    const EID = new URL(request.url).searchParams.get('EID');
    const scope = new URL(request.url).searchParams.get('scope');
    const grade = new URL(request.url).searchParams.get('grade');

    try {
        const bri = new context.proto.BasicRequestInfo()
            .setEiUserId(EID)
            .setClientVersion(99);

        const leaderboardRequest = new context.proto.LeaderboardRequest()
            .setRinfo(bri)
            .setScope(scope)
            .setGrade(grade);

        const rawMessage = leaderboardRequest.serializeBinary();

		const code = await hashExample(rawMessage, context.env);

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