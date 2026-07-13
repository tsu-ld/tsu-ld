import { renderCard } from "./card/render-card";
import { collectStats } from "./stats/collect";

const githubToken = process.env.GH_PAT ?? process.env.GITHUB_TOKEN;
const wakatimeKey = process.env.WAKATIME_API_KEY;

if (!githubToken || !wakatimeKey) {
  console.log("skipping: GH_PAT or WAKATIME_API_KEY not set");
  process.exit(0);
}

const stats = await collectStats(githubToken, wakatimeKey);

await Bun.write("light.svg", renderCard("light", stats));
await Bun.write("dark.svg", renderCard("dark", stats));

console.log("wrote light.svg + dark.svg", stats);
