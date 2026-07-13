import { githubGraphql } from "./graphql-client";

const OWN_REPOS_PAGE_SIZE = 100;

const QUERY = `query($login: String!) {
  user(login: $login) {
    id
    createdAt
    followers { totalCount }
    contributionsCollection {
      contributionCalendar { weeks { contributionDays { contributionCount } } }
    }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY]) { totalCount }
    repositories(first: ${OWN_REPOS_PAGE_SIZE}, ownerAffiliations: [OWNER]) {
      totalCount
      nodes { name isFork stargazerCount }
    }
  }
}`;

type Response = {
  user: {
    id: string;
    createdAt: string;
    followers: { totalCount: number };
    contributionsCollection: {
      contributionCalendar: { weeks: { contributionDays: { contributionCount: number }[] }[] };
    };
    repositoriesContributedTo: { totalCount: number };
    repositories: {
      totalCount: number;
      nodes: { name: string; isFork: boolean; stargazerCount: number }[];
    };
  };
};

export type Overview = {
  authorId: string;
  createdAt: Date;
  followers: number;
  repoCount: number;
  contributedCount: number;
  stars: number;
  sourceRepoNames: string[];
  weeklyCommits: number[];
};

export async function fetchOverview(token: string, login: string): Promise<Overview> {
  const { user } = await githubGraphql<Response>(token, QUERY, { login });
  const ownRepos = user.repositories.nodes;

  return {
    authorId: user.id,
    createdAt: new Date(user.createdAt),
    followers: user.followers.totalCount,
    repoCount: user.repositories.totalCount,
    contributedCount: user.repositoriesContributedTo.totalCount,
    stars: ownRepos.reduce((total, repo) => total + repo.stargazerCount, 0),
    sourceRepoNames: ownRepos.filter((repo) => !repo.isFork).map((repo) => repo.name),
    weeklyCommits: user.contributionsCollection.contributionCalendar.weeks.map((week) =>
      week.contributionDays.reduce((total, day) => total + day.contributionCount, 0),
    ),
  };
}
