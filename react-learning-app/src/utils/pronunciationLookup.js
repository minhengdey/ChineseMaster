/**
 * Chuẩn hóa khóa tra cứu trước khi gọi GET /api/pronunciation?q=
 * (ISE hay trả _i, iii, ii… thay cho vận "-i" trong final_sounds).
 */
export function normalizePronunciationQuery(q) {
   let s = String(q ?? "")
      .trim()
      .replace(/\u00a0/g, " ")
      .replace(/\uFF3F/g, "_")
      .replace(/\s+/g, " ");
   if (!s) return s;

   // Bỏ dấu câu dính cuối (hiếm khi ISE gửi kèm)
   const noTrail = s.replace(/[.,;:!?，。、]+$/g, "").trim();
   const candidate = noTrail || s;

   const isMinusI = (t) =>
      /^_+i$/i.test(t) ||
      /^iii+$/i.test(t) ||
      /^ii$/i.test(t) ||
      /^i{4,}$/i.test(t);

   if (isMinusI(candidate)) return "-i";

   const parts = candidate.split(" ");
   if (parts.length > 1) {
      const last = parts[parts.length - 1];
      if (isMinusI(last)) return "-i";
   }

   return s;
}

/**
 * Lấy âm đệm (hoặc cụm như "zh") từ phoneme ngay trước dòng đang xem — dùng phân biệt vận trùng text (-i, u, …).
 */
export function inferInitialHintFromPhonemes(phonemes, currentIndex) {
   if (!Array.isArray(phonemes) || currentIndex <= 0) return undefined;
   for (let i = currentIndex - 1; i >= 0; i--) {
      const p = phonemes[i];
      const raw = (p?.phoneme ?? p?.phone ?? "").toString().trim().toLowerCase();
      if (!raw) continue;
      if (/^\d+$/.test(raw)) continue;
      return raw;
   }
   return undefined;
}
