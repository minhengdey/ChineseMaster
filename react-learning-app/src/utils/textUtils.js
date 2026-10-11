// Unicode-aware text utilities
export function hasLetters(text) {
    if (text == null) return false
    const s = String(text)
    // Prefer Unicode property check when available
    try {
        return /\p{L}/u.test(s)
    } catch (e) {
        // Fallback to ASCII letter check
        return /[A-Za-z]/.test(s)
    }
}

export default {
    hasLetters,
}
