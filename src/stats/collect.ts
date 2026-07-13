import { BIRTHDATE, GITHUB_LOGIN } from "../profile";
import { countCommitsAllTime } from "./github/commit-count";
import { countLinesOfCode } from "./github/lines-of-code";
import { fetchOverview } from "./github/overview";
import type { Stats } from "./types";
import { formatUptime } from "./uptime";
import { fetchCodingHours } from "./wakatime";

export async function collectStats(githubToken: string, wakatimeKey: string): Promise<Stats> {
  const overview = await fetchOverview(githubToken, GITHUB_LOGIN);

  const [commits, linesOfCode, codingHours] = await Promise.all([
    countCommitsAllTime(githubToken, GITHUB_LOGIN, overview.createdAt),
    countLinesOfCode(githubToken, GITHUB_LOGIN, overview.authorId, overview.sourceRepoNames),
    fetchCodingHours(wakatimeKey),
  ]);

  return {
    uptime: formatUptime(BIRTHDATE, new Date()),
    repoCount: overview.repoCount,
    contributedCount: overview.contributedCount,
    stars: overview.stars,
    commits,
    followers: overview.followers,
    locAdded: linesOfCode.added,
    locDeleted: linesOfCode.deleted,
    codingHours,
    weeklyCommits: overview.weeklyCommits,
  };
}
