const socket = new (require("net").Socket)();
const socketMessages = {};
const v8 = require("v8");
const splitBytes = require(`${__dirname}/splitBytes.js`);
const cuid = require("cuid");

let socketID, settings;

socket.on("close", () => process.kill(0));
process.on("message", msg => {
	const m = v8.deserialize(Buffer.from(msg.data));
	
	switch(m[0]) {
		case "settings": {
			settings = m[1];
			
			break;
		}
		case "connect": {console.log("connecting");
			socket.connect(m[2], m[1]);
			
			break;
		}
		case "end": {
			socket.write(Buffer.from(`CLOSE`));
			socket.end();
			
			break;
		}
		case "send": {
			const event = m[1];
			const messages = m[2];
			const buffers = splitBytes(v8.serialize(messages), 1024 * 1024);
			const msgID =  m[3];
			const ev = Array.from(Buffer.from(event));

			socket.write(Buffer.from(`CREATE-${msgID}-${ev}\n`));

			for (let buffer of buffers) {
				socket.write(Buffer.from(`CONTENT-${msgID}-${Array.from(buffer)}\n`));
			}

			socket.write(Buffer.from(`END-${msgID}\n`));
			
			socketMessages[msgID] = {
				resolve() {
					process.send(v8.serialize([
						'socketMessages', msgID, `resolve`
					]));
				},
				reject(e) {
					process.send(v8.serialize([
						'socketMessages', msgID, `reject`, e
					]));
				}
			};
			break;
		}
	}
});

const messages = {};

socket.on("connect", () => process.send(v8.serialize(['main', `connect`])));
socket.on("error", e => process.send(v8.serialize(['main', `error`, e])));
socket.on("close", () => process.send(v8.serialize(['main', `close`])));
socket.on("data", msg => {
	process.send(v8.serialize([`main`, `socket.message_raw`, msg]));
		
            if (!Buffer.isBuffer(msg)) return;
			if (msg.byteLength > settings.maxBytes) return;

            const msgs = msg.toString().split("\n");
			
            for (let _msg of msgs) {
                const _ = _msg.split("-");
                const id = _[1];
				
                try {
                    switch (_[0]) {
                        case "ID": {
                            socketID = _[1];

							process.send(v8.serialize(['id', `ID`, socketID]));

                            break;
                        }
                        case "CREATE": {
                            if (messages[id]) break;

                            const event = Buffer.from(_[2].split(",")).toString();

                            messages[id] = {
                                event,
                                buffer: Buffer.alloc(0)
                            };
							
                            break;
                        }
                        case "CONTENT": {
                            if (!messages[id]) break;

                            const buffer = Buffer.from(_[2].split(","));

                            messages[id].buffer = Buffer.concat([messages[id].buffer, buffer]);
							
                            break;
                        }
						case "NOT ACCEPTED": {
							if (!socketMessages[id]) break;
							
							socketMessages[id].reject(_[2]);
							
							break;
						}
						case "RECEIVED": {
							if (!socketMessages[id]) break;
							
							socketMessages[id].resolve();
							
							break;
						}
                        case "END": {
                            if (!messages[id]) break;

                            const msg = v8.deserialize(messages[id].buffer);
							
                            if (!Array.isArray(msg)) break;

                            process.send(v8.serialize(['eventMessage', messages[id].event, {
                                content: msg,
                                id
                            }]));
							socket.write(Buffer.from(`RECEIVED-${id}`));

                            delete messages[id];

                            break;
                        }
                    }
                } catch {}
            }
});