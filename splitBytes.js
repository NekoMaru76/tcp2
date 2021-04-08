module.exports = function splitBytes(buffer, maxBytes) {
	const result = [];
	
	for (let i = 0; i < Math.ceil(buffer.byteLength/maxBytes); i++) {
		result.push(buffer.slice(maxBytes*(i+1)-maxBytes, maxBytes*(i+1)));
	}
	
	return result;
};