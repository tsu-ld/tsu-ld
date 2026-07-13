const GRAPHQL_URL = "https://api.github.com/graphql";

export async function githubGraphql<Data>(
  token: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<Data> {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = (await response.json()) as { data?: Data; errors?: { message: string }[] };
  if (!response.ok || json.errors) {
    throw new Error(`github graphql failed: ${json.errors?.[0]?.message ?? response.status}`);
  }

  return json.data as Data;
}
