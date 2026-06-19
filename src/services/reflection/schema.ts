import { type } from "arktype";

export const reflectSchema = type({
  alignment: "0 < number <= 29",
  "started_at?": "string",
  "challenge?": "string",
});
