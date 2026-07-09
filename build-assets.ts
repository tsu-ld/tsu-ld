// Reads fonts from the sibling `me` repo (never committed here) and inlines the
// headline/badge outlines + palette into a marked block in card.ts.
// Rerun with `bun build-assets.ts` only if the portfolio fonts or tokens change.
import * as fontkit from "fontkit";
// fontkit misparses this woff2's transformed tables, so decompress to raw ttf first
import { decompress } from "wawoff2";

type LoadedFont = ReturnType<typeof fontkit.create>;

const PORTFOLIO_FONTS_DIR = "../me/front/public/fonts";
const HEADLINE_TEXT = "tsu";
const HEADLINE_EXPO = 14; // matches NameDisplay.astro --expo-static
const BADGE_TEXT = "mañana es mejor";
const BADGE_EXPO = 20; // matches CaliperStripes.astro
const TARGET_FILE = "card.ts";

// oklch tokens copied verbatim from me/front/src/styles/globals.css
const TOKENS = {
  light: {
    background: [0.9087, 0.0231, 84.6],
    backgroundDeep: [0.8634, 0.0292, 84.6],
    foreground: [0.2035, 0.0101, 67.2],
    foregroundSoft: [0.3231, 0.0179, 67.1],
    primary: [0.7, 0.08, 230],
  },
  dark: {
    background: [0.17, 0.015, 84.6],
    backgroundDeep: [0.22, 0.02, 84.6],
    foreground: [0.88, 0.025, 84.6],
    foregroundSoft: [0.72, 0.03, 84.6],
    primary: [0.7, 0.08, 230],
  },
} as const;

function oklchToHex([lightness, chroma, hueDegrees]: readonly number[]): string {
  const hueRadians = (hueDegrees * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0891775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const channels = linear.map((c) => {
    const srgb = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
  });
  return "#" + channels.map((c) => c.toString(16).padStart(2, "0")).join("");
}

type Outline = { unitsPerEm: number; width: number; glyphs: { d: string; x: number }[] };

function outlineText(font: LoadedFont, text: string, expo: number): Outline {
  const instance = font.getVariation({ EXPO: expo });
  const run = instance.layout(text);
  const glyphs: { d: string; x: number }[] = [];
  let x = 0;
  for (let i = 0; i < run.glyphs.length; i++) {
    glyphs.push({ d: run.glyphs[i].path.toSVG(), x: x + run.positions[i].xOffset });
    x += run.positions[i].xAdvance;
  }
  return { unitsPerEm: instance.unitsPerEm, width: x, glyphs };
}

const exposureTtf = await decompress(
  new Uint8Array(await Bun.file(`${PORTFOLIO_FONTS_DIR}/exposure.woff2`).arrayBuffer()),
);
const exposure = fontkit.create(Buffer.from(exposureTtf));

const headline = outlineText(exposure, HEADLINE_TEXT, HEADLINE_EXPO);
const badge = outlineText(exposure, BADGE_TEXT, BADGE_EXPO);

const palettes = Object.fromEntries(
  Object.entries(TOKENS).map(([theme, tokens]) => [
    theme,
    Object.fromEntries(Object.entries(tokens).map(([name, oklch]) => [name, oklchToHex(oklch)])),
  ]),
);

const block =
  `// @generated-begin — outlines + palette produced by build-assets.ts from the portfolio fonts. Do not edit by hand.\n` +
  `type Outline = { unitsPerEm: number; width: number; glyphs: { d: string; x: number }[] };\n` +
  `type Palette = { background: string; backgroundDeep: string; foreground: string; foregroundSoft: string; primary: string };\n` +
  `const HEADLINE: Outline = ${JSON.stringify(headline)};\n` +
  `const BADGE: Outline = ${JSON.stringify(badge)};\n` +
  `const PALETTES: Record<"light" | "dark", Palette> = ${JSON.stringify(palettes, null, 2)};\n` +
  `// @generated-end`;

const cardSource = await Bun.file(TARGET_FILE).text();
const replaced = cardSource.replace(/\/\/ @generated-begin[\s\S]*?\/\/ @generated-end/, block);
if (replaced === cardSource) throw new Error(`generated block not found in ${TARGET_FILE}`);
await Bun.write(TARGET_FILE, replaced);
console.log(`inlined assets into ${TARGET_FILE} (headline ${headline.glyphs.length} glyphs, badge ${badge.glyphs.length} glyphs)`);
