const { bigNumberToString, convertGrade, getEggName, getDimension, getBuffLevel } = require("../utils/tools");
const { handle: handleBackup } = require("./backup");
const { handle: handlePeriodicals } = require('./periodicals');

async function handle(request, context) {
	try {
		const backup = JSON.parse(await (await handleBackup(request, context)).text());
		const periodicals = JSON.parse(await (await handlePeriodicals(request, context)).text());
		let csv = "";

		// Existing CSV generation code
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

		const filteredEntries = combinedList.filter(contract => contract.contract?.egg === 200);

		//console.log("Filtered Entries:", filteredEntries);

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

		// Log grouped data
		console.log("Grouped By Custom Egg ID:", groupedByCustomEggId);

		let colleggtiblesSection = "\n\nColleggtibles\nID,Buff Type,Value\n";

		for (const customEggId in groupedByCustomEggId) {
			// Extract maxFarmReached values
			const maxFarmReachedValues = groupedByCustomEggId[customEggId].map(contract => contract.maxFarmReached);
			const maxFarmReached = Math.max(...maxFarmReachedValues);

			// Find the corresponding custom egg from customEggsList
			const customEgg = periodicals.contracts.customEggsList.find(egg => egg.identifier === customEggId);

			if (customEgg) {
				// Determine the buff level based on maxFarmReached
				const buffLevel = getBuffLevel(maxFarmReached);
				console.log(`For ${customEggId} maxFarmReached is ${maxFarmReached}`)
				if (!isNaN(buffLevel)) {

					// Find the corresponding buff from buffsList
					const buffsList = customEgg.buffsList;

					// Log buffsList and buffLevel for debugging
					console.log(`Buffs List for ${customEggId}:`, buffsList);
					console.log('Calculated Buff Level:', buffLevel);

					// Ensure buffLevel is within the bounds of buffsList
					const index = Math.min(buffsList.length - 1, buffLevel - 1); // Cap index at the last element if buffLevel exceeds bounds
					const buff = buffsList[index];
					const dimension = buff?.dimension || 0; // Use dimension of the selected buff
					const buffValue = buff ? buff.value : 'Not found bruh'
					console.log('Calculated Buff Value:', buffValue)

					// Use getDimension function to get the dimension name
					const buffType = getDimension(dimension);

					// Append to Colleggtibles section
					colleggtiblesSection += `${customEggId},${buffType},${buffValue}\n`;
				}
			} else {
				colleggtiblesSection += `${customEggId},Not found,Not found\n`;
			}
		}

		// Append Colleggtibles section to CSV
		csv += colleggtiblesSection;

		csv = csv.slice(0, -1);

		return new Response(csv, { headers: { "Content-Type": "text/csv" } });
	} catch (error) {
		console.log(error);
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
}

module.exports = { handle };
