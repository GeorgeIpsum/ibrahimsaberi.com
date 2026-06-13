"use client";

import { useEffect, useRef, useState } from "react";
import { Separator } from "../atoms/separator";
import { titleClassName } from "../structure/title.css";
import { GradientTextReveal } from "./gradient-text-reveal";

const greetings = [
  "yello.",
  "hello.",
  "howdy.",
  "hi.",
  "hey.",
  "greetings.",
  "yo.",
  "salaam.",
];

export const useHello = (defaultGreeting?: string) => {
  const greeting = useRef(
    defaultGreeting ?? greetings[Math.floor(Math.random() * greetings.length)],
  );

  return greeting.current;
};

interface HelloProps {
  default?: string;
}
export const Hello: React.FC<HelloProps> = ({ default: defaultGreeting }) => {
  const greeting = useHello(defaultGreeting);
  const [greetState, setGreetState] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setGreetState((prev) => {
          const next = greeting.slice(0, prev.length + 1);
          if (prev.length + 1 >= greeting.length) {
            clearInterval(interval);
          }
          return next;
        });
      }, 64);
    }, 640);

    return () => {
      if (interval) clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [greeting]);

  return (
    <h1 className="relative flex h-8 text-3xl">
      {greetState}
      <Separator
        orientation="vertical"
        className="absolute top-1/4 -right-1 h-4/5 w-0.5! animate-pulse bg-foreground"
      />
    </h1>
  );
};

export const HelloGradient: React.FC<HelloProps> = ({
  default: defaultGreeting,
}) => {
  const greeting = useHello(defaultGreeting);

  return (
    <h1 className={titleClassName} title={greeting} suppressHydrationWarning>
      <GradientTextReveal text={`👋🏾 ${greeting}`} />
    </h1>
  );
};
