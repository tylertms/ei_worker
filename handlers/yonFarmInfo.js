const { bigNumberToString, convertGrade, getEggName, getDimension, getBuffLevel } = require("../utils/tools");
const { handle: handleBackup } = require("./backup");
const { handle: handlePeriodicals } = require('./periodicals');

async function handle(request, context) {
	try {
		const backup = JSON.parse(await (await handleBackup(request, context)).text());
		const periodicals = JSON.parse(await (await handlePeriodicals(request, context)).text());
		let csv = "";

		const contractsArchiveList = backup.contracts.archiveList;
		const activeContractsList = backup.contracts.contractsList;
		const combinedContractsList = contractsArchiveList.concat(activeContractsList);

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
			let eggName = getEggName(farm.eggType)
			if (eggName === "CUSTOM") {
				let matchingContract = combinedContractsList.find(contract => contract.contract.identifier === farm.contractId).contract
				if (matchingContract) {
					eggName = matchingContract.customEggId;
				}
			}
			csv += eggName + ",";
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
			csv += bigNumberToString(farm.cashEarned - farm.cashSpent, 3) + ",";
		})
		csv = csv.slice(0, -1) + "\n";
		for (let i = 0; i < backup.farmsList[0].commonResearchList.length; i++) {
			let tempLine = "";
			tempLine += backup.farmsList[0].commonResearchList[i].id.toUpperCase() + ",";
			for (let j = 0; j < backup.farmsList.length; j++) {
				tempLine += backup.farmsList[j].commonResearchList[i].level + ",";
			}
			if (i < boostIds.length) {
				const commaCount = (tempLine.match(/,/g) || []).length; 
				if (commaCount < 10) {
					tempLine = tempLine.padEnd(tempLine.length + (10 - commaCount), ",");
				}
				tempLine += boostIds[i] + ","
				const boost = backup.game.boostsList.find(boost => boost.boostId === boostIds[i]);
				tempLine += (boost ? boost.count : "0") + ",";
			}
			tempLine = tempLine.slice(0, -1) + "\n";
			csv += tempLine
		}
		
		csv = csv.slice(0, -1) + "\ncoop,Home,";
		const activeCoops = activeContractsList.reduce((result, contract) => {
			result[contract.contract.identifier] = contract.coopIdentifier;
			return result;
		}, {});
		
		backup.farmsList.forEach(farm => {
			if (farm.contractId) {
				csv += activeCoops[farm.contractId] + ",";
			}
		});

		const groupedByCustomEggId = combinedContractsList.reduce((acc, contract) => {
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

		let colleggtiblesSection = "\n\nColleggtibles\nID,Buff Type,Buff Value,Image URL,Egg Value,Name\n";

		for (const customEgg of periodicals.contracts.customEggsList) {
			const customEggId = customEgg.identifier
			const maxFarmReachedValues = groupedByCustomEggId[customEggId]?.map(contract => contract.maxFarmReached) || [0];;
			const maxFarmReached = Math.max(...maxFarmReachedValues);
			const buffLevel = getBuffLevel(maxFarmReached);

			const buffsList = customEgg.buffsList;
			const index = Math.min(buffsList.length - 1, buffLevel - 1); // Cap index at the last element if buffLevel exceeds bounds
			const buff = buffsList[index];
			const dimension = buffsList[0].dimension || 0;
			const buffValue = buff ? buff.value : 1

			const buffType = getDimension(dimension);
			const eggImageLink = customEgg.icon.url

			colleggtiblesSection += `${customEggId},${buffType},${buffValue},${eggImageLink},${customEgg.value},${customEgg.name}\n`;
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


const boostIds = [
    "jimbos_blue",
    "jimbos_blue_v2",
    "jimbos_blue_big",
    "jimbos_purple",
    "jimbos_purple_v2",
    "jimbos_purple_big",
    "jimbos_orange",
    "jimbos_orange_big",
    "subsidy_application",
    "blank_check",
    "money_printer",
    "tachyon_prism_blue",
    "tachyon_prism_blue_v2",
    "tachyon_prism_blue_big",
    "tachyon_prism_purple",
    "tachyon_prism_purple_v2",
    "tachyon_prism_purple_big",
    "tachyon_prism_orange",
    "tachyon_prism_orange_big",
    "soul_beacon_blue",
    "soul_beacon_blue_v2",
    "soul_beacon_purple",
    "soul_beacon_purple_v2",
    "soul_beacon_orange",
    "boost_beacon_blue",
    "boost_beacon_purple",
    "boost_beacon_blue_big",
    "boost_beacon_orange",
    "soul_mirror_blue",
    "soul_mirror_purple",
    "soul_mirror_orange",
    "quantum_bulb",
    "dilithium_bulb"
];
