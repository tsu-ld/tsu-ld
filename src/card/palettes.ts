export type Theme = "light" | "dark";

export type Palette = {
  background: string;
  backgroundDeep: string;
  foreground: string;
  foregroundSoft: string;
  primary: string;
};

export const PALETTES: Record<Theme, Palette> = {
  light: {
    background: "#e8e0d0",
    backgroundDeep: "#dbd1bd",
    foreground: "#1a1612",
    foregroundSoft: "#3a322a",
    primary: "#68a8c7",
  },
  dark: {
    background: "#120f08",
    backgroundDeep: "#1f1a10",
    foreground: "#dfd7c5",
    foregroundSoft: "#ada490",
    primary: "#68a8c7",
  },
};
