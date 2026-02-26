export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Safely decodes a URI component, handling double encoding and errors.
 * Recursively decodes until the string stops changing.
 */
export function safeDecodeURIComponent(str: string | string[]): string {
    if (Array.isArray(str)) return safeDecodeURIComponent(str[0]);
    if (!str) return "";

    try {
        const decoded = decodeURIComponent(str);
        // Recursively decode if it looks like it's still encoded
        if (decoded !== str && decoded.includes("%")) {
            return safeDecodeURIComponent(decoded);
        }
        return decoded;
    } catch (e) {
        // Fallback to original string if decoding fails
        return str;
    }
}
