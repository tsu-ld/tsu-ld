import { h, type Markup } from "./jsx-to-string";

// text pre-baked into paths, so the card needs no font wherever GitHub renders it
export type Outline = {
  unitsPerEm: number;
  width: number;
  glyphs: { d: string; x: number }[];
};

export function outlineWidth(outline: Outline, fontSize: number): number {
  return (outline.width / outline.unitsPerEm) * fontSize;
}

export function GlyphOutline(props: {
  outline: Outline;
  x: number;
  baselineY: number;
  fontSize: number;
  fill: string;
}): Markup {
  // glyph paths grow upwards from the baseline, so the y axis is flipped
  const scale = props.fontSize / props.outline.unitsPerEm;
  return (
    <g fill={props.fill} transform={`translate(${props.x} ${props.baselineY}) scale(${scale} ${-scale})`}>
      {props.outline.glyphs.map((glyph) => <path transform={`translate(${glyph.x} 0)`} d={glyph.d} />)}
    </g>
  );
}
