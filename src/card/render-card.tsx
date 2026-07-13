import { CARD_TITLE, CONTACT, DISPLAY_NAME, LOCATION } from "../profile";
import type { Stats } from "../stats/types";
import { GlyphOutline, outlineWidth } from "../svg/glyph-outline";
import { Fragment, h, renderToString, type Markup } from "../svg/jsx-to-string";
import { BOOT_HEADLINE_SECONDS } from "./boot-timing";
import { BADGE, HEADLINE } from "./font-outlines";
import {
  BADGE_FONT_SIZE,
  DIVIDER_X,
  FOOTER_BASELINE,
  FOOTER_RULE_Y,
  HEADLINE_BASELINE,
  HEADLINE_SIZE,
  HEIGHT,
  PAD_LEFT,
  RIGHT_EDGE,
  ROLE_FONT_SIZE,
  TOPBAR_BASELINE,
  TOPBAR_RULE_Y,
  WIDTH,
} from "./layout";
import { PALETTES, type Palette, type Theme } from "./palettes";
import { Background, BackgroundDefs } from "./sections/background";
import { CaliperStripes, STRIPES_WIDTH } from "./sections/caliper-stripes";
import { Sparkline } from "./sections/sparkline";
import { StatRows } from "./sections/stat-rows";
import { Typewriter } from "./sections/typewriter";

const RULE_OVERHANG = 6;
const BADGE_MARGIN = 12;
const STRIPE_CENTER_ABOVE_BASELINE = 5;
const HEADLINE_WIPE_OVERSHOOT = 8;
const HEADLINE_WIPE_HEIGHT_RATIO = 1.35;

function styleSheet(palette: Palette): string {
  return `
text { font-family: 'JetBrains Mono', ui-monospace, monospace; fill: ${palette.foreground}; }
.micro { font-size: 10px; letter-spacing: 1.8px; fill: ${palette.foregroundSoft}; }
.label { font-size: 10px; letter-spacing: 1.8px; fill: ${palette.foregroundSoft}; }
.value { font-size: 15px; }
.role { font-size: ${ROLE_FONT_SIZE}px; fill: ${palette.foregroundSoft}; }
.end { text-anchor: end; }
`;
}

function HeadlineWipe(): Markup {
  const width = Math.round(outlineWidth(HEADLINE, HEADLINE_SIZE)) + HEADLINE_WIPE_OVERSHOOT;

  return (
    <clipPath id="headline-wipe">
      <rect
        x={PAD_LEFT - 4}
        y={HEADLINE_BASELINE - HEADLINE_SIZE}
        width="0"
        height={Math.round(HEADLINE_SIZE * HEADLINE_WIPE_HEIGHT_RATIO)}
      >
        <animate
          attributeName="width"
          values={`0;${width}`}
          keyTimes="0;1"
          dur={`${BOOT_HEADLINE_SECONDS}s`}
          begin="0s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.22 1 0.36 1"
        />
      </rect>
    </clipPath>
  );
}

function Footer(props: { palette: Palette }): Markup {
  const badgeX = PAD_LEFT + STRIPES_WIDTH + BADGE_MARGIN;
  const badgeWidth = outlineWidth(BADGE, BADGE_FONT_SIZE);
  const stripesCenterY = FOOTER_BASELINE - STRIPE_CENTER_ABOVE_BASELINE;

  return (
    <>
      <line
        x1={PAD_LEFT - RULE_OVERHANG}
        y1={FOOTER_RULE_Y}
        x2={RIGHT_EDGE}
        y2={FOOTER_RULE_Y}
        stroke={props.palette.foreground}
        stroke-opacity="0.25"
      />
      <CaliperStripes x={PAD_LEFT} centerY={stripesCenterY} palette={props.palette} mirrored={false} />
      <GlyphOutline
        outline={BADGE}
        x={badgeX}
        baselineY={FOOTER_BASELINE}
        fontSize={BADGE_FONT_SIZE}
        fill={props.palette.foreground}
      />
      <CaliperStripes
        x={badgeX + badgeWidth + BADGE_MARGIN}
        centerY={stripesCenterY}
        palette={props.palette}
        mirrored
      />
      <text x={RIGHT_EDGE} y={FOOTER_BASELINE} class="micro end">
        {CONTACT}
      </text>
    </>
  );
}

export function renderCard(theme: Theme, stats: Stats): string {
  const palette = PALETTES[theme];

  const card = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-labelledby="card-title"
    >
      <title id="card-title">{CARD_TITLE}</title>
      <style>{styleSheet(palette)}</style>
      <defs>
        <BackgroundDefs palette={palette} />
        <HeadlineWipe />
      </defs>

      <Background palette={palette} />

      <text x={PAD_LEFT} y={TOPBAR_BASELINE} class="micro">
        {DISPLAY_NAME}
      </text>
      <text x={RIGHT_EDGE} y={TOPBAR_BASELINE} class="micro end">
        {LOCATION}
      </text>
      <line
        x1={PAD_LEFT - RULE_OVERHANG}
        y1={TOPBAR_RULE_Y}
        x2={RIGHT_EDGE}
        y2={TOPBAR_RULE_Y}
        stroke={palette.foreground}
        stroke-opacity="0.25"
      />
      <line
        x1={DIVIDER_X}
        y1={TOPBAR_RULE_Y}
        x2={DIVIDER_X}
        y2={FOOTER_RULE_Y}
        stroke={palette.foreground}
        stroke-opacity="0.15"
      />

      <g clip-path="url(#headline-wipe)">
        <GlyphOutline
          outline={HEADLINE}
          x={PAD_LEFT}
          baselineY={HEADLINE_BASELINE}
          fontSize={HEADLINE_SIZE}
          fill={palette.foreground}
        />
      </g>

      <Typewriter palette={palette} />
      <Sparkline weeklyCommits={stats.weeklyCommits} palette={palette} />
      <StatRows stats={stats} palette={palette} />
      <Footer palette={palette} />
    </svg>
  );

  return `${renderToString(card)}\n`;
}
