const { bigNumberToString, convertGrade } = require("../utils/tools");
const { handle: handleBackup } = require("./backup");
const { handle: handlePeriodicals } = require('./periodicals')

async function handle(request, context) {
	//const EID = new URL(request.url).searchParams.get('EID');

	try {
		const backup = JSON.parse(await (await handleBackup(request,context)).text());
		const periodicals = JSON.parse(await (await handlePeriodicals(request,context)).text());
		console.log(periodicals)
		let csv = "";

		csv += "SE,PE,Grade,";
		for (let i = 0; i < backup.game.epicResearchList.length; i++) {
			csv += backup.game.epicResearchList[i].id.toUpperCase() + ",";
		}
		
		csv = csv.slice(0, -1) + "\n";
		csv += bigNumberToString(backup.game.soulEggsD, 3) + "," + backup.game.eggsOfProphecy + "," + convertGrade(backup.contracts.lastCpi.grade) + ","
		for (let i = 0; i < backup.game.epicResearchList.length; i++) {
			csv += backup.game.epicResearchList[i].level + ",";
		}
		csv = csv.slice(0, -1) + "\n";

		csv += "\nEvent,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.subtitle + ","
		})

		csv += "\nID,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.type + ","
		})

		csv += "\nMultiplier,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.multiplier + ","
		})

		csv += "\nUltra Only,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.ccOnly ? "Yes" : "No" + ","
		})

		// Farm-specific info (table; 6 cols, 61 rows)
		csv += "\nFarm-specific info\n";
		csv += "Labels,Population,Player's token count,Boost from coopmate's deflectors,Boost from coopmate's SiaBs,Common research\n";
		// Insert farm-specific info data here

		return new Response(csv, { headers: { "Content-Type": "text/csv" } });
	} catch (error) {
		console.log(error)
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };
