"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GiveNickname({ gameId }: { gameId: string }) {
  const [nickname, setNickname] = useState("");
  const router = useRouter();

  function formDataHandler(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname) {
      return alert("please provide a nickname");
    }
    console.log(gameId);
    router.push(`/game/${gameId}?name=${nickname}`);
  }

  return (
    <div>
      <form onSubmit={formDataHandler}>
        <h1>Enter a Nickname</h1>
        <input
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
          }}
          type="text"
        />
        <button type="submit">Join Game</button>
      </form>
    </div>
  );
}
