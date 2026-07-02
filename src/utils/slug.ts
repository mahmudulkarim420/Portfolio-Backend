/**
 * Convert a string into a URL-safe lowercase kebab-case slug.
 *
 * Matches the project slug validation rule (README §7.5):
 * `^[a-z0-9]+(?:-[a-z0-9]+)*$`
 */
export function slugify(input: string): string {
  return input
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric (keep spaces & hyphens)
    .replace(/[\s_-]+/g, '-') // collapse spaces/underscores/hyphens to single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

/**
 * Check whether a string is already a valid kebab-case slug.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
