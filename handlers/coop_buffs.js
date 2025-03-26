const { handle: handleCoopStatus } = require('./contract');

async function handle(request, context) {
    try {
        const coopStatus = JSON.parse(await (await handleCoopStatus(request, context)).text());
        const reqParams = new URL(request.url).searchParams
        const EID = reqParams.get("EID")

        let deflectorBuff = 0;
        let siabBuff = 0;

        for (const user of coopStatus.contributorsList) {
            if (user.userId === EID) {
                continue;
            }
            
            const buffHistory = user.buffHistoryList;
            if (Array.isArray(buffHistory) && buffHistory.length > 0) {
                const currentBuff = buffHistory[buffHistory.length - 1];
                deflectorBuff += currentBuff.eggLayingRate;
                siabBuff += currentBuff.earnings;
            }
        }

        const responseText = `deflector,${deflectorBuff}\nsiab,${siabBuff}`;
        
        return new Response(responseText);
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

module.exports = { handle };