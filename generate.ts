import { renderCard } from "./card";
import { fetchStats } from "./stats";

const stats = await fetchStats();
await Bun.write("light.svg", renderCard("light", stats));
await Bun.write("dark.svg", renderCard("dark", stats));
console.log("wrote light.svg + dark.svg", stats);
