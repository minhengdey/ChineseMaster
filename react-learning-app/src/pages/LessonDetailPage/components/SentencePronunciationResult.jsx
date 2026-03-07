import React from "react";
import { pronunciationAPI } from "../../../services/api";
import StructuredFeedbackView from "../../../components/StructuredFeedbackView";

const SentencePronunciationResult = ({
  result,
  recordedAudio,
  onClose,
  sentenceText = "",
}) => {
  if (!result) return null;

  // If the reference sentence contains no letters (only digits/punctuation/etc.), do not render.
  const refSentence = (sentenceText || "").trim();
  try {
    // Use Unicode letter property; if no letter present, skip rendering.
    if (refSentence && !/\p{L}/u.test(refSentence)) return null;
  } catch (e) {
    // In environments without Unicode property support, fallback to ASCII letter check
    if (refSentence && !/[A-Za-z]/.test(refSentence)) return null;
  }

  const [selectedWord, setSelectedWord] = React.useState(null);
  const [guide, setGuide] = React.useState(null);
  const toPercent = (v) => (v == null ? 0 : Math.round(v));

  // Detect word-mode (single character) so UI can hide fluency/completeness boxes
  const isWordMode = (() => {
    try {
      const st = (sentenceText || "").trim()
      if (st && st.length === 1) return true
    } catch (e) { }
    try {
      const wordsArray = Array.isArray(result?.words) ? result.words : []
      if (wordsArray.length === 1) {
        const w = wordsArray[0]
        const txt = (w?.word || w?.text || "").toString().trim()
        if (txt && txt.length === 1) return true
      }
    } catch (e) { }
    return false
  })()

  const playRecordedAudio = () => {
    if (recordedAudio) {
      const audioUrl = URL.createObjectURL(recordedAudio);
      const audio = new Audio(audioUrl);
      audio.play().catch((error) => {
        // console.error("Error playing audio:", error);
      });
    }
  };

  const getScoreColor = (score) => {
    // Ranges: <=60 red, 61-79 yellow, >=80 green
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (score) => {
    if (score >= 90) return "🎉 Xuất sắc!";
    if (score >= 80) return "👍 Tốt!";
    if (score >= 70) return "👌 Khá!";
    if (score >= 60) return "🤔 Trung bình";
    return "😅 Cần cải thiện";
  };

  // Parse scores from actual ISE sentence API format.
  // The ISE API sometimes nests metrics under `result.sentence`.
  const sent = result?.sentence || result || {};

  console.log("🔥 SentencePronunciationResult received:", {
    result_total_score: result?.total_score,
    result_db_scores: result?.db_scores,
    sent_total_score: sent?.total_score,
    full_result: result
  });

  const totalScore =
    sent?.total_score ??
    sent?.totalScore ??
    sent?.overall ??
    result?.total_score ??
    result?.totalScore ??
    0;
  const fluencyScore = sent?.fluency ?? result?.fluency ?? 0;
  const completenessScore = sent?.completeness ?? result?.completeness ?? 0;

  console.log("📍 Final totalScore calculated:", totalScore);
  const wrongWords =
    sent?.wrong_words ??
    result?.wrong_words ??
    sent?.wrongWords ??
    result?.wrongWords ??
    [];
  const sid = sent?.sid ?? result?.sid ?? null;
  const status = sent?.status ?? result?.status ?? null;

  // Render the sentence as clickable characters, similar to SpeakingPracticePage
  const renderAnnotatedSentence = () => {
    const sentence = sentenceText || "";
    if (!sentence) return null;
    const chars = Array.from(sentence);
    const isPunct = (ch) => /[\s,，。.?!、!！?？;；:：/]/.test(ch);
    const mapping = [];
    let wi = 0;
    for (let ci = 0; ci < chars.length; ci++) {
      const ch = chars[ci];
      if (isPunct(ch)) mapping.push(null);
      else {
        mapping.push(wi);
        wi += 1;
      }
    }

    // Build a set of character indices that belong to words whose per-word score <= 60
    // We use result.words (aligned by mapping) and mark all characters whose mapping points to a low-scoring word.
    const wrongIndices = new Set();
    const wordsArray = Array.isArray(result?.words) ? result.words : [];
    if (wordsArray.length > 0) {
      const lowScoreWordIndexes = new Set();
      for (let wiIndex = 0; wiIndex < wordsArray.length; wiIndex++) {
        const d = wordsArray[wiIndex] || {};
        const score =
          d?.overall ??
          d?.pronunciation ??
          d?.score ??
          d?.pronunciationScore ??
          null;
        if (score != null && Number(score) <= 60) {
          lowScoreWordIndexes.add(wiIndex);
        }
      }
      for (let ci = 0; ci < mapping.length; ci++) {
        const mi = mapping[ci];
        if (typeof mi === "number" && lowScoreWordIndexes.has(mi))
          wrongIndices.add(ci);
      }
    }

    return (
      <div className="mb-2 whitespace-nowrap overflow-x-auto">
        {chars.map((ch, i) => {
          const wordIndex = mapping[i];
          const details =
            typeof wordIndex === "number" && Array.isArray(result?.words)
              ? result.words[wordIndex]
              : null;
          const normalized = {
            word: ch,
            index: wordIndex,
            duration: details?.duration ?? details?.time_len ?? null,
            overall: details?.overall ?? details?.pronunciation ?? null,
            fluency: details?.fluency ?? null,
            phonemes:
              details?.phonemes ??
              details?.phones ??
              details?.phoneme_list ??
              null,
            details: details || null,
          };
          const isWrong = wrongIndices.has(i);
          const scoreValue = (details && (details?.overall ?? details?.pronunciation ?? details?.score ?? details?.pronunciationScore)) != null
            ? Number(details?.overall ?? details?.pronunciation ?? details?.score ?? details?.pronunciationScore)
            : null;
          const scoreColorClass = scoreValue != null ? getScoreColor(scoreValue) : "";
          const charClasses = `inline-block mx-0.5 px-1 rounded ${details ? "hover:bg-base-200 cursor-pointer" : "opacity-60"} ${scoreColorClass} ${isWrong ? "font-bold" : ""}`;

          return (
            <span key={`${ch}-${i}`} className="tooltip inline-block" data-tip={details ? `Chi tiết từ: ${ch}` : ch}>
              <button onClick={() => setSelectedWord(normalized)} className={charClasses} title={details ? `Chi tiết từ: ${ch}` : ch}>
                {ch}
              </button>
            </span>
          );
        })}
      </div>
    );
  };

  // Stars visualization (same style as SpeakingPracticePage)
  const Stars = ({ percent = 0, size = 16 }) => {
    const pct = Math.max(0, Math.min(100, percent));
    // size is pixel size for each star svg
    const svgStyle = { width: size, height: size, display: 'inline-block' };
    return (
      <div className="relative inline-block align-middle">
        <div style={{ color: "#e5e7eb" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              style={svgStyle}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            overflow: "hidden",
            width: `${pct}%`,
            whiteSpace: "nowrap",
            color: "#f6c700",
          }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              style={svgStyle}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.965a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.966c.3.92-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.063 9.392c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.965z" />
            </svg>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-primary">
          📊 Kết quả đánh giá câu
        </h4>
        {onClose && (
          <button
            className="btn btn-xs btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        )}
      </div>

      {/* Overall Score */}
      {/* Overall Score - hide when in word-mode (single char) */}
      {(isWordMode ? (
        (() => {
          const first = (Array.isArray(result?.words) && result.words.length > 0) ? result.words[0] : null
          const label = first ? (first.word || first.text || String(sentenceText || "").trim().slice(0, 1)) : (String(sentenceText || "").trim().slice(0, 1) || "Từ")
          const wScore = first ? Math.max(0, Math.min(100, Math.round(first?.overall ?? first?.pronunciation ?? first?.score ?? first?.pronunciationScore ?? 0))) : 0
          console.log("🔴 WORD MODE - Displaying wScore from result.words[0]:", {
            wScore,
            first_overall: first?.overall,
            first_pronunciation: first?.pronunciation,
            first_score: first?.score,
            totalScore_should_be: totalScore
          });
          return (
            <div className="card bg-gray-50 shadow-sm border border-gray-200">
              <div className="card-body p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold">Điểm tổng</h5>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <div className={`font-bold ${getScoreColor(wScore)}`}>
                        <Stars percent={toPercent(wScore)} size={20} />
                        <div className={`text-sm mt-1 ${getScoreColor(wScore)}`}>{toPercent(wScore)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })()
      ) : (
        <div className="card bg-gray-50 shadow-sm border border-gray-200">
          <div className="card-body p-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-semibold">Điểm tổng</h5>
                <p className="text-xs text-base-content/60">Phát âm câu</p>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end">
                  <div className={`font-bold ${getScoreColor(totalScore)}`}>
                    <Stars percent={totalScore} size={20} />
                    <div className={`text-sm mt-1 ${getScoreColor(totalScore)}`}>
                      {console.log("🎯 RENDERING Điểm tổng:", toPercent(totalScore), "from totalScore:", totalScore)}
                      {toPercent(totalScore)}%
                    </div>
                  </div>
                  <div className={`text-xs ${getScoreColor(totalScore)}`}>
                    {getScoreMessage(totalScore)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Detailed scores grid */}
      {!isWordMode && (
        <div className="grid grid-cols-2 gap-2">
          <div className="card bg-gray-50 border border-gray-200">
            <div className="card-body p-2 text-center">
              <h6 className="font-medium text-xs mb-1">Trôi chảy</h6>
              <div className={`text-lg font-bold ${getScoreColor(fluencyScore)}`}>
                <Stars percent={fluencyScore} size={16} />
                <div className={`text-sm mt-1 ${getScoreColor(fluencyScore)}`}>{toPercent(fluencyScore)}%</div>
              </div>
            </div>
          </div>

          <div className="card bg-gray-50 border border-gray-200">
            <div className="card-body p-2 text-center">
              <h6 className="font-medium text-xs mb-1">Hoàn thiện</h6>
              <div className={`text-lg font-bold ${getScoreColor(completenessScore)}`}>
                <Stars percent={completenessScore} size={16} />
                <div className={`text-sm mt-1 ${getScoreColor(completenessScore)}`}>{toPercent(completenessScore)}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Structured AI feedback (Điểm tổng, Nhận xét, Lỗi, Gợi ý) when available */}
      {(result.overallFeedback || result.improvementTip || result.feedback) && (
        <StructuredFeedbackView
          score={result.total_score ?? result.totalScore ?? result.score}
          overallFeedback={result.overallFeedback ?? result.feedback}
          pronunciationIssue={result.pronunciationIssue}
          toneIssue={result.toneIssue}
          fluencyIssue={result.fluencyIssue}
          improvementTip={result.improvementTip}
        />
      )}

      {/* Annotated sentence: show whole sentence; click a character to view word details */}
      <div className="card bg-gray-50 border border-gray-200">
        <div className="card-body p-3">{renderAnnotatedSentence()}</div>
      </div>

      {/* Status indicator */}
      {/* Selected word details (rendered when user clicks a character) */}
      {selectedWord && (
        <div className="card mt-4 p-4 bg-base-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-lg font-semibold">
                Chi tiết: {selectedWord.word}
              </div>
            </div>
            <div>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => setSelectedWord(null)}
              >
                Đóng
              </button>
            </div>
          </div>

          {!isWordMode && (selectedWord.overall != null ||
            (selectedWord.details &&
              (selectedWord.details.overall != null ||
                selectedWord.details.pronunciation != null))) ? (
            <div className="mb-2">
              <div className="text-sm text-gray-600 mb-1">Điểm từ</div>
              <div className="flex items-center gap-2">
                {(() => {
                  const selectedScore = Number(
                    selectedWord.overall ??
                    selectedWord.details?.overall ??
                    selectedWord.details?.pronunciation ?? 0
                  );
                  return (
                    <div className={`text-sm font-medium ${getScoreColor(selectedScore)}`}>
                      {toPercent(selectedScore)}%
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : null}

          {/* Initial / Final / Tone breakdown if available */}
          {(selectedWord.details && (selectedWord.details.initial_score != null || selectedWord.details.final_score != null || selectedWord.details.tone_score != null)) || (selectedWord.initial_score != null || selectedWord.final_score != null || selectedWord.tone_score != null) ? (
            <div className="mb-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="card bg-gray-50 border border-gray-200 p-2 text-center">
                  <div className="text-xs">Thanh mẫu</div>
                  <div className={`text-lg font-bold ${getScoreColor(selectedWord.details?.initial_score ?? selectedWord.initial_score ?? 0)}`}>
                    {Math.round(selectedWord.details?.initial_score ?? selectedWord.initial_score ?? 0)}
                  </div>
                </div>
                <div className="card bg-gray-50 border border-gray-200 p-2 text-center">
                  <div className="text-xs">Vận mẫu</div>
                  <div className={`text-lg font-bold ${getScoreColor(selectedWord.details?.final_score ?? selectedWord.final_score ?? 0)}`}>
                    {Math.round(selectedWord.details?.final_score ?? selectedWord.final_score ?? 0)}
                  </div>
                </div>
                <div className="card bg-gray-50 border border-gray-200 p-2 text-center">
                  <div className="text-xs">Thanh điệu</div>
                  <div className={`text-lg font-bold ${getScoreColor(selectedWord.details?.tone_score ?? selectedWord.tone_score ?? 0)}`}>
                    {Math.round(selectedWord.details?.tone_score ?? selectedWord.tone_score ?? 0)}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {(selectedWord.phonemes && selectedWord.phonemes.length > 0) ||
            (selectedWord.details &&
              (selectedWord.details.phonemes ||
                selectedWord.details.phones)) ? (
            <div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Âm</th>
                      <th>Điểm</th>
                      <th>Thanh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      selectedWord.phonemes ||
                      selectedWord.details?.phonemes ||
                      selectedWord.details?.phones ||
                      []
                    ).map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {(typeof p?.phoneme_display ===
                                "string" &&
                                p.phoneme_display) ||
                                (Array.isArray(
                                  p?.phoneme_display
                                )
                                  ? p.phoneme_display.join(" ")
                                  : p?.phoneme ||
                                  p?.phone ||
                                  "-")}
                            </span>
                            <button
                              className="btn btn-ghost btn-xs btn-square"
                              title={`Xem hướng dẫn phát âm: ${(typeof p?.phoneme_display ===
                                "string" &&
                                p.phoneme_display) ||
                                p?.phoneme ||
                                p?.phone ||
                                ""
                                }`}
                              onClick={async () => {
                                setGuide(null);
                                try {
                                  let query = null;
                                  if (p?.phoneme) query = p.phoneme;
                                  if (!query && p?.phoneme_display) {
                                    query =
                                      typeof p.phoneme_display ===
                                        "string"
                                        ? p.phoneme_display
                                        : Array.isArray(
                                          p.phoneme_display
                                        )
                                          ? p.phoneme_display.join(
                                            " "
                                          )
                                          : String(
                                            p.phoneme_display
                                          );
                                  }
                                  if (p?.mono_tone && !query) {
                                    const toneMark = String(
                                      p.mono_tone
                                    ).match(/\d+/)?.[0];
                                    if (toneMark) query = toneMark;
                                  }

                                  let res = null;
                                  if (query) res = await pronunciationAPI.lookup(query);
                                  setGuide(res || null);
                                } catch (err) {
                                  // console.error(
                                  //   "Pronunciation guide lookup failed",
                                  //   err
                                  // );
                                  setGuide(null);
                                }
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td>
                          {p?.score != null
                            ? Math.round(p.score)
                            : p?.pronunciation != null
                              ? Math.round(p.pronunciation)
                              : "-"}
                        </td>
                        <td>
                          {p?.mono_tone &&
                            typeof p.mono_tone === "string"
                            ? (p.mono_tone.match(/\d+/) ||
                              [])[0] || p.mono_tone
                            : p?.mono_tone || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {/* Pronunciation guide card (shows when user clicks a phoneme) */}
          {guide && (
            <div className="mt-3 card bg-base-100 shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h6 className="font-semibold text-sm">
                    Hướng dẫn phát âm
                  </h6>
                  <div className="text-xs text-base-content/60">
                    {guide.type} — {guide.key}
                  </div>
                </div>
                <div>
                  <button
                    className="btn btn-xs btn-ghost"
                    onClick={() => setGuide(null)}
                  >
                    Đóng
                  </button>
                </div>
              </div>
              {guide.ipa && (
                <div className="mb-2">
                  <strong>IPA:</strong>{" "}
                  <span className="text-sm">{guide.ipa}</span>
                </div>
              )}
              {guide.pronunciation && (
                <div className="text-sm text-base-content/70">
                  {guide.pronunciation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Playback Controls */}
      {recordedAudio && (
        <div className="card bg-gray-50 border border-gray-200">
          <div className="card-body p-3">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-sm">
                🎵 Nghe lại bản ghi
              </h5>
              <button
                className="btn btn-xs btn-primary"
                onClick={playRecordedAudio}
              >
                🔊 Nghe lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SentencePronunciationResult;
