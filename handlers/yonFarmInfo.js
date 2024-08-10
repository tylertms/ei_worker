const { bigNumberToString, convertGrade, getEggName, getDimension, getBuffLevel } = require("../utils/tools");
const { handle: handleBackup } = require("./backup");
const { handle: handlePeriodicals } = require('./periodicals');

async function handle(request, context) {
	try {
		const backup = JSON.parse(await (await handleBackup(request, context)).text());
		const periodicals = JSON.parse(await (await handlePeriodicals(request, context)).text());
		let csv = "";

		csv += "SE,PE,Grade,PermitLevel,";
		for (let i = 0; i < backup.game.epicResearchList.length; i++) {
			csv += backup.game.epicResearchList[i].id.toUpperCase() + ",";
		}
		csv = csv.slice(0, -1) + "\n";

		csv += bigNumberToString(backup.game.soulEggsD, 3) + "," + backup.game.eggsOfProphecy + "," + convertGrade(backup.contracts.lastCpi.grade) + "," + backup.game.permitLevel + ",";
		for (let i = 0; i < backup.game.epicResearchList.length; i++) {
			csv += backup.game.epicResearchList[i].level + ",";
		}
		csv = csv.slice(0, -1) + "\n\nEvent,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.subtitle + ",";
		});
		csv = csv.slice(0, -1) + "\nID,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.type + ",";
		});
		csv = csv.slice(0, -1) + "\nMultiplier,";
		periodicals.events.eventsList.forEach(event => {
			csv += event.multiplier + ",";
		});
		csv = csv.slice(0, -1) + "\nUltra Only,";
		periodicals.events.eventsList.forEach(event => {
			csv += (event.ccOnly ? "Yes" : "No") + ",";
		});

		let activeContracts = backup.contracts.contractsList.map(contract => contract.contract.identifier);
		backup.farmsList = backup.farmsList.filter(farm => farm.farmType == 2 || activeContracts.includes(farm.contractId));

		csv = csv.slice(0, -1) + "\n\n-,Home,";
		backup.farmsList.forEach(farm => {
			if (farm.contractId) csv += farm.contractId + ",";
		});
		csv = csv.slice(0, -1) + "\nEgg,";
		backup.farmsList.forEach(farm => {
			csv += getEggName(farm.eggType) + ",";
		});
		csv = csv.slice(0, -1) + "\nPopulation,";
		backup.farmsList.forEach(farm => {
			csv += farm.numChickens + ",";
		});
		csv = csv.slice(0, -1) + "\nToken Count,";
		backup.farmsList.forEach(farm => {
			csv += (farm.farmType == 3 ? farm.boostTokensReceived - farm.boostTokensSpent - farm.boostTokensGiven : "-") + ",";
		});
		csv = csv.slice(0, -1) + "\nCash,";
		backup.farmsList.forEach(farm => {
			console.log(farm)
			csv += bigNumberToString(farm.cashEarned - farm.cashSpent, 3) + ",";
		})
		csv = csv.slice(0, -1) + "\n";
		for (let i = 0; i < backup.farmsList[0].commonResearchList.length; i++) {
			csv += backup.farmsList[0].commonResearchList[i].id.toUpperCase() + ",";
			for (let j = 0; j < backup.farmsList.length; j++) {
				csv += backup.farmsList[j].commonResearchList[i].level + ",";
			}
			csv = csv.slice(0, -1) + "\n";
		}

		const contractsArchiveList = backup.contracts.archiveList;
		const activeContractsList = backup.contracts.contractsList;
		const combinedList = contractsArchiveList.concat(activeContractsList);

		const groupedByCustomEggId = combinedList.reduce((acc, contract) => {
			if (contract.contract.egg === 200 && contract.hasOwnProperty('maxFarmSizeReached')) {
				const key = contract.contract.customEggId;
				if (key) {
					if (!acc[key]) {
						acc[key] = [];
					}
					acc[key].push({
						maxFarmReached: contract.maxFarmSizeReached,
						customEggId: contract.contract.customEggId,
						egg: contract.contract.egg
					});
				}
			}
			return acc;
		}, {});

		let colleggtiblesSection = "\n\nColleggtibles\nID,Buff Type,Value\n";

		for (const customEggId in groupedByCustomEggId) {
			const maxFarmReachedValues = groupedByCustomEggId[customEggId].map(contract => contract.maxFarmReached);
			const maxFarmReached = Math.max(...maxFarmReachedValues);

			const customEgg = periodicals.contracts.customEggsList.find(egg => egg.identifier === customEggId);

			if (customEgg) {
				const buffLevel = getBuffLevel(maxFarmReached);

				if (!isNaN(buffLevel)) {
					const buffsList = customEgg.buffsList;

					const index = Math.min(buffsList.length - 1, buffLevel - 1); // Cap index at the last element if buffLevel exceeds bounds
					const buff = buffsList[index];
					const dimension = buff?.dimension || 0;
					const buffValue = buff ? buff.value : 'N/A'

					const buffType = getDimension(dimension);

					colleggtiblesSection += `${customEggId},${buffType},${buffValue}\n`;
				}
			} else {
				colleggtiblesSection += `${customEggId},N/A,N/A\n`;
			}
		}
		csv += colleggtiblesSection;

		csv = csv.slice(0, -1);

		return new Response(csv, { headers: { "Content-Type": "text/csv" } });
	} catch (error) {
		console.log(error);
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };
