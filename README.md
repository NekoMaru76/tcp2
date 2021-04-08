# TCP2

Is Wrapper of Node.JS' net API

## GitHub

https://github.com/NekoMaru76/tcp2

## Net

https://nodejs.org/api/net.html

## Example
```js
const TCP2 = require(`${__dirname}/index.js`);
const tcp2 = new TCP2;

tcp2.on("socket.message_raw", msg => {
	console.log(`Socket: Received Message {Raw} [${msg}]`);
});
tcp2.on("socket.disconnect", () => {
	console.log(`Socket: Disconnected`);
	
});
tcp2.onmessage("message", msg => {
	console.log(`Socket: Received Message [`, ...msg.content, `]`);
	tcp2.send('message', 'hi').then(id => {
		console.log(`Socket: Sent the message [${id}]`);
	});
});
tcp2.on("socket.afterExit", () => {
	//tcp2.connect();
});
tcp2.on("socket.connect", () => {
	console.log(`Socket: Connected.`);
});
tcp2.on("socket.error", e => {
	console.log(`Socket: Error`, e);
});
tcp2.on("server.error", e => {
	console.log(`Server: Error`, e);
});
tcp2.on("server.connection", socket => {
	console.log(`Server [${socket.address().address}:${socket.address().port}]: Connected as ${socket.id}.`);
	socket.send(`message`, `hi`).then(id => {
		console.log(`Server: Sent the message [${id}]`);
	});
	socket.on("message_raw", msg => {
		console.log(`Server [${socket.id}]: Received Message {Raw} [${msg}]`);
	});
	socket.on("disconnect", () => {
		console.log(`Server [${socket.id}]: Disconnected`);
	});
	socket.onmessage("message", msg => {
		console.log(`Server [${socket.id}]: Received Message [`, ...msg.content, ']');
		tcp2.disconnect();
	});
	socket.on("error", e => {
		console.log(`Server [${socket.id}]: Error`, e);
	});
});
tcp2.on("server.listening", () => {
	console.log(`Server: Listening.`);
	tcp2.connect();
});
tcp2.on("socket.ready", () => {
	
});
tcp2.listen();
```

## Usage and Examples

### Socket#on(event, callback)

Read @evodev/eventemitter's README.md.
Events: 
[1] disconnect
[2] message_raw
	Parameters:
		- message
			Message sent by Socket
	

### Socket#onmessage(event, ...messages) -> void

Listen to socket's messages

- event [String] 
	Event's name
- messages [Any] 
	Message's contents

```js
socket.onmessage('message', console.log)
```

### Socket#socket: Object

Is net#Socket

### Socket#address() -> Object

Read net#Socket#address()

### Socket#send(event, ...messages) -> Promise

Send a message to socket

- event [String] 
	Event's name
- messages [Any]
	Message's contents

```js
socket.send(`message`, `hai`);
```

### TCP2(socket, server) [Class]

- socket [Boolean, Default: true]
	If set to true, socket will get enabled
- server [Boolean, Default: true]
	If set to true, server will get enabled

```js
new TCP2
```

### TCP2#connect(ip, port, callback)

- ip [String, Default: 127.0.0.1]
	Server's IP
- port [Number, Default: 1337]
	Server's Port
- callback [Function]

### TCP2#listen(ip, port, callback)

- ip [String, Default: 127.0.0.1]
	Server's IP
- port [Number, Default: 1337]
	Server's Port
- callback [Function]

### TCP2#send(event, ...messages) -> MessageID {String}

Send message to server

- event [String]
	Event's name
- messages [Any]
	Message's contents

```js
tcp2.send(`message`, `hai`)
```

### TCP2#sendToAll(event, ...messages) -> Promises {Array}

Send message but to all sockets, a clone of Socket#send

```js
tcp2.send(`message`, `hi`)
```

### TCP2#on(event, callback)

Read @evodev/eventemitter's README.md.
Events:
	[1] socket.connect
	[2] socket.disconnect
	[3] socket.error
		Parameters:
			- Error
	[4] socket.message_raw
		Parameters:
			- message
				Message sent by Socket
	[5] server.connection
		Parameters:
			- Socket
	[6] server.error
		Parameters:
			- Error
	[7] server.listening
	[8] server.message_raw
		Parameters:
			- message
				Message sent by Server
	[8] socket.afterExit

```js
tcp2.on("server.listening", () => console.log(`Listening to localhost`));
```

### TCP2#onmessage(event, message) -> void

Listen to sockets' messages

- event [String]
	Event's name
- message [Object]
	- content [Array]
		Message's contents
	- id [String]
		Message's ID

```js
tcp2.onmessage(`message`, console.log);
```

## Developer
- Gaia#9524 [Discord]

## Buy me a Coffee
- nekomaru76 [PayPal]