export const ONE_MS = 1 as const;
export const ONE_SECOND = 1_000 as const;
export const ONE_S = ONE_SECOND;
export const ONE_MINUTE = 60_000 as const;
export const ONE_M = ONE_MINUTE;
export const ONE_HOUR = 3_600_000 as const;
export const ONE_H = ONE_HOUR;
export const ONE_DAY = 86_400_000 as const;
export const ONE_D = ONE_DAY;
export const ONE_WEEK = 604_800_000 as const;
export const ONE_W = ONE_WEEK;
export const ONE_YEAR = 31_536_000_000 as const;
export const ONE_Y = ONE_YEAR;

type UnitMs = "ms" | "millisecond";
type UnitS = "s" | "second";
type UnitM = "m" | "minute";
type UnitH = "h" | "hour";
type UnitD = "d" | "day";
type UnitW = "w" | "week";
type UnitY = "y" | "year";
export type TimeUnit = UnitMs | UnitS | UnitM | UnitH | UnitD | UnitW | UnitY;
export type TimeValue<
  Num extends number,
  Unit extends TimeUnit = TimeUnit,
> = `${Num}${Unit}`;
type SpecificTimeValue<
  Num extends number,
  Unit extends TimeUnit,
> = `${Num}${Unit}` & { value: Num; unit: Unit };

export const parseTimeValue = <Num extends number>(
  val: string | TimeValue<Num>,
) => {
  const match = val.match(
    /^(\d+\.?)(ms|millisecond|s|second|m|minute|h|hour|d|day|w|week|y|year|ly|leapYear)$/,
  );
  if (!match) {
    throw new Error(`Invalid time value: ${val}`);
  }
  const [parsedTimeVal, numStr, unit] = match as [
    TimeValue<Num>,
    string,
    TimeUnit,
  ];
  const num = parseFloat(numStr);
  return { val: parsedTimeVal, num, unit };
};

export const timeToMs = (val: TimeValue<number>): number => {
  const { num, unit } = parseTimeValue(val);
  return num * timeUnitToMs[unit];
};

export const msToTime = <Unit extends TimeUnit>(
  ms: number,
  unit: Unit,
): TimeValue<number, Unit> => {
  const num = ms / timeUnitToMs[unit];
  return `${num}${unit}` as TimeValue<number, Unit>;
};

export const toTime = <
  IncomingValue extends TimeValue<number>,
  OutgoingUnit extends TimeUnit,
>(
  value: IncomingValue,
  toUnit: OutgoingUnit,
): SpecificTimeValue<number, OutgoingUnit> => {
  const ms = timeToMs(value);
  const timeValue = msToTime(ms, toUnit) as SpecificTimeValue<
    number,
    OutgoingUnit
  >;
  (timeValue as { value: number }).value = ms;
  (timeValue as { unit: OutgoingUnit }).unit = toUnit;
  return timeValue;
};

const timeUnitToMs: Record<TimeUnit, number> = {
  ms: ONE_MS,
  millisecond: ONE_MS,
  s: ONE_SECOND,
  second: ONE_SECOND,
  m: ONE_MINUTE,
  minute: ONE_MINUTE,
  h: ONE_HOUR,
  hour: ONE_HOUR,
  d: ONE_DAY,
  day: ONE_DAY,
  w: ONE_WEEK,
  week: ONE_WEEK,
  y: ONE_YEAR,
  year: ONE_YEAR,
};
