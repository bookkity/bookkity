/** @param {string} name */
export function authorPath(name) {
  return `/author/${encodeURIComponent(name)}`
}
