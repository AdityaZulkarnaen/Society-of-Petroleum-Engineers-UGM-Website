/* Rapat times are instants, so they are always shown in Asia/Jakarta — the
   time the rapat actually starts, whatever the device is set to. */

const jakarta = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("id-ID", { ...options, timeZone: "Asia/Jakarta" });

/** 'Sen, 22 Sep 2026 · 16.00'. */
export const meetingTime = (iso: string) => {
  const date = new Date(iso);
  const day = jakarta({
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  return `${day} · ${clock(iso)}`;
};

/** '16.00', the local clock time of the rapat. */
export const clock = (iso: string) =>
  jakarta({ hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** '22 Sep', for the tight columns. */
export const shortDate = (iso: string) =>
  jakarta({ day: "numeric", month: "short" }).format(new Date(iso));

/**
 * `2026-09-22T16:00` in Asia/Jakarta, the value a `datetime-local` input
 * wants. Built from the formatted parts so the offset never has to be
 * hard-coded.
 */
export function toJakartaInput(iso: string) {
  const parts = jakarta({
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date(iso))
    .reduce<Record<string, string>>(
      (acc, part) => ({ ...acc, [part.type]: part.value }),
      {},
    );
  /* an Indonesian 24-hour format writes midnight as '24' */
  const hour = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

/** WIB has no daylight saving, so a wall-clock input maps to one instant. */
export const fromJakartaInput = (value: string) =>
  new Date(`${value}:00+07:00`).toISOString();

/** 'baru saja', '3 menit lalu', '2 jam lalu' — how fresh a scan is. */
export function sinceNow(iso: string, now = Date.now()) {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
