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