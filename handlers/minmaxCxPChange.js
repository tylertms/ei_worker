import { Buffer } from 'node:buffer';

async function handle(request, context) {
    const EID = new URL(request.url).searchParams.get('EID');

    try {
        const bri = new context.proto.BasicRequestInfo()
            .setEiUserId(EID)
            .setClientVersion(99);

        const b64encoded = Buffer.from(context.decoder.decode(bri.serializeBinary())).toString('base64');

        const params = new URLSearchParams();
        params.append('data', b64encoded);

        const response = await fetch(context.baseURL + "/ei_ctx/get_contracts_archive", {
            method: "POST",
            body: params
        });

        const text = await response.text();
        const authMessage = context.proto.AuthenticatedMessage.deserializeBinary(text).toObject().message;
        const archive = context.proto.ContractsArchive.deserializeBinary(authMessage);
        const string = JSON.stringify(archive.toObject());
        
        // Extract and parse the archiveList
        const archiveList = JSON.parse(string).archiveList;

        // Initialize variables to track max and min cxpChange
        let maxcxpChange = -Infinity;
        let mincxpChange = Infinity;
        let maxCxpChangeContract = null;
        let minCxpChangeContract = null;

        // Iterate through the archiveList to find max and min cxpChange
        for (const item of archiveList) {
            const cxpChange = item.evaluation.cxpChange;

            if (cxpChange !== undefined) {
                if (cxpChange > maxcxpChange) {
                    maxcxpChange = cxpChange;
                    maxCxpChangeContract = item.contract.identifier;
                }
                if (cxpChange < mincxpChange) {
                    mincxpChange = cxpChange;
                    minCxpChangeContract = item.contract.identifier;
                }
            }
        }

        // Format the output as plain text
        const outputText = `Highest cxpChange: ${maxcxpChange} for contract: ${maxCxpChangeContract}\n` +
                           `Lowest cxpChange : ${mincxpChange} for contract: ${minCxpChangeContract}`;

        // Return the results as a plain text response
        return new Response(outputText, {
            headers: { 'Content-Type': 'text/plain' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

module.exports = { handle };
