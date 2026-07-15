export function toDateKey(date = new Date()) {
  const target = date instanceof Date ? date : new Date(date);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, "0");
  const day = String(target.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date, amount) {
  const target = new Date(date);
  target.setDate(target.getDate() + amount);
  return target;
}

export function lastNDays(count) {
  return Array.from({ length: count }, (_value, index) => toDateKey(addDays(new Date(), index - count + 1)));
}

export function friendlyDate(dateKey) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${dateKey}T00:00:00`));
}

export function sortAscending(history) {
  return [...history].sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

export function sortDescending(history) {
  return [...history].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
