import { main } from "./scrape-dota2-voicelines.mjs";

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
