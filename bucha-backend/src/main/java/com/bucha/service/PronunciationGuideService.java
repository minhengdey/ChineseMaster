package com.bucha.service;

import com.bucha.dto.pronunciation.PronunciationGuideDto;
import com.bucha.entity.FinalSound;
import com.bucha.entity.InitialSound;
import com.bucha.entity.Tone;
import com.bucha.repository.FinalSoundRepository;
import com.bucha.repository.InitialSoundRepository;
import com.bucha.repository.ToneRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Resolves pronunciation guide content for {@code GET /api/pronunciation?q=...}
 * from {@code initial_sounds}, {@code final_sounds}, and {@code tones}.
 */
@Service
public class PronunciationGuideService {

    private final InitialSoundRepository initialSoundRepository;
    private final FinalSoundRepository   finalSoundRepository;
    private final ToneRepository         toneRepository;

    public PronunciationGuideService(InitialSoundRepository initialSoundRepository,
                                     FinalSoundRepository finalSoundRepository,
                                     ToneRepository toneRepository) {
        this.initialSoundRepository = initialSoundRepository;
        this.finalSoundRepository   = finalSoundRepository;
        this.toneRepository         = toneRepository;
    }

    public Optional<PronunciationGuideDto> lookup(String rawQuery, String initialHint) {
        if (rawQuery == null) {
            return Optional.empty();
        }
        // NBSP / odd spaces from ISE or copy-paste
        String trimmed = rawQuery.trim().replace('\u00A0', ' ').trim();
        String q = normalizeGuideQueryKey(trimmed);
        if (q.isEmpty()) {
            return Optional.empty();
        }

        // Keys like "-i" are finals (Pinyin suffix notation), not initials — try finals first.
        if (q.startsWith("-")) {
            return findFinal(q, initialHint)
                    .or(() -> findInitial(q))
                    .or(() -> findTone(q));
        }
        return findInitial(q)
                .or(() -> findFinal(q, initialHint))
                .or(() -> findTone(q));
    }

    private Optional<PronunciationGuideDto> findInitial(String q) {
        return initialSoundRepository.findFirstByTextOrderByIdAsc(q)
                .or(() -> initialSoundRepository.findFirstByTextIgnoreCaseOrderByIdAsc(q))
                .map(PronunciationGuideService::fromInitial);
    }

    private Optional<PronunciationGuideDto> findFinal(String q, String initialHint) {
        List<FinalSound> list = loadFinalsByTextKey(q);
        if (list.isEmpty()) {
            return Optional.empty();
        }
        FinalSound chosen = disambiguateFinals(list, q, initialHint).orElse(list.get(0));
        return Optional.of(fromFinal(chosen));
    }

    private Optional<PronunciationGuideDto> findTone(String q) {
        Optional<Tone> byMark = toneRepository.findFirstByToneMarkOrderByIdAsc(q);
        if (byMark.isEmpty() && q.length() == 1 && Character.isDigit(q.charAt(0))) {
            int d = q.charAt(0) - '0';
            if (d >= 1 && d <= 9) {
                byMark = toneRepository.findFirstByOrderOrderByIdAsc(d);
            }
        }
        if (byMark.isEmpty()) {
            byMark = toneRepository.findFirstByNameOrderByIdAsc(q)
                    .or(() -> toneRepository.findFirstByNameIgnoreCaseOrderByIdAsc(q));
        }
        if (byMark.isEmpty()) {
            byMark = toneRepository.findFirstByPitchValueOrderByIdAsc(q)
                    .or(() -> toneRepository.findFirstByPitchValueIgnoreCaseOrderByIdAsc(q));
        }
        return byMark.map(PronunciationGuideService::fromTone);
    }

    /**
     * When several {@link FinalSound} rows share the same {@code text} (e.g. two "-i", two "u"),
     * pick using optional Pinyin initial from the syllable (z/c/s vs zh/ch/sh/r; j/q/x vs plain u).
     */
    private Optional<FinalSound> disambiguateFinals(List<FinalSound> list, String q, String initialHint) {
        if (list.size() <= 1) {
            return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
        }
        String qt = q.trim();
        String ini = initialHint == null ? "" : initialHint.trim().toLowerCase(Locale.ROOT);

        if ("-i".equalsIgnoreCase(qt)) {
            boolean retroflex = ini.startsWith("zh") || ini.startsWith("ch") || ini.startsWith("sh")
                    || "r".equals(ini);
            boolean dental = "z".equals(ini) || "c".equals(ini) || "s".equals(ini);
            if (retroflex) {
                Optional<FinalSound> byIpa = list.stream().filter(PronunciationGuideService::ipaHasRetroflexI)
                        .findFirst();
                if (byIpa.isPresent()) {
                    return byIpa;
                }
                Optional<FinalSound> byPr = list.stream().filter(PronunciationGuideService::pronunciationImpliesRetroflexI)
                        .findFirst();
                if (byPr.isPresent()) {
                    return byPr;
                }
                // Seed data: two "-i" rows — lower id = dental (ɿ), higher = retroflex (ʅ)
                if (list.size() == 2) {
                    return Optional.of(list.get(1));
                }
            }
            if (dental) {
                Optional<FinalSound> byIpa = list.stream().filter(PronunciationGuideService::ipaHasDentalI)
                        .findFirst();
                if (byIpa.isPresent()) {
                    return byIpa;
                }
                Optional<FinalSound> byPr = list.stream().filter(PronunciationGuideService::pronunciationImpliesDentalI)
                        .findFirst();
                if (byPr.isPresent()) {
                    return byPr;
                }
                if (list.size() == 2) {
                    return Optional.of(list.get(0));
                }
            }
        }

        if ("u".equalsIgnoreCase(qt)) {
            boolean afterJqx = "j".equals(ini) || "q".equals(ini) || "x".equals(ini);
            if (afterJqx) {
                Optional<FinalSound> umlaut = list.stream().filter(PronunciationGuideService::isUAfterJqxRow)
                        .findFirst();
                if (umlaut.isPresent()) {
                    return umlaut;
                }
            }
            Optional<FinalSound> plain = list.stream().filter(f -> !isUAfterJqxRow(f)).findFirst();
            if (plain.isPresent()) {
                return plain;
            }
        }

        return Optional.of(list.get(0));
    }

