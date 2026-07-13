import { githubGraphql } from "./graphql-client";

const QUERY = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      restrictedContributionsCount
    }
  }
}`;

type Response = {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      restrictedContributionsCount: number;
    };
  };
};

const LAST_MONTH = 11;
const LAST_DAY_OF_DECEMBER = 31;

// contributionsCollection only reports one year at a time, so walk year by year since signup
export async function countCommitsAllTime(token: string, login: string, createdAt: Date): Promise<number> {
  const now = new Date();
  let total = 0;

  for (let year = createdAt.getUTCFullYear(); year <= now.getUTCFullYear(); year++) {
    const from = new Date(Math.max(Date.UTC(year, 0, 1), createdAt.getTime()));
    const to = new Date(Math.min(Date.UTC(year, LAST_MONTH, LAST_DAY_OF_DECEMBER, 23, 59, 59), now.getTime()));

    const { user } = await githubGraphql<Response>(token, QUERY, {
      login,
      from: from.toISOString(),
      to: to.toISOString(),
    });

    // private commits are counted separately and only surface as a restricted total
    total += user.contributionsCollection.totalCommitContributions;
    total += user.contributionsCollection.restrictedContributionsCount;
  }

  return total;
}
