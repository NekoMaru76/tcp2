module.exports = class TCP2Responses {
	responses = {}
	
	constructor() {}
	getResponse(code) {
		return this.responses[code];
	}
	setResponse(code, message) {
		return this.responses[code] = message;
	}
}