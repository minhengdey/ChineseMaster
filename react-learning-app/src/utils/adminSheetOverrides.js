const EXPERIMENTAL_SHEET = [
  [null, "Bài 1", null, "Bài 2", null, "Bài 3", null, "Bài 4", null, "Bài 5", null, "Bài 6", null, "Bài 7", null, "Bài 8", null, "Bài 9", null, "Bài 10", null, "Bài 11", null, "Bài 12", null, "TEST 1"],
  [null, "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện", "Điểm", "Lượt luyện"],
  ["TEST", 0.8552, 79, 0.7892, 69, 0.8305, 78, 0.8073, 41, null, null, null, null, null, null, 0.5676, 39, null, null, null, null, null, null, 0.3448, 43, "/"],
  ["minhanh", 0.3517, 37, null, null, null, null, null, null, null, null, null, null, null, null, 0.6933, 4, null, null, null, null, null, null, null, null, 53.41],
  ["Ngovuducloc@gmail.com", 0.6014, 29, 0.596, 26, 0.594, 61, 0.6005, 32, 0.609, 74, 0.612, 31, 0.6014, 29, 0.6085, 28, 0.617, 33, 0.631, 36, 0.624, 34, 0.643, 41, 78.13],
  ["Xuân", 0.6101, 58, 0.5232, 94, 0.557, 49, 0.646, 45, 0.5426, 65, 0.5521, 67, 0.6419, 67, 0.6912, 77, 0.5817, 58, 0.6827, 73, 0.7261, 42, 0.6812, 52, 85.01],
  ["TruongNgocTam", 0.7055, 51, 0.6176, 53, 0.542, 78, 0.5246, 72, 0.5116, 81, 0.6368, 71, 0.6274, 155, 0.5908, 102, 0.6132, 97, 0.6921, 64, 0.5596, 118, 0.5524, 106, 86.16],
  ["Trần Khánh Ly", 0.757, 98, 0.6888, 91, 0.7088, 51, 0.5641, 58, 0.7328, 62, 0.66, 75, 0.7627, 54, 0.6297, 78, 0.7634, 53, 0.7966, 39, 0.6998, 57, 0.6536, 69, 89.98],
  ["阮宏日", 0.7753, 49, 0.7674, 51, 0.7283, 46, 0.7224, 54, 0.7659, 69, 0.7709, 55, 0.6563, 84, 0.5622, 57, 0.7889, 43, 0.769, 64, 0.608, 24, 0.7358, 54, 90.89],
  ["Huyendinh", 0.6224, 39, 0.611, 35, 0.604, 31, 0.608, 33, 0.599, 29, 0.603, 27, 0.6247, 10, 0.599, 18, null, null, null, null, null, null, null, null, "76.35"],
  ["Chi Quỳnh", 0.4555, 15, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "/"],
  ["tranthuha25042003@gmail.com", 0.6431, 58, 0.5637, 78, 0.6357, 45, 0.3997, 82, 0.5128, 191, 0.4725, 150, 0.6168, 78, 0.5343, 97, 0.4518, 79, 0.7042, 63, 0.5255, 113, 0.6626, 60, 84.24],
  ["lethom", 0.6451, 64, 0.6067, 79, 0.5334, 65, 0.5199, 85, 0.4433, 91, null, null, null, null, null, null, null, null, null, null, 0.6084, 58, 0.517, 82, "72.72"],
  ["lehaian", 0.9003, 34, 0.6502, 75, 0.646, 54, 0.6198, 52, 0.6169, 63, 0.7167, 52, 0.6334, 145, 0.6073, 91, 0.4555, 88, 0.7658, 54, 0.6522, 104, 0.7893, 44, 72.75],
  ["Trần Như Nguyệt", 0.642, 152, 0.6742, 88, 0.5982, 67, 0.6539, 55, 0.5815, 51, 0.5963, 61, 0.7335, 51, 0.5816, 55, 0.6349, 49, null, null, null, null, null, null, "81.20"],
  [" Trang", 0.5576, 60, 0.635, 61, 0.6497, 76, 0.556, 39, 0.5948, 40, 0.5244, 59, 0.6112, 51, 0.5657, 75, 0.5598, 58, 0.7218, 33, 0.6429, 53, 0.6625, 45, 74.11],
  ["Nguyễn Quỳnh Phương", 0.4742, 49, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "66.53"],
  ["Casaulenba@gmail.com", 0.5199, 33, 0.5563, 30, null, null, null, null, null, null, 0.4735, 54, null, null, null, null, null, null, null, null, null, null, null, null, "62.08"],
  ["Ngọc Ánh", 0.499, 5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.1, 3, "/"],
  ["Nguyễn Quang Huy", 0.7134, 43, 0.7996, 44, 0.6607, 52, 0.6878, 29, 0.6159, 37, 0.7139, 55, 0.7387, 48, 0.7387, 57, 0.5138, 195, 0.7047, 52, 0.6821, 89, 0.6448, 47, 84.49],
  ["Huyền Trang", 0.6755, 34, 0.6884, 37, 0.7596, 96, 0.7522, 27, 0.6642, 35, 0.6397, 48, 0.7582, 74, 0.8199, 34, 0.606, 34, 0.631, 34, 0.6625, 45, 0.6073, 51, 83.65],
  ["Phạm Hằng Anh", 0.5982, 10, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, "/"],
];

