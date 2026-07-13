import { Fragment, h, type Markup } from "../../svg/jsx-to-string";
import type { Palette } from "../palettes";

const STRIPE_WIDTHS = [1, 1.5, 2, 3, 4];
const STRIPE_GAP = 5;
const STRIPE_HEIGHT = 12;

// gaps sit between stripes, so there is one fewer of them than there are stripes
export const STRIPES_WIDTH =
  STRIPE_WIDTHS.reduce((total, width) => total + width, 0) + STRIPE_GAP * (STRIPE_WIDTHS.length - 1);

export function CaliperStripes(props: { x: number; centerY: number; palette: Palette; mirrored: boolean }): Markup {
  const widths = props.mirrored ? [...STRIPE_WIDTHS].reverse() : STRIPE_WIDTHS;
  let cursor = props.x;

  return (
    <>
      {widths.map((width) => {
        const x = cursor;
        cursor += width + STRIPE_GAP;
        return (
          <rect
            x={x}
            y={props.centerY - STRIPE_HEIGHT / 2}
            width={width}
            height={STRIPE_HEIGHT}
            fill={props.palette.foregroundSoft}
          />
        );
      })}
    </>
  );
}