    /**
     * ISE/phoneme payloads sometimes use {@code _i} or {@code iii} instead of DB key {@code -i}.
     * Normalizes Unicode minus/hyphen to ASCII {@code '-'} so DB text {@code -i} matches.
     */
    private static String normalizeGuideQueryKey(String q) {
        if (q.isEmpty()) {
            return q;
        }
        String s = q;
        s = s.replace('\u2010', '-')
                .replace('\u2011', '-')
                .replace('\u2212', '-')
                .replace('\uFE63', '-')
                .replace('\uFF0D', '-');
        if ("_i".equalsIgnoreCase(s) || "iii".equalsIgnoreCase(s)) {
            return "-i";
        }
        return s;
    }

    /** Load finals; retries alternate hyphen if DB used a different Unicode dash. */
    private List<FinalSound> loadFinalsByTextKey(String q) {
        List<FinalSound> list = finalSoundRepository.findAllByTextOrderByIdAsc(q);
        if (!list.isEmpty()) {
            return list;
        }
        list = finalSoundRepository.findAllByTextIgnoreCaseOrderByIdAsc(q);
        if (!list.isEmpty()) {
            return list;
        }
        if (q.startsWith("-") && q.length() > 1) {
            String suffix = q.substring(1);
            String[] prefixes = {"\u2212", "\u2010", "\uFF0D"};
            for (String p : prefixes) {
                String alt = p + suffix;
                list = finalSoundRepository.findAllByTextOrderByIdAsc(alt);
                if (!list.isEmpty()) {
                    return list;
                }
            }
        }
        return list;
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

    private static boolean ipaHasDentalI(FinalSound f) {
        return nz(f.getIpa()).contains("ɿ");
    }

    private static boolean ipaHasRetroflexI(FinalSound f) {
        return nz(f.getIpa()).contains("ʅ");
    }

    private static boolean pronunciationImpliesDentalI(FinalSound f) {
        String pr = nz(f.getPronunciation()).toLowerCase(Locale.ROOT);
        return pr.contains("z, c, s") || (pr.contains("sau z") && !pr.contains("zh"));
    }

    private static boolean pronunciationImpliesRetroflexI(FinalSound f) {
        String pr = nz(f.getPronunciation()).toLowerCase(Locale.ROOT);
        return pr.contains("zh")
                || pr.contains("sau zh")
                || pr.contains("ch, sh")
                || pr.contains("ch,sh")
                || pr.contains("sh, r")
                || pr.contains("sh, r)")
                || (pr.contains("sh") && pr.contains("r"))
                || pr.contains("phụ âm sh")
                || pr.contains("sh (sau")
                || pr.contains("ʅ");
    }

    /** Row describing /y/ (ü) after j, q, x — often still stored as final text "u". */
    private static boolean isUAfterJqxRow(FinalSound f) {
        String ipa = nz(f.getIpa()).toLowerCase(Locale.ROOT);
        String pr = nz(f.getPronunciation()).toLowerCase(Locale.ROOT);
        if (ipa.contains("[y]") || ipa.contains("ʏ")) {
            return true;
        }
        return pr.contains("ü") || pr.contains("ư") || pr.contains("j, q, x") || pr.contains("j/q/x")
                || pr.contains("sau j") || pr.contains("phiên âm y");
    }

    private static PronunciationGuideDto fromInitial(InitialSound i) {
        PronunciationGuideDto dto = new PronunciationGuideDto();
        dto.setType("initial");
        dto.setKey(i.getText());
        dto.setIpa(i.getIpa());
        dto.setPronunciation(i.getPronunciation());
        return dto;
    }

    private static PronunciationGuideDto fromFinal(FinalSound f) {
        PronunciationGuideDto dto = new PronunciationGuideDto();
        dto.setType("final");
        dto.setKey(f.getText());
        dto.setIpa(f.getIpa());
        dto.setPronunciation(f.getPronunciation());
        return dto;
    }

    private static PronunciationGuideDto fromTone(Tone t) {
        PronunciationGuideDto dto = new PronunciationGuideDto();
        dto.setType("tone");
        String key = t.getToneMark() != null && !t.getToneMark().isBlank()
                ? t.getToneMark()
                : (t.getName() != null ? t.getName() : String.valueOf(t.getOrder()));
        dto.setKey(key);
        dto.setIpa(t.getPitchValue());
        dto.setPronunciation(t.getPronunciation());
        return dto;
    }
}
