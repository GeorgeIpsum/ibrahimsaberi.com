export const zodiacToDate = (range: [string, string]): [Date, Date] => {
  const [start, end] = range.map((d) => {
    const [day, month, year] = d.split("-").map(Number);
    return new Date(year ?? new Date().getUTCFullYear(), month - 1, day);
  });
  return [start, end];
};

export const isDateInRange = (date: Date, range: [Date, Date]): boolean => {
  const [start, end] = range;
  if (start > end) {
    // sagittarius specific edge-case
    return date <= start || date >= end;
  }

  return date >= start && date <= end;
};
