class api_error extends Error {
	constructor(status, code, message) {
		super(message);
		this.status = status;
		this.code = code;
		this.expose = true;
	}
}

export { api_error };
