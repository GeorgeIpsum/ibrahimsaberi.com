import { type } from "arktype";

const questionSchema = type({
  id: "string",
  "a?": "string",
});

export const reflectSchema = type({
  alignment: "0 < number <= 29",
  "started_at?": "string.date.iso",
  "completed_at?": "string.date.iso",
  "qs?": questionSchema.array(),
  "challenge?": "string",
});