const CONTROL_SHEET = [
  ["Lớp đối chứng", "Bài 1", null, "Bài 2", null, "Bài 3", null, "Bài 4", null, "Bài 5", null, "Bài 6", null, "Bài 7", null, "Bài 8", null, "Bài 9", null, "Bài 10", null, "Bài 11", null, "Bài 12", null, "TEST 1"],
  ["Nguyễn Thị Ánh Minh", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 85.98],
  ["HOÀNG LƯU HẢI YẾN", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 84.68],
  ["Nguyễn Thị Quỳnh Anh", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 83.07],
  ["Nguyễn Yến Nhi", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 78.77],
  ["Nguyễn Phương Ly", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 74.6],
  ["Nguyễn Thị Hải Xuân", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 76.18],
  ["Nguyễn Khánh Linh", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 74],
  ["Nguyễn Thị Diệu Linh", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 72.63],
  ["Nhi-HSK3.25031", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 70.94],
  ["Trần Bá Quý", null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 64.05],
];

const EXAM_SHEET = [
  [null, "Thanh mẫu", "Vận mẫu", "Thanh điệu", "Câu", "Điểm trung bình"],
  ["阮宏日", 90.4, 94.35, 95.74, 83.07, 90.89],
  ["Trần Khánh Ly", 95.07, 92.44, 89.44, 82.99, 89.98],
  ["TruongNgocTam", 87.02, 80.75, 90.84, 86.02, 86.16],
  ["Nguyễn Thị Ánh Minh", 84.25, 90.54, 90.71, 78.42, 85.98],
  ["Xuân", 81.81, 88.57, 89.05, 80.59, 85.01],
  ["HOÀNG LƯU HẢI YẾN", 85.1, 88.53, 87.93, 77.16, 84.68],
  ["Nguyễn Quang Huy", 87.03, 89.67, 82.5, 78.77, 84.49],
  ["tranthuha25042003@gmail.com", 85.1, 83.6, 82.8, 85.46, 84.24],
  ["Huyền Trang", 82.96, 84.87, 84.33, 82.43, 83.65],
  ["Nguyễn Thị Quỳnh Anh", 89.35, 88.84, 79.25, 74.86, 83.07],
  ["Trần Như Nguyệt", "81.10", "83.40", "82.70", "77.60", "81.20"],
  ["Nguyễn Yến Nhi", 71.13, 84.61, 94.97, 64.37, 78.77],
  ["Ngovuducloc@gmail.com", 83.54, 70.27, 84.58, 74.11, 78.13],
  ["Huyendinh", "76.30", "78.60", "77.40", "73.10", "76.35"],
  ["Nguyễn Thị Hải Xuân", 78.2, 76.8, 75.4, 74.3, 76.18],
  ["Nguyễn Phương Ly", 84.97, 74.01, 78.89, 60.53, 74.6],
  [" Trang", 71.58, 81.11, 69.56, 74.18, 74.11],
  ["Nguyễn Khánh Linh", 75.6, 73.4, 74.2, 72.8, 74],
  ["lethom", "72.80", "75.20", "73.50", "69.40", "72.72"],
  ["lehaian", 66.2, 75.44, 78.8, 70.58, 72.75],
  ["Nguyễn Thị Diệu Linh", 72.1, 73.8, 71.9, 72.72, 72.63],
  ["Nhi-HSK3.25031", 69.8, 71.6, 70.5, 71.86, 70.94],
  ["Nguyễn Quỳnh Phương", "66.20", "68.70", "67.40", "63.80", "66.53"],
  ["Trần Bá Quý", 68.4, 66.8, 61.9, 59.1, 64.05],
  ["Casaulenba@gmail.com", "61.50", "64.20", "62.70", "59.90", "62.08"],
  ["minhanh", 57.66, 50.83, 55.41, 49.72, 53.41],
];

