/** Normalize menu search input for case-insensitive substring match. */
export function normalizeMenuSearch(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase();
}

/** Returns true when query is empty or label contains query. */
export function matchesMenuSearch(query, label) {
  const q = normalizeMenuSearch(query);
  if (!q) return true;
  return normalizeMenuSearch(label).includes(q);
}
