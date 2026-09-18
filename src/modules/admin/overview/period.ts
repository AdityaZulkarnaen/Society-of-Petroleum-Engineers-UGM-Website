const DAY = 24 * 60 * 60 * 1000;

/** Progress through a management period, as of `now`. */
export function periodProgress(
  period: { startsOn: string; endsOn: string },
  now = new Date(),
) {
  const start = new Date(`${period.startsOn}T00:00:00+07:00`);
  const end = new Date(`${period.endsOn}T23:59:59+07:00`);

  const totalMonths =
    (end.getFullYear() - start.getFullYear()) * 12 +
    end.getMonth() -
    start.getMonth() +
    1;
  const elapsedMonths =
    (now.getFullYear() - start.getFullYear()) * 12 +
    now.getMonth() -
    start.getMonth() +
    1;

  const ratio = (now.getTime() - start.getTime()) / (end.getTime() - start.getTime());

  return {
    percent: Math.round(Math.min(1, Math.max(0, ratio)) * 100),
    currentMonth: Math.min(totalMonths, Math.max(0, elapsedMonths)),
    totalMonths,
    remainingMonths: Math.max(0, totalMonths - Math.max(0, elapsedMonths)),
    remainingDays: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY)),
  };
}
