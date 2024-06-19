"use client";

import { useSearchParams } from "next/navigation";
import GiveNickname from "../../../component/GiveNickname";
import GameClient from "../../../component/game";

export default function GameField({ params }: { params: { gameId: string } }) {
  const searchParam = useSearchParams();
  const nameParam = searchParam.get("name") || "";
  const id = params.gameId;

  if (!nameParam) {
    return <GiveNickname gameId={id} />;
  }

  return <GameClient gameId={id} name={nameParam} />;
}
