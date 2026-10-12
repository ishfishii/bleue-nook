export const pad = (n: number) => String(n).padStart(2, '0');

// Dates are stored as local-time YYYY-MM-DD strings
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const daysAgo = (n: number) => {
  const t = new Date();
  return toISO(new Date(t.getFullYear(), t.getMonth(), t.getDate() - n));
};
