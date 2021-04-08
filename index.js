const net = require("net");
const Events = require("@evodev/eventemitter");
const cuid = require("cuid");
const v8 = require("v8");
const Socket = require(`${__dirname}/socket.js`);
const splitBytes = require(`${__dirname}/splitBytes.js`);
const childProcess = require("child_process");

module.exports = class TCP2 extends Events {
    constructor(socket = true, server = true, settings = { maxBytes: 1024*1024 }) {
        super();

		this.settings = settings;
        this.eventMessage = new Events;

        if (socket) {
            this.createSocket();
        }

        if (server) {
            this.createServer();
        }
    }
	disconnect() {
		if (!this.socketFork) throw new ReferenceError(`Socket is disabled`);
		
		this.socketFork.send(v8.serialize(['end']));
	}
    createServer() {
        this.server = new net.Server;
        this.connections = {};
		this.serverMessages = {};

        this.server.on("error", e => this.emit(`server.error`, e));
        this.server.on("listening", () => this.emit(`server.listening`));
        this.server.on("connection", socket => {
            const id = cuid();
            const connection = new Socket(socket, id, this.serverMessages);
            const messages = {};

            this.connections[id] = connection;

			socket.on("close", () => {
				delete this.connections[id];
				
				connection.emit(`disconnect`);
			});
			socket.on("error", e => {
				if (!this.connections[id]) return;
				
				this.emit(`server.connection.error`, e);
				connection.emit(`error`, e);
			});
            this.emit(`server.connection`, connection);
            socket.write(Buffer.from(`ID-${id}`));
            socket.on("data", msg => {
                this.emit(`server.message_raw`, connection, msg);
                connection.emit(`message_raw`, msg);

                if (!Buffer.isBuffer(msg)) return;

                const string = msg.toString();
                const msgs = string.split("\n");

                for (let _msg_ of msgs) {
                    const _ = _msg_.split("-");
					
                    try {
                        const id = _[1];
                        //console.log(id, _, messages);
                        switch (_[0]) {
                            case "CREATE": {
                                if (messages[id]) break;

                                const event = Buffer.from(_[2].split(",")).toString();

                                messages[id] = {
                                    event,
                                    buffer: Buffer.alloc(0)
                                };

                                break;
                            }
							case "NOT ACCEPTED": {
								if (!this.serverMessages[id]) break;
								
								this.serverMessages[id].reject(_[2]);
								
								break;
							}
							case "RECEIVED": {
								if (!this.serverMessages[id]) break;
								
								this.serverMessages[id].resolve(id);
								
								break;
							}
                            case "CONTENT": {
                                if (!messages[id]) break;

                                const buffer = Buffer.from(_[2].split(","));

                                messages[id].buffer = Buffer.concat([messages[id].buffer, buffer]);

                                break;
                            }
                            case "END": {
                                if (!messages[id]) break;

                                const msg = v8.deserialize(messages[id].buffer);

                                if (!Array.isArray(msg)) break;

                                connection.eventMessage.emit(messages[id].event, {
                                    content: msg,
                                    id
                                });
								socket.write(Buffer.from(`RECEIVED-${id}`));

                                delete messages[id];

                                break;
                            }
                        }
                    } catch {}
                }
            });
        });
    }
    createSocket() {
        this.socketFork = childProcess.fork(`${__dirname}/client.js`);
		this.socketID = null;
		this.socketMessages = {};
		
		this.socketFork.send(v8.serialize(['settings', this.settings]));
		this.socketFork.on("exit", () => {
			this.createSocket();
			this.emit(`socket.afterExit`);
		});
		this.socketFork.on("message", msg => {
			const m = v8.deserialize(Buffer.from(msg.data));
			
			//console.log(m);
			
			switch(m[0]) {
				case "socketMessages": {
					this.socketMessages[m[1]][m[2]](m[3] || m[1]);
					
					break;
				}
				case "id": {
					this.socketID = m[1];
				}
				case "main": {
					this.emit(m[1], ...m.slice(2, Infinity));
					
					break;
				}
				case "eventMessage": {
					this.eventMessage.emit(m[1], ...m.slice(2, Infinity));
					
					break;
				}
			}
		});
    }
    listen(ip = '127.0.0.1', port = 1337, callback) {
        if (!this.server) throw new ReferenceError(`Server is disabled`);

        return this.server.listen(port, ip, callback);
    }
    connect(ip = '127.0.0.1', port = 1337) {
        if (!this.socketFork) throw new ReferenceError(`Socket is disabled`);

        this.socketFork.send(v8.serialize(['connect', ip, port]));
    }
    send(event, ...messages) {
        if (!messages.length) throw new TypeError(`messages cannot be empty`);
        if (typeof event !== "string") throw new TypeError(`event can only be a string`);

        const msgID = cuid();
		
		this.socketFork.send(v8.serialize(['send', event, messages, msgID]));
		
		return new Promise((resolve, reject) => {
			this.socketMessages[msgID] = { resolve, reject };
		});
    }
    onmessage(event, callback) {
        return this.eventMessage.on(event, callback);
    }
    sendToAll(event, ...messages) {
        const promises = [];

        for (let connection of Object.values(this.connections)) promises.push(connection.send(event, ...messages));

        return promises;
    }
};