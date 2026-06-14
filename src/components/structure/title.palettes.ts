import { resolveTheme, type Theme } from "@/theme";
import { coinFlip, randomArrayMember } from "@/utils/rand";

type AsciiPalette = {
  spotlightOpts?: {
    radius?: number;
    opacity?: number;
  };
  canvasOpacity?: number;
  colors: [`#${string}`, ...`#${string}`[]];
};

type ThemedAsciiPalette = {
  light: AsciiPalette;
  dark: AsciiPalette;
};

type AsciiPalettes = {
  [key: string]: AsciiPalette | ThemedAsciiPalette | AsciiPalettes;
};

const isAsciiPalette = (palette: unknown): palette is AsciiPalette => {
  return (
    Boolean(palette) &&
    typeof palette === "object" &&
    palette !== null &&
    "colors" in palette &&
    Array.isArray(palette.colors)
  );
};

const isThemedAsciiPalette = (
  palette: unknown,
): palette is ThemedAsciiPalette => {
  return (
    Boolean(palette) &&
    typeof palette === "object" &&
    palette !== null &&
    "light" in palette &&
    "dark" in palette &&
    isAsciiPalette(palette.light) &&
    isAsciiPalette(palette.dark)
  );
};

// TODO: figure out if this is in poor taste
export const palettes = {
  themed: {
    light: {
      canvasOpacity: 0.8,
      colors: ["#F5D3C8", "#DE639A", "#D81159", "#5E2BFF"],
      spotlightOpts: {
        radius: 12,
        opacity: 1,
      },
    },
    dark: {
      canvasOpacity: 0.4,
      colors: ["#FFFFFF", "#DBEAD3", "#345830", "#6C7D47"],
    },
  },
  // from: https://en.wikipedia.org/wiki/LGBT_symbols#Pride_flags
  // https://www.kapwing.com/resources/official-pride-colors-2021-exact-color-codes-for-15-pride-flags/
  // FIXME: we should be sharing hex codes maybe for some of these? Not sure? Need to better research the meaning behind each color and determine if there SHOULD be shared colors here
  pride: {
    l: {
      light: {
        canvasOpacity: 0.6,
        colors: ["#D62800", "#FF9B56", "#DADADA", "#D462A6", "#A40062"],
      },
      dark: {
        canvasOpacity: 0.7,
        colors: ["#D62800", "#FF9B56", "#FFFFFF", "#D462A6", "#A40062"],
      },
    },
    b: { canvasOpacity: 0.5, colors: ["#D60270", "#9B4F96", "#0038A8"] },
    t: {
      light: {
        canvasOpacity: 0.9,
        colors: ["#5BCFFB", "#F5ABB9", "#DADADA", "#F5ABB9", "#5BCFFB"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#5BCFFB", "#F5ABB9", "#FFFFFF", "#F5ABB9", "#5BCFFB"],
      },
    },
    i: { canvasOpacity: 0.8, colors: ["#FFD800", "#7902AA"] },
    a: {
      light: {
        canvasOpacity: 0.8,
        colors: ["#000000", "#A4A4A4", "#DADADA", "#810081"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#404040", "#A4A4A4", "#FFFFFF", "#810081"],
      },
    },
    p: { canvasOpacity: 0.8, colors: ["#FF1C8D", "#FFD700", "#1AB3FF"] },
    n: {
      // colors: ["#FCF431", "#FCFCFC", "#9D59D2", "#282828"],
      light: {
        canvasOpacity: 0.8,
        colors: ["#FCF431", "#ECECEC", "#9D59D2", "#282828"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#FCF431", "#FCFCFC", "#9D59D2", "#585858"],
      },
    },
    d: {
      // colors: ["#000000", "#FFFFFF", "#6E0071", "#D3D3D3"],
      light: {
        canvasOpacity: 0.8,
        colors: ["#000000", "#DADADA", "#6E0071", "#A3A3A3"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#404040", "#FFFFFF", "#6E0071", "#D3D3D3"],
      },
    },
    gq: {
      light: {
        canvasOpacity: 0.8,
        colors: ["#B57FDD", "#DADADA", "#49821E"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#B57FDD", "#FFFFFF", "#49821E"],
      },
    },
    gf: {
      // colors: ["#FE76A2", "#FFFFFF", "#BF12D7", "#000000", "#303CBE"],
      light: {
        canvasOpacity: 0.6,
        colors: ["#FE76A2", "#DADADA", "#BF12D7", "#000000", "#303CBE"],
      },
      dark: {
        canvasOpacity: 0.7,
        colors: ["#FE76A2", "#FFFFFF", "#BF12D7", "#404040", "#303CBE"],
      },
    },
    ag: {
      // colors: [
      //   "#000000",
      //   "#BABABA",
      //   "#FFFFFF",
      //   "#BAF484",
      //   "#FFFFFF",
      //   "#BABABA",
      //   "#000000",
      // ],
      light: {
        canvasOpacity: 0.8,
        colors: [
          "#000000",
          "#BABABA",
          "#DADADA",
          "#BAF484",
          "#DADADA",
          "#BABABA",
          "#000000",
        ],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: [
          "#404040",
          "#BABABA",
          "#FFFFFF",
          "#BAF484",
          "#FFFFFF",
          "#BABABA",
          "#404040",
        ],
      },
    },
    ar: {
      // colors: ["#3BA740", "#A8D47A", "#FFFFFF", "#ABABAB", "#000000"],
      light: {
        canvasOpacity: 0.8,
        colors: ["#3BA740", "#A8D47A", "#DADADA", "#ABABAB", "#000000"],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: ["#3BA740", "#A8D47A", "#FFFFFF", "#ABABAB", "#404040"],
      },
    },
    general: {
      // colors: [
      //   "#E50000",
      //   "#FF8D00",
      //   "#FFEE00",
      //   "#028121",
      //   "#004CFF",
      //   "#770088",
      //   "#FFFFFF",
      //   "#FFAFC7",
      //   "#73D7EE",
      //   "#000000",
      // ],
      light: {
        canvasOpacity: 0.8,
        colors: [
          "#E50000",
          "#FF8D00",
          "#FFEE00",
          "#028121",
          "#004CFF",
          "#770088",
          "#DADADA",
          "#FFAFC7",
          "#73D7EE",
          "#000000",
        ],
      },
      dark: {
        canvasOpacity: 0.8,
        colors: [
          "#E50000",
          "#FF8D00",
          "#FFEE00",
          "#028121",
          "#004CFF",
          "#770088",
          "#FFFFFF",
          "#FFAFC7",
          "#73D7EE",
          "#404040",
        ],
      },
    },
  },
  blm: {
    bhm: {
      light: {
        canvasOpacity: 1,
        colors: ["#000000", "#EE3423", "#FFD502", "#2F9744", "#000000"],
      },
      dark: {
        canvasOpacity: 1,
        colors: ["#404040", "#EE3423", "#FFD502", "#2F9744", "#404040"],
      },
    },
    juneteenth: {
      // colors: [
      //   "#242424",
      //   "#B7372B",
      //   "#FFFFFF",
      //   "#17234A",
      //   "#000000",
      //   "#EE3423",
      //   "#FFD502",
      //   "#2F9744",
      // ],
      light: {
        colors: [
          "#242424",
          "#B7372B",
          "#DADADA",
          "#17234A",
          "#000000",
          "#EE3423",
          "#FFD502",
          "#2F9744",
        ],
      },
      dark: {
        colors: [
          "#242424",
          "#B7372B",
          "#FFFFFF",
          "#17234A",
          "#404040",
          "#EE3423",
          "#FFD502",
          "#2F9744",
        ],
      },
    },
    nmaahc: {
      // https://nmaahc.si.edu/about/brand-guide/visual-identity
      light: {
        canvasOpacity: 1,
        colors: [
          // repeated for additional visibility
          "#612A60",
          "#000000",
          "#8C8279",
          "#612A60",
          "#000000",
          "#8C8279",
          "#612A60",
          "#000000",
          "#8C8279",
          "#AD2F4D",
          "#DA4926",
          "#EDAA1A",
          "#8E9933",
          "#1C8B81",
          "#5D6D9C",
        ],
      },
      dark: {
        canvasOpacity: 1,
        colors: [
          // repeated for additional visibility
          "#612A60",
          "#404040",
          "#8C8279",
          "#612A60",
          "#404040",
          "#8C8279",
          "#612A60",
          "#404040",
          "#8C8279",
          "#AD2F4D",
          "#DA4926",
          "#EDAA1A",
          "#8E9933",
          "#1C8B81",
          "#5D6D9C",
        ],
      },
    },
  },
} as const satisfies AsciiPalettes;

export const paletteKeys = Object.entries(palettes).flatMap(([key, value]) => {
  if (isAsciiPalette(value)) {
    return [key];
  } else if (isThemedAsciiPalette(value)) {
    return [`${key}.light`, `${key}.dark`];
  } else {
    return Object.keys(value).map((nestedKey) => `${key}.${nestedKey}`);
  }
});

export const pickPaletteByKey = (key: string, theme: Theme): AsciiPalette => {
  if (!paletteKeys.includes(key)) {
    throw new Error(`Invalid palette key: ${key}`);
  }

  const [mainKey, subKey] = key.split(".");
  const palette = palettes[mainKey as keyof typeof palettes];
  const resolvedTheme = resolveTheme(theme);

  if (isAsciiPalette(palette)) {
    return palette;
  } else if (isThemedAsciiPalette(palette)) {
    return palette[resolvedTheme];
  } else {
    const nestedPalette = palette[subKey as keyof typeof palette];
    if (isAsciiPalette(nestedPalette)) {
      return nestedPalette;
    } else if (isThemedAsciiPalette(nestedPalette)) {
      return nestedPalette[resolvedTheme];
    }
  }

  throw new Error(`Palette not found for key: ${key}`);
};

export const pickRandomPalette = (theme: Theme): AsciiPalette => {
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const resolvedTheme = resolveTheme(theme);

  // Check for specific dates first
  if (month === 6 && day === 19) {
    return palettes.blm.juneteenth[resolvedTheme];
  } else if (month === 2 && coinFlip()) {
    return coinFlip()
      ? palettes.blm.bhm[resolvedTheme]
      : palettes.blm.nmaahc[resolvedTheme];
  } else if (month === 6 && coinFlip()) {
    const member = randomArrayMember(Object.values(palettes.pride));
    if ("light" in member && "dark" in member) {
      return member[resolvedTheme];
    }
    return member;
  }

  return palettes.themed[resolvedTheme];
};

export const findPaletteKey = (palette: AsciiPalette): string | undefined => {
  for (const [key, value] of Object.entries(palettes)) {
    if (isAsciiPalette(value) && value.colors === palette.colors) {
      return key;
    } else if (isThemedAsciiPalette(value)) {
      for (const [themeKey, themeValue] of Object.entries(value)) {
        if (themeValue.colors === palette.colors) {
          return `${key}.${themeKey}`;
        }
      }
    } else {
      // Check nested palettes
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (
          isAsciiPalette(nestedValue) &&
          nestedValue.colors === palette.colors
        ) {
          return `${key}.${nestedKey}`;
        } else if (isThemedAsciiPalette(nestedValue)) {
          for (const [, themeValue] of Object.entries(nestedValue)) {
            if (themeValue.colors === palette.colors) {
              return `${key}.${nestedKey}`;
            }
          }
        }
      }
    }
  }
};
