
/**
 * Extracts unique display names from text mentioned with @
 * e.g. "Hello @DarkAcid and @Admin" -> ["DarkAcid", "Admin"]
 */
export function extractMentions(text: string): string[] {
    const mentions = text.match(/@([a-zA-Z0-9_가-힣]+)/g);
    if (!mentions) return [];
    // Remove @ and deduplicate
    return Array.from(new Set(mentions.map(m => m.slice(1))));
}
