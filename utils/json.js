function snake_case_key(key) {
	return key
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
		.toLowerCase();
}

function to_snake_case(value) {
	if (Array.isArray(value)) return value.map(to_snake_case);
	if (value === null || typeof value !== "object") return value;
	return Object.fromEntries(
		Object.entries(value).map(([key, child]) => [snake_case_key(key), to_snake_case(child)]),
	);
}

export { snake_case_key, to_snake_case };
