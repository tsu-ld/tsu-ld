const GITHUB_LOGIN = "tsu-ld";
const BIRTHDATE = new Date(Date.UTC(2003, 0, 9));
const GRAPHQL_URL = "https://api.github.com/graphql";
const WAKATIME_ALL_TIME_URL = "https://wakatime.com/api/v1/users/current/all_time_since_today";
const HISTORY_PAGE_SIZE = 100;

export type Stats = {
  uptime: string;
  repoCount: number;
  contributedCount: number;
  stars: number;
  commits: number;
  followers: number;
  locAdded: number;
  locDeleted: number;
  codingHours: number;
};

function formatUptime(birth: Date, now: Date): string {
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  let months = now.getUTCMonth() - birth.getUTCMonth();
  let days = now.getUTCDate() - birth.getUTCDate();
  if (days < 0) {
    days += new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }
  return `${years}y ${months}m ${days}d`;
}

async function githubGraphql(token: string, query: string, variables: Record<string, unknown>) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = (await response.json()) as { data?: unknown; errors?: { message: string }[] };
  if (!response.ok || json.errors) {
    throw new Error(`github graphql failed: ${json.errors?.[0]?.message ?? response.status}`);
  }
  return json.data as any;
}

const PROFILE_QUERY = `query($login: String!) {
  user(login: $login) {
    id
    createdAt
    followers { totalCount }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY]) { totalCount }
    repositories(first: 100, ownerAffiliations: [OWNER]) {
      totalCount
      nodes { name isFork stargazerCount }
    }
  }
}`;

const COMMITS_QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
    }
  }
}`;

const LOC_QUERY = `query($owner: String!, $name: String!, $authorId: ID!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: ${HISTORY_PAGE_SIZE}, after: $cursor, author: { id: $authorId }) {
            pageInfo { hasNextPage endCursor }
            nodes { additions deletions }
          }
        }
      }
    }
  }
}`;

async function countCommitsAllTime(token: string, createdAt: Date): Promise<number> {
  const now = new Date();
  let total = 0;
  for (let year = createdAt.getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
    const from = new Date(Math.max(Date.UTC(year, 0, 1), createdAt.getTime()));
    const to = new Date(Math.min(Date.UTC(year, 11, 31, 23, 59, 59), now.getTime()));
    const data = await githubGraphql(token, COMMITS_QUERY, {
      login: GITHUB_LOGIN,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const collection = data.user.contributionsCollection;
    total += collection.totalCommitContributions + collection.restrictedContributionsCount;
  }
  return total;
}

// no cache: recounts every repo's history daily. Fine at this repo count;
// add a committed cache file if rate limits ever bite.
async function countLinesOfCode(
  token: string,
  authorId: string,
  repoNames: string[],
): Promise<{ added: number; deleted: number }> {
  let added = 0;
  let deleted = 0;
  for (const name of repoNames) {
    let cursor: string | null = null;
    do {
      const data = await githubGraphql(token, LOC_QUERY, {
        owner: GITHUB_LOGIN,
        name,
        authorId,
        cursor,
      });
      const history = data.repository.defaultBranchRef?.target?.history;
      if (!history) break;
      for (const commit of history.nodes) {
        added += commit.additions;
        deleted += commit.deletions;
      }
      cursor = history.pageInfo.hasNextPage ? history.pageInfo.endCursor : null;
    } while (cursor);
  }
  return { added, deleted };
}

async function fetchCodingHours(apiKey: string): Promise<number> {
  const response = await fetch(`${WAKATIME_ALL_TIME_URL}?api_key=${apiKey}`);
  if (!response.ok) throw new Error(`wakatime failed: ${response.status}`);
  const json = (await response.json()) as { data: { total_seconds: number } };
  return Math.round(json.data.total_seconds / 3600);
}

export async function fetchStats(): Promise<Stats> {
  const token = process.env.GH_PAT ?? process.env.GITHUB_TOKEN;
  const wakatimeKey = process.env.WAKATIME_API_KEY;
  if (!token) throw new Error("GH_PAT (or GITHUB_TOKEN) is not set");
  if (!wakatimeKey) throw new Error("WAKATIME_API_KEY is not set");

  const profile = await githubGraphql(token, PROFILE_QUERY, { login: GITHUB_LOGIN });
  const user = profile.user;
  const ownRepos = user.repositories.nodes as { name: string; isFork: boolean; stargazerCount: number }[];
  const sourceRepos = ownRepos.filter((repo) => !repo.isFork);

  const [commits, loc, codingHours] = await Promise.all([
    countCommitsAllTime(token, new Date(user.createdAt)),
    countLinesOfCode(token, user.id, sourceRepos.map((repo) => repo.name)),
    fetchCodingHours(wakatimeKey),
  ]);

  return {
    uptime: formatUptime(BIRTHDATE, new Date()),
    repoCount: user.repositories.totalCount,
    contributedCount: user.repositoriesContributedTo.totalCount,
    stars: ownRepos.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    commits,
    followers: user.followers.totalCount,
    locAdded: loc.added,
    locDeleted: loc.deleted,
    codingHours,
  };
}
