export interface ThemePalette {
  canvas: string;
  panel: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  brand: string;
  accent: string;
  terminal: string;
  terminalText: string;
  terminalSelection: string;
}

export interface ThemeProfile {
  id: string;
  label: string;
  palette: ThemePalette;
}

export const themeProfiles: ThemeProfile[] = [
  {
    id: "studio-graphite",
    label: "Studio Graphite",
    palette: {
      canvas: "#0C0F0E",
      panel: "#141816",
      surface: "#1E2220",
      ink: "#E8E6E1",
      muted: "#7C8580",
      line: "#282E2B",
      brand: "#5EC4A0",
      accent: "#D4944E",
      terminal: "#0A0C0B",
      terminalText: "#C8D0CA",
      terminalSelection: "#264A3E"
    }
  },
  {
    id: "soft-carbon",
    label: "Soft Carbon",
    palette: {
      canvas: "#0E1012",
      panel: "#161A1C",
      surface: "#1F2426",
      ink: "#E4E2DD",
      muted: "#7A8186",
      line: "#2A3033",
      brand: "#6DCBB0",
      accent: "#C4A054",
      terminal: "#0B0D0F",
      terminalText: "#BEC8C4",
      terminalSelection: "#2B4B44"
    }
  },
  {
    id: "paper-ink",
    label: "Paper Ink",
    palette: {
      canvas: "#F4F1EA",
      panel: "#FFFCF5",
      surface: "#EEE8DC",
      ink: "#191C1A",
      muted: "#697069",
      line: "#D8D0C2",
      brand: "#287A64",
      accent: "#B86937",
      terminal: "#111312",
      terminalText: "#E8EEE9",
      terminalSelection: "#2F6557"
    }
  },
  {
    id: "custom",
    label: "Custom",
    palette: {
      canvas: "#0C0F0E",
      panel: "#141816",
      surface: "#1E2220",
      ink: "#E8E6E1",
      muted: "#7C8580",
      line: "#282E2B",
      brand: "#5EC4A0",
      accent: "#D4944E",
      terminal: "#0A0C0B",
      terminalText: "#C8D0CA",
      terminalSelection: "#264A3E"
    }
  }
];

export function getThemeProfile(profileId: string): ThemeProfile {
  const fallback = themeProfiles[0];
  if (!fallback) {
    throw new Error("No theme profiles configured.");
  }
  return themeProfiles.find((profile) => profile.id === profileId) ?? fallback;
}

export function normalizeHex(value: string | undefined | null): string {
  if (!value) return "#000000";
  const trimmed = String(value).trim();
  if (/^#[0-9a-fA-F]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return "#000000";
}

export function hexToRgbTriplet(hex: string | undefined | null): string {
  const safe = normalizeHex(hex).slice(1);
  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function getReadableTextColor(backgroundColorHex: string): string {
  const hex = normalizeHex(backgroundColorHex).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16) || 0;
  const g = Number.parseInt(hex.slice(2, 4), 16) || 0;
  const b = Number.parseInt(hex.slice(4, 6), 16) || 0;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma > 0.5 ? "#000000" : "#FFFFFF";
}

export function isDarkPalette(palette: ThemePalette | undefined): boolean {
  if (!palette || !palette.canvas) return true;
  const hex = normalizeHex(palette.canvas).slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16) || 0;
  const g = Number.parseInt(hex.slice(2, 4), 16) || 0;
  const b = Number.parseInt(hex.slice(4, 6), 16) || 0;
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luma < 0.5;
}
