function bigNumberToString(number, decimals, strLen) {
    var letters = {
        0: '', 3: 'k', 6: 'M', 9: 'B', 12: 'T', 15: 'q', 18: 'Q', 21: 's',
        24: 'S', 27: 'o', 30: 'N', 33: 'd', 36: 'U', 39: 'D', 42: 'Td',
        45: 'qd', 48: 'Qd', 51: 'sd', 54: 'Sd', 57: 'Od', 60: 'Nd', 63: 'V',
        66: 'uV', 69: 'dV', 72: 'tV', 75: 'qV', 78: 'QV', 81: 'sV', 84: 'SV',
        87: 'OV', 90: 'NV', 93: 'tT'
    }

    if (isNaN(number))
        return 'NaN';

    if (!Number.isFinite(number))
        return 'Inf';

    if (number < 0)
        return '-' + bigNumberToString(-number, decimals, strLen);

    if (number == 0)
        return "0"
    if (number < 1000) {
        let numStr = String(number.toFixed(decimals)).slice(0, strLen ?? 3)
        if (numStr.charAt((strLen ?? 3) - 1) == ".") numStr = numStr.replace(".", "")
        return numStr
    }

    let power = 0
    while (number >= 10) { number /= 10; power++ }
    while (!letters[power]) { number *= 10; power-- }

    if (strLen) {
        let numStr = String(number.toFixed(decimals)).slice(0, strLen)
        if (numStr.charAt(strLen - 1) == ".") numStr = numStr.replace(".", "")
        return numStr + letters[power]
    } else
        return String(number.toFixed(decimals)) + letters[power]
}

function convertGrade(gradeId) {
    const grade_nums = { 0: 'UNKNOWN', 1: 'C', 2: 'B', 3: 'A', 4: 'AA', 5: 'AAA', 6: 'ANY' };
    return grade_nums[gradeId ?? 0];
}

function getEggName(num) {
    switch (num) {
        case 1: return "EDIBLE";
        case 2: return "SUPERFOOD";
        case 3: return "MEDICAL";
        case 4: return "ROCKET_FUEL";
        case 5: return "SUPER_MATERIAL";
        case 6: return "FUSION";
        case 7: return "QUANTUM";
        case 8: return "IMMORTALITY";
        case 9: return "TACHYON";
        case 10: return "GRAVITON";
        case 11: return "DILITHIUM";
        case 12: return "PRODIGY";
        case 13: return "TERRAFORM";
        case 14: return "ANTIMATTER";
        case 15: return "DARK_MATTER";
        case 16: return "AI";
        case 17: return "NEBULA";
        case 18: return "UNIVERSE";
        case 19: return "ENLIGHTENMENT";
        case 100: return "CHOCOLATE";
        case 101: return "EASTER";
        case 102: return "WATERBALLOON";
        case 103: return "FIREWORK";
        case 104: return "PUMPKIN";
        case 200: return "CUSTOM";
        default: return "UNKNOWN";
    }
}

function getDimension(num) {
    switch (num) {
        case 0: return "INVALID";
        case 1: return "EARNINGS";
        case 2: return "AWAY_EARNINGS";
        case 3: return "INTERNAL_HATCHERY_RATE";
        case 4: return "EGG_LAYING_RATE";
        case 5: return "SHIPPING_CAPACITY";
        case 6: return "HAB_CAPACITY";
        case 7: return "VEHICLE_COST";
        case 8: return "HAB_COST";
        case 9: return "RESEARCH_COST";
        default: return "UNKNOWN";
    }
}

function getBuffLevel(maxFarmReached) {
    if (maxFarmReached >= 10000000000) return 4;
    if (maxFarmReached >= 1000000000) return 3;
    if (maxFarmReached >= 100000000) return 2;
    if (maxFarmReached >= 10000000) return 1;
    return NaN; // return NaN if no level has been reached
}


function renameBoost(key) {
    switch (key) {
        case 'quantum_bulb' : return 'Quantum Bulb';
        case 'dilithium_bulb' : return 'Dilithium Bulb';
        case 'jimbos_blue': return "Jimbo's Bird Feed (2x earnings for 1 hr)";
        case 'jimbos_blue_v2': return "Jimbo's Bird Feed (3x earnings for 20 mins)";
        case 'jimbos_blue_big': return "Jimbo's Bird Feed (2x earnings for 8 hrs)";
        case 'jimbos_orange': return "Jimbo's Bird Feed (50x earnings for 10 mins)";
        case 'jimbos_orange_big': return "Jimbo's Bird Feed (50x earnings for 1 hr)";
        case 'jimbos_purple': return "Jimbo's Bird Feed (10x earnings for 30 mins)";
        case 'jimbos_purple_v2': return "Jimbo's Bird Feed (10x earnings for 15 mins)";
        case 'jimbos_purple_big': return "Jimbo's Bird Feed (10x earnings for 2 hrs)";
        case 'blank_check': return '+100% of Farm Value';
        case 'subsidy_application': return '+10% of Farm Value';
        case 'money_printer': return '+500% of Farm Value';
        case 'tachyon_prism_blue': return 'Tachyon Prism (10x IHR for 30 mins)';
        case 'tachyon_prism_blue_v2' : return 'Tachyon Prism (10x IHR for 10 mins)';
        case 'tachyon_prism_blue_big': return 'Tachyon Prism (10x IHR for 4 hrs)';
        case 'tachyon_prism_orange': return 'Tachyon Prism (1000x IHR for 10 mins)';
        case 'tachyon_prism_orange_big': return 'Tachyon Prism (1000x IHR for 1 hr)';
        case 'tachyon_prism_purple': return 'Tachyon Prism (100x IHR for 20 mins)';
        case 'tachyon_prism_purple_big': return 'Tachyon Prism (100x IHR for 2 hrs)';
        case 'boost_beacon_blue': return 'Boost Beacon (2x boosts for 30 mins)';
        case 'boost_beacon_blue_big': return 'Boost Beacon (5x boosts for 1 hr)';
        case 'boost_beacon_orange': return 'Boost Beacon (50x boosts for 10 mims)';
        case 'boost_beacon_purple': return 'Boost Beacon (10x boosts for 10 mins)';
        case 'soul_beacon_blue': return 'Soul Beacon (5x SE for 1 hr)';
        case 'soul_beacon_blue_v2' : return 'Soul Beacon (5x SE for 30 mins)';
        case 'soul_beacon_purple': return 'Soul Beacon (50x SE for 30 mins)';
        case 'soul_beacon_purple_v2': return 'Soul Beacon (50x SE for 20 mins)';
        case 'soul_beacon_orange': return 'Soul Beacon (500x SE for 10 mins)';
        case 'soul_mirror_blue': return 'Soul Mirror (Matches top EB for 10 mins)';
        case 'soul_mirror_purple': return 'Soul Mirror (Matches top EB for 1 hr)';
        case 'soul_mirror_orange': return 'Soul Mirror (Matches top EB for 24 hrs)';
        default: return 'UNKNOWN';
    }
}


module.exports = { bigNumberToString, convertGrade, getEggName, getDimension, getBuffLevel, renameBoost};