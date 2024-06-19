"use client";

import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";
import DisplayPlayers from "./displayPlayers";

export type Player = {
  id: string;
  name: string;
  wpm: number;
  correctLetters: number;
};

export default function GameClient({
  gameId,
  name,
}: {
  gameId: string;
  name: string;
}) {
  const [ioInstance, setIoInstance] = useState<Socket>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState("not-started");
  const [paragraph, setParagraph] = useState("");
  const [host, setHost] = useState("");
  const [inputParagraph, setInputParagraph] = useState("");

  useEffect(() => {
    const socket = io("ws://localhost:8080/");
    setIoInstance(socket);

    socket.emit("join-game", gameId, name);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setUpListeners();
    return () => remoteListeners();
  }, [ioInstance]);

  useEffect(() => {
    if (!ioInstance || gameStatus !== "in-progress") return;

    ioInstance.emit("player-typed", inputParagraph);
  }, [inputParagraph]);

  function setUpListeners() {
    if (!ioInstance) return;

    ioInstance.on("connect", () => {
      console.log("connected");
    });

    ioInstance.on("players", (players) => {
      console.log("received the players in the game room");
      setPlayers(players);
    });

    ioInstance.on("player-joined", (newPlayer: Player) => {
      setPlayers((existingPlayers) => [...existingPlayers, newPlayer]);
    });

    ioInstance.on("player-left", (id: string) => {
      setPlayers((existingPlayers) =>
        existingPlayers.filter((player) => player.id !== id)
      );
    });

    ioInstance.on(
      "player-wpm",
      ({
        id,
        wpm,
        correctLetters,
      }: {
        id: string;
        wpm: number;
        correctLetters: number;
      }) => {
        setPlayers((existingPlayers) =>
          existingPlayers.map((player) => {
            if (player.id === id) {
              return {
                ...player,
                wpm,
                correctLetters,
              };
            }
            return player;
          })
        );
      }
    );

    ioInstance.on("game-started", (paragraph: string) => {
      setParagraph(paragraph);
      setGameStatus("in-progress");
    });

    ioInstance.on("game-finished", () => {
      setGameStatus("finished");
      setInputParagraph("");
    });

    ioInstance.on("new-host", (id: string) => {
      setHost(id);
    });

    ioInstance.on("error", (message: string) => {
      alert("error: " + message);
    });
  }

  function remoteListeners() {
    if (!ioInstance) return;

    ioInstance.off("connect");
    ioInstance.off("players");
    ioInstance.off("player-joined");
    ioInstance.off("player-left");
    ioInstance.off("player-wpm");
    ioInstance.off("game-started");
    ioInstance.off("game-finished");
    ioInstance.off("new-host");
    ioInstance.off("error");
  }

  function startGame() {
    if (!ioInstance) return;

    ioInstance.emit("start-game");
  }

  window.onbeforeunload = () => {
    if (ioInstance) {
      ioInstance.emit("leave");
    }
  };

  return (
    <>
      <div className="wrapper">
        <h1>Players</h1>
        <div className="totalplayers">
          {players.map((player) => (
            <DisplayPlayers
              key={player.id}
              player={player}
              correctLetters={player.correctLetters}
            />
          ))}
        </div>
        {gameStatus === "not-started" && (
          <div>
            <h1>Waiting for players...</h1>
            {host === ioInstance?.id && (
              <>
                <button onClick={startGame}>Start Game</button>
              </>
            )}
          </div>
        )}

        {gameStatus === "in-progress" && (
          <div>
            <h1>Type the quote below</h1>
            <div className="target-paragraph">
              <p>{paragraph}</p>
            </div>
            <div>
              <input
                type="text"
                value={inputParagraph}
                onChange={(e) => setInputParagraph(e.target.value)}
              />
            </div>
          </div>
        )}

        {gameStatus === "finished" && (
          <div>
            <h1>Game Finished</h1>
            {host === ioInstance?.id && (
              <button onClick={startGame}>Start Game</button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
