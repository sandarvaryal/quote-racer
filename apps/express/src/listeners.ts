import { Server } from "socket.io";
import { Logic } from "./class/logic-class";

export const rooms = new Map<string, Logic>();

export function listeners(io: Server) {
  io.on("connection", (socket: any) => {
    console.log("hellow");

    socket.on("join-game", (roomID: string, name: string) => {
      if (!roomID) {
        return socket.emit("error", "Invalid room ID");
      }
      if (!name) {
        return socket.emit("error", "Please provide nickname");
      }
      socket.join(roomID);

      if (rooms.has(roomID)) {
        console.log("room exists");

        const game = rooms.get(roomID);
        if (!game) return socket.emit("error", "game doesnt exist");
        game.joinPlayer(socket.id, name, socket);
      } else {
        const game = new Logic(io, roomID, socket.id);
        rooms.set(roomID, game);
        game.joinPlayer(socket.id, name, socket);
      }
    });
  });
}
