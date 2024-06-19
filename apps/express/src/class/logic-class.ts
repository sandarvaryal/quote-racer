import { Server, Socket } from "socket.io";
import { rooms } from "../listeners";

export class Logic {
  io: Server;
  gameStatus: "not-started" | "in-progress" | "finished";
  gameId: string;
  players: { id: string; name: string; wpm: number }[];
  gameHost: string;
  paragraph: string;
  startTime: number;
  correctLetters: number;
  totalTypedLetters: number;
  liveWPM: number;
  wordsTyped: number;

  constructor(io: Server, id: string, host: string) {
    this.io = io;
    this.gameStatus = "not-started";
    this.gameId = id;
    this.players = [];
    this.gameHost = host;
    this.paragraph = "";
    this.startTime = 0;
    this.correctLetters = 0;
    this.totalTypedLetters = 0;
    this.liveWPM = 0;
    this.wordsTyped = 0;
  }

  setupListeners(socket: Socket) {
    socket.on("start-game", async () => {
      if (this.gameStatus == "in-progress") {
        return socket.emit("error", "the game has already started");
      }
      if (this.gameHost !== socket.id) {
        return socket.emit("error", "only the host can start the game");
      }

      this.players.map((player) => {
        player.wpm = 0;
      });

      this.io.to(this.gameId).emit("players", this.players);

      this.gameStatus = "in-progress";

      const response = await fetch("https://api.quotable.io/random");
      const obj = await response.json();
      const paragraph = obj.content;

      this.paragraph = paragraph;
      this.io.to(this.gameId).emit("game-started", paragraph);

      setTimeout(() => {
        this.gameStatus = "finished";
        this.io.to(this.gameId).emit("game-finished");
        this.io.to(this.gameId).emit("players", this.players);
      }, 60000);
    });

    socket.on("player-typed", (typed: string) => {
      if (this.gameStatus != "in-progress") {
        return socket.emit("error", "game not started");
      }

      if (!this.startTime) {
        this.startTime = Date.now();
        this.correctLetters = 0;
        this.totalTypedLetters = 0;
        this.liveWPM = 0;
        this.wordsTyped = 0;
      }

      this.totalTypedLetters = typed.length;
      this.correctLetters = 0;

      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === this.paragraph[i]) {
          this.correctLetters++;
        } else {
          break;
        }
      }
      if (this.totalTypedLetters === this.paragraph.length) {
        this.gameStatus = "finished";

        this.startTime = 0;
        this.correctLetters = 0;
        this.totalTypedLetters = 0;
        this.liveWPM = 0;
        this.wordsTyped = 0;

        this.io.to(this.gameId).emit("game-finished");
        this.io.to(this.gameId).emit("players", this.players);
        return;
      }

      const currentTime = Date.now();
      const timeTaken = (currentTime - this.startTime) / 60000;

      if (timeTaken > 0) {
        this.wordsTyped = this.correctLetters / 5;
        this.liveWPM = Math.floor(this.wordsTyped / timeTaken);
      } else {
        this.liveWPM = 0;
      }

      const player = this.players.find((player) => player.id === socket.id);
      if (player) {
        player.wpm = this.liveWPM;
      }

      this.io.to(this.gameId).emit("player-wpm", {
        id: socket.id,
        wpm: this.liveWPM,
        correctLetters: this.correctLetters,
      });
    });

    socket.on("leave", () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id != socket.id);

        if (this.players.length !== 0) {
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("new-host", this.gameHost);
          this.io.to(this.gameId).emit("player-left", socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }

      socket.leave(this.gameId);
      this.players = this.players.filter((player) => {
        player.id !== socket.id;
      });
      this.io.to(this.gameId).emit("player-left", socket.id);
    });

    socket.on("disconnect", () => {
      if (socket.id === this.gameHost) {
        this.players = this.players.filter((player) => player.id != socket.id);

        if (this.players.length !== 0) {
          this.gameHost = this.players[0].id;
          this.io.to(this.gameId).emit("new-host", this.gameHost);
          this.io.to(this.gameId).emit("player-left", socket.id);
        } else {
          rooms.delete(this.gameId);
        }
      }

      socket.leave(this.gameId);
      this.players = this.players.filter((player) => {
        player.id !== socket.id;
      });
      this.io.to(this.gameId).emit("player-left", socket.id);
    });
  }

  joinPlayer(id: string, name: string, socket: Socket) {
    if (this.gameStatus == "in-progress")
      return socket.emit("error", "Game is in progress");

    this.players.push({ id, name, wpm: 0 });

    this.io.to(this.gameId).emit("player-joined", {
      id,
      name,
      wpm: 0,
    });

    socket.emit("players", this.players);
    socket.emit("new-host", this.gameHost);

    this.setupListeners(socket);
  }
}
