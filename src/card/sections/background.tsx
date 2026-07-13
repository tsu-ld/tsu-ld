import { Fragment, h, type Markup } from "../../svg/jsx-to-string";
import { GRAIN_OPACITY, GRID_CELL, GRID_CROSSHAIRS, HEIGHT, WIDTH } from "../layout";
import type { Palette } from "../palettes";

const CROSSHAIR_ARM = 4;

function Crosshairs(props: { palette: Palette }): Markup {
  return (
    <>
      {GRID_CROSSHAIRS.map(([x, y]) => (
        <path
          d={`M${x - CROSSHAIR_ARM} ${y} H${x + CROSSHAIR_ARM} M${x} ${y - CROSSHAIR_ARM} V${y + CROSSHAIR_ARM}`}
          stroke={props.palette.foregroundSoft}
          stroke-opacity="0.4"
        />
      ))}
    </>
  );
}

export function Background(props: { palette: Palette }): Markup {
  return (
    <>
      <rect width={WIDTH} height={HEIGHT} fill="url(#vignette)" />
      <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />
      <Crosshairs palette={props.palette} />
      <rect width={WIDTH} height={HEIGHT} filter="url(#grain)" opacity={GRAIN_OPACITY} />
      <rect
        x="0.5"
        y="0.5"
        width={WIDTH - 1}
        height={HEIGHT - 1}
        fill="none"
        stroke={props.palette.foreground}
        stroke-opacity="0.18"
      />
    </>
  );
}

export function BackgroundDefs(props: { palette: Palette }): Markup {
  return (
    <>
      <radialGradient id="vignette" cx="0.5" cy="0.42" r="0.9">
        <stop offset="0" stop-color={props.palette.background} />
        <stop offset="1" stop-color={props.palette.backgroundDeep} />
      </radialGradient>
      <pattern id="grid" width={GRID_CELL} height={GRID_CELL} patternUnits="userSpaceOnUse">
        <path d={`M ${GRID_CELL} 0 L 0 0 0 ${GRID_CELL}`} fill="none" stroke={props.palette.foreground} stroke-opacity="0.06" />
      </pattern>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </>
  );
}
