import { Player } from "./game";
import Image from "next/image";

export default function DisplayPlayers({
  player,
  correctLetters,
}: {
  player: Player;
  correctLetters: number;
}) {
  //bad code, will use tailwind later
  return (
    <div>
      <div className="display-players-wrapper" style={{ display: "flex" }}>
        <h5 className="player-name">{player.name}</h5>
        <div
          className="rocket-image"
          style={{ width: "3rem", height: "3rem", position: "relative" }}
        >
          <Image
            src="/rocket.svg"
            alt="Rocket svg"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <h6 className="player-wpm">{player.wpm}</h6>
      </div>
    </div>
  );
}
