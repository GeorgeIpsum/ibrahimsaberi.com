import { ArkErrors } from "arktype";
import { reflectSchema } from "./schema";

export const validateReflection = (cookie: string | undefined) => {
  if (!cookie) {
    return false;
  }

  try {
    const value = JSON.parse(Buffer.from(cookie, "base64").toString("utf-8"));
    const parsed = reflectSchema(value);
    if (parsed instanceof ArkErrors) {
      return false;
    }

    if (parsed.challenge) {
      // TODO: this needs to actually match the challenge that was set, but for now just check that it's a string
      return true;
    } else if (parsed.completed_at) {
      return true;
    }
  } catch {}

  return false;
};
