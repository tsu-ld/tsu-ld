import type { Stats } from "../../stats/types";
import { Fragment, h, type Markup } from "../../svg/jsx-to-string";
import { BOOT_STAT_FADE_SECONDS, BOOT_STAT_STAGGER_SECONDS, BOOT_STATS_BEGIN_SECONDS } from "../boot-timing";
import { RIGHT_EDGE, STATS_FIRST_BASELINE, STATS_LABEL_X, STATS_ROW_HEIGHT } from "../layout";
import { formatCompact, formatNumber } from "../number-format";
import type { Palette } from "../palettes";

const RULE_BELOW_BASELINE = 14;
const MINUS_SIGN = "\u2212";

function rowsFor(stats: Stats): [label: string, value: string][] {
  return [
    ["UPTIME", stats.uptime],
    ["REPOS / CONTRIB", `${stats.repoCount} / ${stats.contributedCount}`],
    ["STARS", formatNumber(stats.stars)],
    ["COMMITS", formatNumber(stats.commits)],
    ["FOLLOWERS", formatNumber(stats.followers)],
    ["CODING HOURS", `${formatNumber(stats.codingHours)} h`],
    ["LINES OF CODE", `+${formatCompact(stats.locAdded)} / ${MINUS_SIGN}${formatCompact(stats.locDeleted)}`],
  ];
}

export function StatRows(props: { stats: Stats; palette: Palette }): Markup {
  return (
    <>
      {rowsFor(props.stats).map(([label, value], index) => {
        const baseline = STATS_FIRST_BASELINE + index * STATS_ROW_HEIGHT;
        const begin = (BOOT_STATS_BEGIN_SECONDS + index * BOOT_STAT_STAGGER_SECONDS).toFixed(2);

        return (
          <g opacity="0">
            <animate
              attributeName="opacity"
              values="0;1"
              keyTimes="0;1"
              dur={`${BOOT_STAT_FADE_SECONDS}s`}
              begin={`${begin}s`}
              fill="freeze"
            />
            <text x={STATS_LABEL_X} y={baseline} class="label">
              {label}
            </text>
            <text x={RIGHT_EDGE} y={baseline} class="value end">
              {value}
            </text>
            <line
              x1={STATS_LABEL_X}
              y1={baseline + RULE_BELOW_BASELINE}
              x2={RIGHT_EDGE}
              y2={baseline + RULE_BELOW_BASELINE}
              stroke={props.palette.foreground}
              stroke-opacity="0.15"
            />
          </g>
        );
      })}
    </>
  );
}
