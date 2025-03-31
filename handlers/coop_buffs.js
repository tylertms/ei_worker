const { handle: handleCoopStatus } = require("./contract");

async function handle(request, context) {
	try {
		const coopStatus = JSON.parse(
			await (await handleCoopStatus(request, context)).text()
		);
		const reqParams = new URL(request.url).searchParams;
		const EID = reqParams.get("EID");

		let deflectorBuff = 0;
		let siabBuff = 0;

		for (const user of coopStatus.contributorsList) {
			if (user.userId === EID) {
				continue;
			}

			const buffHistory = user.buffHistoryList;
			if (Array.isArray(buffHistory) && buffHistory.length > 0) {
				const currentBuff = buffHistory[buffHistory.length - 1];

				const currentDeflectorBuff =
					currentBuff && typeof currentBuff.eggLayingRate === "number"
						? (currentBuff.eggLayingRate - 1) * 100
						: 0;

				const currentSiabBuff =
					currentBuff && typeof currentBuff.earnings === "number"
						? (currentBuff.earnings - 1) * 100
						: 0;

				deflectorBuff += Math.round(currentDeflectorBuff);
				siabBuff += Math.round(currentSiabBuff);
			}
		}

		const responseText = `deflector,${deflectorBuff}\nsiab,${siabBuff}`;

		return new Response(responseText, {
			headers: { "Content-Type": "text/csv" },
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
		});
	}
}

module.exports = { handle };
