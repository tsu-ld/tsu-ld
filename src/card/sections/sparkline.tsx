import { Fragment, h, type Markup } from "../../svg/jsx-to-string";
import { BOOT_SPARK_BEGIN_SECONDS, BOOT_SPARK_DRAW_SECONDS, BOOT_STAT_FADE_SECONDS } from "../boot-timing";
import {
  PAD_LEFT,
  SPARK_AREA_OPACITY,
  SPARK_BOTTOM,
  SPARK_LABEL_BASELINE,
  SPARK_RIGHT,
  SPARK_TOP,
} from "../layout";
import type { Palette } from "../palettes";

const MINIMUM_POINTS = 2;

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function pointsFor(weeklyCommits: number[]): string[] {
  const peak = Math.max(...weeklyCommits, 1);
  const step = (SPARK_RIGHT - PAD_LEFT) / (weeklyCommits.length - 1);

  return weeklyCommits.map((count, index) => {
    const x = round(PAD_LEFT + index * step);
    const y = round(SPARK_BOTTOM - (count / peak) * (SPARK_BOTTOM - SPARK_TOP));
    return `${x} ${y}`;
  });
}

// commit activity that draws itself in during the boot sequence
export function Sparkline(props: { weeklyCommits: number[]; palette: Palette }): Markup {
  if (props.weeklyCommits.length < MINIMUM_POINTS) return <></>;

  const linePath = `M${pointsFor(props.weeklyCommits).join(" L")}`;
  const areaPath = `${linePath} L${SPARK_RIGHT} ${SPARK_BOTTOM} L${PAD_LEFT} ${SPARK_BOTTOM} Z`;
  const drawBegin = `${BOOT_SPARK_BEGIN_SECONDS}s`;
  // the fill only appears once enough of the line exists to enclose it
  const fillBegin = `${(BOOT_SPARK_BEGIN_SECONDS + BOOT_SPARK_DRAW_SECONDS / 2).toFixed(2)}s`;

  return (
    <>
      <text x={PAD_LEFT} y={SPARK_LABEL_BASELINE} class="label" opacity="0">
        {"CONTRIBUTIONS · 12 MO"}
        <animate
          attributeName="opacity"
          values="0;1"
          keyTimes="0;1"
          dur={`${BOOT_STAT_FADE_SECONDS}s`}
          begin={drawBegin}
          fill="freeze"
        />
      </text>
      <path d={areaPath} fill={props.palette.primary} opacity="0">
        <animate
          attributeName="opacity"
          values={`0;${SPARK_AREA_OPACITY}`}
          keyTimes="0;1"
          dur={`${BOOT_STAT_FADE_SECONDS}s`}
          begin={fillBegin}
          fill="freeze"
        />
      </path>
      <path
        d={linePath}
        fill="none"
        stroke={props.palette.primary}
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        pathLength="1"
        stroke-dasharray="1"
        stroke-dashoffset="1"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="1;0"
          keyTimes="0;1"
          dur={`${BOOT_SPARK_DRAW_SECONDS}s`}
          begin={drawBegin}
          fill="freeze"
          calcMode="spline"
          keySplines="0.65 0 0.35 1"
        />
      </path>
    </>
  );
}
