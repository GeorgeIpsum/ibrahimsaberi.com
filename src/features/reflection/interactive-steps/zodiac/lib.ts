import {
  ZodiacAquarius,
  ZodiacAries,
  ZodiacCancer,
  ZodiacCapricorn,
  ZodiacGemini,
  ZodiacLeo,
  ZodiacLibra,
  ZodiacOphiuchus,
  ZodiacPisces,
  ZodiacSagittarius,
  ZodiacScorpio,
  ZodiacTaurus,
  ZodiacVirgo,
} from "lucide-react";
import { isDateInRange, zodiacToDate } from "./utils";
// colors taken from https://www.eggradients.com/blog/zodiac-colors
// idk these probs dont even make sense
// i just didnt want to google homestuck in current_year
export const zodiac = {
  aries: {
    Icon: ZodiacAries,
    range: zodiacToDate(["18-04", "13-05"]),
    description: "the ram",
    color: "#FF2400",
  },
  taurus: {
    Icon: ZodiacTaurus,
    range: zodiacToDate(["13-05", "21-06"]),
    description: "the bull",
    color: "#008000",
  },
  gemini: {
    Icon: ZodiacGemini,
    range: zodiacToDate(["21-06", "20-07"]),
    description: "the twins",
    color: "#FFD700",
  },
  cancer: {
    Icon: ZodiacCancer,
    range: zodiacToDate(["20-07", "10-08"]),
    description: "the crab",
    color: "#00BFFF",
  },
  leo: {
    Icon: ZodiacLeo,
    range: zodiacToDate(["10-08", "16-09"]),
    description: "the lion",
    color: "#FF8C00",
  },
  virgo: {
    Icon: ZodiacVirgo,
    range: zodiacToDate(["16-09", "30-10"]),
    description: "the maiden",
    color: "#6B8E23",
  },
  libra: {
    Icon: ZodiacLibra,
    range: zodiacToDate(["30-10", "23-11"]),
    description: "the scales",
    color: "#FF1493",
  },
  scorpio: {
    Icon: ZodiacScorpio,
    range: zodiacToDate(["23-11", "29-11"]),
    description: "the scorpion",
    color: "#800080",
  },
  ophiuchus: {
    Icon: ZodiacOphiuchus,
    range: zodiacToDate(["29-11", "17-12"]),
    description: "the serpent-bearer",
    color: "#38AF91",
  },
  sagittarius: {
    Icon: ZodiacSagittarius,
    range: zodiacToDate(["17-12", "20-01"]),
    description: "the archer",
    color: "#FF4500",
  },
  capricorn: {
    Icon: ZodiacCapricorn,
    range: zodiacToDate(["20-01", "18-02"]),
    description: "the goat",
    color: "#000080",
  },
  aquarius: {
    Icon: ZodiacAquarius,
    range: zodiacToDate(["18-02", "20-03"]),
    description: "the water-bearer",
    color: "#00CED1",
  },
  pisces: {
    Icon: ZodiacPisces,
    range: zodiacToDate(["20-03", "18-04"]),
    description: "the fish",
    color: "#4B0082",
  },
} as const;

export type ZodiacSign = keyof typeof zodiac;
export type ZodiacData = (typeof zodiac)[ZodiacSign];

export const getSign = (date: Date): ZodiacSign => {
  for (const [sign, data] of Object.entries(zodiac)) {
    if (isDateInRange(date, data.range)) {
      return sign as ZodiacSign;
    }
  }

  throw new Error("How did you do this. wtf");
};
