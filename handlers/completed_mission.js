import { Buffer } from 'node:buffer';

async function handle(request, context) {
    const searchParams = new URL(request.url).searchParams;
    const EID = searchParams.get('EID');
    const missionId = searchParams.get('id');

    try {
        const basicRequestInfo = new context.proto.BasicRequestInfo()
            .setEiUserId(EID)
            .setClientVersion(99);

        const missionInfo = new context.proto.MissionInfo()
            .setIdentifier(missionId);

        const missionRequest = new context.proto.MissionRequest()
            .setRinfo(basicRequestInfo)
            .setInfo(missionInfo)
            .setEiUserId(EID);

        const b64encoded = Buffer.from(context.decoder.decode(missionRequest.serializeBinary())).toString('base64');
        
        const params = new URLSearchParams();
        params.append('data', b64encoded);
        

        const response = await fetch(context.baseURL + "/ei_afx/complete_mission", {
            method: "POST",
            body: params
        });

        const text = await response.text();
        
        const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject();
        const compMissResp = context.proto.CompleteMissionResponse.deserializeBinary(authMessage.message);
        const string = JSON.stringify(compMissResp.toObject());

        return new Response(string);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

module.exports = { handle };