const ALL_TIME_URL = "https://wakatime.com/api/v1/users/current/all_time_since_today";
const SECONDS_PER_HOUR = 3600;

export async function fetchCodingHours(apiKey: string): Promise<number> {
  const response = await fetch(`${ALL_TIME_URL}?api_key=${apiKey}`);
  if (!response.ok) throw new Error(`wakatime failed: ${response.status}`);

  const json = (await response.json()) as { data: { total_seconds: number } };
  return Math.round(json.data.total_seconds / SECONDS_PER_HOUR);
}
