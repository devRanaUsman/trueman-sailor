// All salon times are handled as local "HH:MM" strings + "YYYY-MM-DD" dates.

export const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const toTime = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

/**
 * Build available start times for one stylist on one date.
 */
export function buildSlots({ workStart, workEnd, duration, taken = [], date, step = 30, leadMin = 60 }) {
  const slots = [];
  const start = toMinutes(workStart);
  const end = toMinutes(workEnd);
  const busy = taken.map((b) => [toMinutes(b.start), toMinutes(b.end)]);

  const now = new Date();
  const isToday = date === todayStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (let t = start; t + duration <= end; t += step) {
    if (isToday && t < nowMin + leadMin) continue;
    if (busy.some(([s, e]) => overlaps(t, t + duration, s, e))) continue;
    slots.push(toTime(t));
  }
  return slots;
}
