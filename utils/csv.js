function escape_csv_cell(value) {
	if (value === undefined || value === null) return "";
	let text = String(value);
	if (typeof value === "string" && (/^[\s]*[=+@]/.test(text) || /^[\s]*-(?![\d.]*$)/.test(text))) {
		text = `'${text}`;
	}
	if (/[",\r\n]/.test(text)) {
		return `"${text.replaceAll('"', '""')}"`;
	}
	return text;
}

function csv_row(values) {
	return values.map(escape_csv_cell).join(",");
}

export { csv_row, escape_csv_cell };
