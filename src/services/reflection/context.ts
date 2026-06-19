import { type } from "arktype";
import { createContext, useContext } from "react";
import { reflectSchema } from "./schema";

export type ReflectContext = typeof reflectSchema.infer;

const ReflectContext = createContext<ReflectContext | null>(null);
export const ReflectProvider = ReflectContext.Provider;

export const useReflectContext = () => {
  const context = useContext(ReflectContext);
  if (!context) {
    throw new Error("Something is rotten in the state of Denmark.");
  }
  return context;
};

const getReflectSchema = type({
  it: "string",
  value: "string.base64",
});
type GetReflect = typeof getReflectSchema.infer;

const toReflectContext = (value: string): ReflectContext => {
  const decoded = Buffer.from(value, "base64").toString("utf-8");
  const parsed = JSON.parse(decoded);
  const parsedSchema = reflectSchema(parsed);
  if (parsedSchema instanceof type.errors) {
    console.error(
      "Failed to parse reflection context:",
      parsedSchema.flatProblemsByPath,
    );
    throw new Error("Failed to parse reflection context.");
  }
  return parsedSchema;
};

export const getReflection = async (noSet = false) => {
  const res = await fetch("/api/reflection", {
    cache: "no-store",
    ...(noSet && { headers: { "x-skip-set": "true" } }),
  });
  if (!res.ok) {
    throw new Error("Something is TRULY rotten in the state of Denmark.");
  }

  const data = await res.json();
  const parsedGetReflect = getReflectSchema(data);
  if (parsedGetReflect instanceof type.errors) {
    if ((data as GetReflect)?.it === "has no reflection") {
      console.info("it has not yet begun");
    } else {
      console.warn(
        "Failed to parse reflection data:",
        parsedGetReflect.flatProblemsByPath,
      );
    }
    return null;
  }

  console.info("it", parsedGetReflect.it);

  return toReflectContext(parsedGetReflect.value);
};
