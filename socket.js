const Events = require("@evodev/eventemitter");
const splitBytes = require(`${__dirname}/splitBytes.js`);
const v8 = require("v8");
const cuid = require("cuid");

module.exports = class Socket extends Events {
	constructor(socket, id, serverMessages) {
		super();
		
		this.id = id;
		this.socket = socket;
		this.eventMessage = new Events;
		this.serverMessages = serverMessages;
	}
	address() {
		return this.socket.address();
	}
	onmessage(...args) {
		return this.eventMessage.on(...args);
	}
	send(event, ...messages) {
		const { socket } = this;
		
		if (!messages.length) throw new TypeError(`messages cannot be empty`);
		if (typeof event !== "string") throw new TypeError(`event can only be a string`);
		
		const buffers = splitBytes(v8.serialize(messages), 1024*1024);
		const msgID = cuid();
		const ev = Array.from(Buffer.from(event));
		
		socket.write(Buffer.from(`CREATE-${msgID}-${ev}\n`));
		
		for (let buffer of buffers) {
			socket.write(Buffer.from(`CONTENT-${msgID}-${Array.from(buffer)}\n`));
		}
		
		socket.write(Buffer.from(`END-${msgID}\n`));
		
		const promise = new Promise((resolve, reject) => {
			this.serverMessages[msgID] = { resolve, reject };
		});
		
		return promise;
	}
}