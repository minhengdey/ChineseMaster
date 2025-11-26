// Adapter to normalize ISE scoring responses into a consistent camelCase shape.
// Handles multiple legacy field variants and nested `sentence` wrappers.
// Returned object includes camelCase fields plus a `legacy` object preserving snake_case
// so existing components expecting `total_score` etc continue to work.
export function adaptIseScore(raw) {
    if (!raw) return null;
    let data = raw;
    // If backend sometimes returns { sentence: {...} } unwrap for convenience
    const sent = (data && typeof data === 'object' && data.sentence && typeof data.sentence === 'object') ? data.sentence : {};

    // Prefer explicit values, falling back across known aliases
    const totalScore = sent.total_score ?? sent.totalScore ?? sent.overall ?? data.total_score ?? data.totalScore ?? data.overall ?? null;
    const fluency = sent.fluency ?? data.fluency ?? data.fluencyScore ?? null;
    const completeness = sent.completeness ?? data.completeness ?? data.completenessScore ?? null;
    const wrongWords = sent.wrong_words ?? sent.wrongWords ?? data.wrong_words ?? data.wrongWords ?? data.wrong ?? [];
    const sid = sent.sid ?? data.sid ?? null;
    const status = sent.status ?? data.status ?? null;
    const rawXml = sent.raw_xml ?? sent.rawXml ?? data.raw_xml ?? data.rawXml ?? data.rawXML ?? null;
    const words = data.words ?? sent.words ?? [];
    const isRejected = sent.is_rejected ?? data.is_rejected ?? false;
    const exceptInfo = sent.except_info ?? data.except_info ?? null;
    const warning = sent.warning ?? data.warning ?? null;

    return {
        totalScore,
        fluency,
        completeness,
        wrongWords,
        sid,
        status,
        rawXml,
        words,
        isRejected,
        exceptInfo,
        warning,
        // Preserve original + legacy snake_case for backward compatibility
        legacy: {
            total_score: totalScore,
            fluency: fluency,
            completeness: completeness,
            wrong_words: wrongWords,
            raw_xml: rawXml,
            is_rejected: isRejected,
            except_info: exceptInfo,
        },
        original: raw,
    };
}

export default adaptIseScore;