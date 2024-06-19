"use client";

import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
  const [invCode, setInvCode] = useState("");
  const router = useRouter();

  function createGame() {
    const inviteCode = uuidv4();
    router.push(`/game/${inviteCode}`);
  }
  function joinGame(e: FormEvent) {
    e.preventDefault();
    if (!invCode) return alert("no invite code");
    router.push(`/game/${invCode}`);
  }

  return (
    <>
      <div className="create-game">
        <button onClick={createGame}>Create a game</button>
      </div>
      <div className="join-game">
        <form onSubmit={joinGame}>
          <input
            value={invCode}
            onChange={(e) => {
              setInvCode(e.target.value);
            }}
            type="text"
            id="inv-code"
            name="fname"
          />
          <button type="submit">Join Game</button>
        </form>
      </div>
    </>
  );
}