const toAscii = (s = "") =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

const isBlank = (v) => v == null || String(v).trim() === "";

const parseNumber = (v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const formatPercent = (value) => {
  if (isBlank(value)) return null;
  if (String(value).trim() === "/") return "/";
  const n = parseNumber(value);
  if (n == null) return String(value);
  const percent = n <= 1 ? n * 100 : n;
  const rounded = Math.round(percent * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toString();
  return `${text}%`;
};

const buildColumnsFromHeader = (headerRow) => {
  const columns = [];
  for (let i = 1; i < headerRow.length; i += 2) {
    const label = headerRow[i];
    if (isBlank(label)) continue;
    const labelText = String(label).trim();
    const isTest = toAscii(labelText).includes("test");
    columns.push({
      id: `${isTest ? "test" : "lesson"}-${columns.length + 1}`,
      label: labelText,
      source: isTest ? "test" : "lesson",
      scoreIndex: i,
      attemptsIndex: isTest ? null : i + 1,
    });
  }
  return columns;
};

const buildScoreRows = (rows, columns, dataStartRow) =>
  rows.slice(dataStartRow).reduce((acc, row, rowIdx) => {
    const name = row?.[0];
    if (isBlank(name)) return acc;
    const scores = columns.map((col) => {
      const score = row[col.scoreIndex];
      if (isBlank(score)) return null;
      const attempts = col.attemptsIndex == null ? null : row[col.attemptsIndex];
      return {
        display: formatPercent(score),
        meta: isBlank(attempts) ? null : attempts,
      };
    });
    acc.push({
      userId: `sheet-${dataStartRow}-${rowIdx + 1}`,
      name: String(name),
      scores,
    });
    return acc;
  }, []);

const EXPERIMENTAL_OVERRIDE = (() => {
  const columns = buildColumnsFromHeader(EXPERIMENTAL_SHEET[0]);
  const data = buildScoreRows(EXPERIMENTAL_SHEET, columns, 2);
  return { columns, data };
})();

const CONTROL_OVERRIDE = (() => {
  const columns = buildColumnsFromHeader(CONTROL_SHEET[0]);
  const data = buildScoreRows(CONTROL_SHEET, columns, 1);
  return { columns, data };
})();

const EXAM_OVERRIDE = (() => {
  const rows = EXAM_SHEET.slice(1)
    .filter((row) => !isBlank(row?.[0]))
    .map((row, idx) => ({
      rank: idx + 1,
      userId: `sheet-exam-${idx + 1}`,
      name: String(row[0]),
      initialScore: parseNumber(row[1]),
      finalScore: parseNumber(row[2]),
      toneScore: parseNumber(row[3]),
      sentenceScore: parseNumber(row[4]),
      totalScore: parseNumber(row[5]),
    }));

  return [
    {
      testId: "sheet-test-1",
      title: "BXH bài kiểm tra",
      rows,
    },
  ];
})();

export const getClassScoreSheetOverride = (className) => {
  const normalized = toAscii(className);
  if (!normalized) return null;
  if (normalized.includes("thuc nghiem")) return EXPERIMENTAL_OVERRIDE;
  if (normalized.includes("doi chung")) return CONTROL_OVERRIDE;
  return null;
};

export const getExamLeaderboardSheetOverride = () => EXAM_OVERRIDE;
