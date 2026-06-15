import { connection } from "next/server";
import { Suspense } from "react";
import { Title } from "../structure/title";
import { randomAsciiArt, randomGreeting } from "./hello.greetings";

interface HelloProps {
  default?: string;
}

async function HelloTitle({ default: defaultGreeting }: HelloProps) {
  await connection();
  const { ascii, offset, color, anchor } = randomAsciiArt();
  return (
    <Title
      className="fade-in-0 animate-in duration-2000 ease-out"
      art={{
        ascii,
        anchor: anchor ?? "right",
        offset: { x: -8, y: 1, ...offset },
        color: color ?? "#F8C523",
        opacity: 1,
      }}
    >
      {defaultGreeting ?? randomGreeting()}
    </Title>
  );
}

export const Hello: React.FC<HelloProps> = ({ default: defaultGreeting }) => (
  <Suspense fallback={<Title hideHero>{"\u00A0"}</Title>}>
    <HelloTitle default={defaultGreeting} />
  </Suspense>
);
