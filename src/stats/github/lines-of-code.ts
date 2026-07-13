import { githubGraphql } from "./graphql-client";

const HISTORY_PAGE_SIZE = 100;

const QUERY = `query($owner: String!, $name: String!, $authorId: ID!, $cursor: String) {
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

type Response = {
  repository: {
    defaultBranchRef: {
      target: {
        history?: {
          pageInfo: { hasNextPage: boolean; endCursor: string };
          nodes: { additions: number; deletions: number }[];
        };
      } | null;
    } | null;
  };
};

export type LinesOfCode = { added: number; deleted: number };

// no cache: recounts every repo's history daily. Fine at this repo count;
// add a committed cache file if rate limits ever bite.
export async function countLinesOfCode(
  token: string,
  owner: string,
  authorId: string,
  repoNames: string[],
): Promise<LinesOfCode> {
  let added = 0;
  let deleted = 0;

  for (const name of repoNames) {
    let cursor: string | null = null;

    do {
      const page: Response = await githubGraphql<Response>(token, QUERY, { owner, name, authorId, cursor });
      const history = page.repository.defaultBranchRef?.target?.history;
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
