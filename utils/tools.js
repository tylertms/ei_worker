import proto from "../ei_pb.cjs";

const suffixes = {
	0: "",
	3: "k",
	6: "M",
	9: "B",
	12: "T",
	15: "q",
	18: "Q",
	21: "s",
	24: "S",
	27: "o",
	30: "N",
	33: "d",
	36: "U",
	39: "D",
	42: "Td",
	45: "qd",
	48: "Qd",
	51: "sd",
	54: "Sd",
	57: "Od",
	60: "Nd",
	63: "V",
	66: "uV",
	69: "dV",
	72: "tV",
	75: "qV",
	78: "QV",
	81: "sV",
	84: "SV",
	87: "OV",
	90: "NV",
	93: "tT",
};

function big_number_to_string(number, decimals, string_length) {
	if (Number.isNaN(number)) return "NaN";
	if (!Number.isFinite(number)) return "Inf";
	if (number < 0) return `-${big_number_to_string(-number, decimals, string_length)}`;
	if (number === 0) return "0";

	const length = string_length ?? 3;
	if (number < 1000) {
		return number.toFixed(decimals).slice(0, length).replace(/\.$/, "");
	}

	let value = number;
	let power = 0;
	while (value >= 10) {
		value /= 10;
		power += 1;
	}
	while (suffixes[power] === undefined) {
		value *= 10;
		power -= 1;
	}

	const formatted = value.toFixed(decimals);
	return `${string_length ? formatted.slice(0, string_length).replace(/\.$/, "") : formatted}${suffixes[power]}`;
}

function convert_grade(grade_id) {
	const grades = { 0: "UNKNOWN", 1: "C", 2: "B", 3: "A", 4: "AA", 5: "AAA", 6: "ANY" };
	return grades[grade_id ?? 0];
}

function get_proto_name_from_enum(proto_object, enum_value) {
	return Object.keys(proto_object).find((key) => proto_object[key] === enum_value) ?? "UNKNOWN";
}

function get_egg_name(number) {
	return get_proto_name_from_enum(proto.Egg, number);
}

function get_dimension(number) {
	return get_proto_name_from_enum(proto.GameModifier.GameDimension, number);
}

function get_buff_level(max_farm_reached) {
	if (max_farm_reached >= 10_000_000_000) return 4;
	if (max_farm_reached >= 1_000_000_000) return 3;
	if (max_farm_reached >= 100_000_000) return 2;
	if (max_farm_reached >= 10_000_000) return 1;
	return Number.NaN;
}

function get_artifact_level(number) {
	return get_proto_name_from_enum(proto.ArtifactSpec.Level, number);
}

function get_artifact_rarity(number) {
	return get_proto_name_from_enum(proto.ArtifactSpec.Rarity, number);
}

function get_artifact_name(number) {
	return get_proto_name_from_enum(proto.ArtifactSpec.Name, number);
}

async function create_auth_hash(message, env) {
	const magic = env.MAGIC;
	const data = new Uint8Array(message.length + magic.length);
	data.set(message, 0);
	data[env.INDEX % message.length] = env.MARKER;
	for (let index = 0; index < magic.length; index += 1) {
		data[message.length + index] = magic.charCodeAt(index);
	}
	const hash_buffer = await crypto.subtle.digest("SHA-256", data.buffer);
	return Array.from(new Uint8Array(hash_buffer))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function decompress_message(authenticated_message) {
	const message_bytes = authenticated_message.getMessage_asU8();
	if (!authenticated_message.getCompressed()) return message_bytes;

	const stream = new Blob([message_bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
	const decompressed = new Uint8Array(await new Response(stream).arrayBuffer());
	if (
		authenticated_message.hasOriginalSize() &&
		decompressed.length !== authenticated_message.getOriginalSize()
	) {
		throw new Error("Decompressed message size did not match its metadata");
	}
	return decompressed;
}

export {
	big_number_to_string,
	convert_grade,
	create_auth_hash,
	decompress_message,
	get_artifact_level,
	get_artifact_name,
	get_artifact_rarity,
	get_buff_level,
	get_dimension,
	get_egg_name,
};
