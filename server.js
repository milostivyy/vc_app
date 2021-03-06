
  
const express = require("express");
const { appendFileSync } = require("fs");
const http = require("http");
const app = express();
const server = http.createServer(app);
const cors=require("cors");
const io = require("socket.io")(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
})
app.use(cors());
const PORT=process.env.PORT || 5000;
app.get("/",(req,res)=>{
	res.send("SERVER IS RUNNING");
});


io.on("connection", (socket) => {
	socket.emit("me", socket.id)

	socket.on("disconnect", () => {
		socket.broadcast.emit("callEnded")
	})
 
	socket.on("callUser", (data) => {
		io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name })
	})

	socket.on("answerCall", (data) => {
		io.to(data.to).emit("callAccepted", data.signal)
	})
})

server.listen(PORT, () => console.log("server is running on port ${PORT}"))
