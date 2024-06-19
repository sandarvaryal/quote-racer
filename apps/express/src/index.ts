import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import http from "http";
import { listeners } from "./listeners";
const app = express();
const port = 8080;

app.use(
  cors({
    origin: "*",
    methods: "**",
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

listeners(io);

app.get("/", (req, res) => {
  res.send("Hellow Kubo-san");
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
