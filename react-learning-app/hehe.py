import json


def convert_pinyin_tone(syllable, tone):
    vowels = "aeiouü"
    tone_marks = {
        "a": ["ā", "á", "ǎ", "à"],
        "e": ["ē", "é", "ě", "è"],
        "i": ["ī", "í", "ǐ", "ì"],
        "o": ["ō", "ó", "ǒ", "ò"],
        "u": ["ū", "ú", "ǔ", "ù"],
        "ü": ["ǖ", "ǘ", "ǚ", "ǜ"],
    }

    if tone == 0:
        return syllable

    for vowel_priority in ["a", "e", "o"]:
        if vowel_priority in syllable:
            vowel = vowel_priority
            break
    else:
        if "iu" in syllable:
            vowel = "u"
        elif "ui" in syllable:
            vowel = "i"
        else:
            vowel = None
            for ch in reversed(syllable):
                if ch in vowels:
                    vowel = ch
                    break
            if vowel is None:
                return syllable

    tone_idx = tone - 1
    new_syllable = syllable.replace(vowel, tone_marks[vowel][tone_idx])
    return new_syllable


pinyin_list = [
    "b",
    "p",
    "m",
    "f",
    "d",
    "t",
    "n",
    "l",
    "g",
    "k",
    "h",
    "j",
    "q",
    "x",
    "z",
    "c",
    "s",
    "zh",
    "ch",
    "sh",
    "r",
    "i",
    "zi",
    "ci",
    "si",
    "zhi",
    "chi",
    "shi",
    "ri",
    "a",
    "ba",
    "pa",
    "ma",
    "fa",
    "da",
    "ta",
    "na",
    "la",
    "ga",
    "ka",
    "ha",
    "za",
    "ca",
    "sa",
    "zha",
    "cha",
    "sha",
    "ai",
    "bai",
    "pai",
    "mai",
    "dai",
    "tai",
    "nai",
    "lai",
    "gai",
    "kai",
    "hai",
    "zai",
    "cai",
    "sai",
    "zhai",
    "chai",
    "shai",
    "an",
    "ban",
    "pan",
    "man",
    "fan",
    "dan",
    "tan",
    "nan",
    "lan",
    "gan",
    "kan",
    "han",
    "zan",
    "can",
    "san",
    "zhan",
    "chan",
    "shan",
    "ran",
    "ang",
    "bang",
    "pang",
    "mang",
    "fang",
    "dang",
    "tang",
    "nang",
    "lang",
    "gang",
    "kang",
    "hang",
    "zang",
    "cang",
    "sang",
    "zhang",
    "chang",
    "shang",
    "rang",
    "ao",
    "bao",
    "pao",
    "mao",
    "dao",
    "tao",
    "nao",
    "lao",
    "gao",
    "kao",
    "hao",
    "zao",
    "cao",
    "sao",
    "zhao",
    "chao",
    "shao",
    "rao",
    "e",
    "me",
    "de",
    "te",
    "ne",
    "le",
    "ge",
    "ke",
    "he",
    "ze",
    "ce",
    "se",
    "zhe",
    "che",
    "she",
    "re",
    "ei",
    "bei",
    "pei",
    "mei",
    "fei",
    "dei",
    "nei",
    "lei",
    "gei",
    "hei",
    "zei",
    "zhei",
    "shei",
    "en",
    "ben",
    "pen",
    "men",
    "fen",
    "nen",
    "gen",
    "ken",
    "hen",
    "zen",
    "cen",
    "sen",
    "zhen",
    "chen",
    "shen",
    "ren",
    "eng",
    "beng",
    "peng",
    "meng",
    "feng",
    "deng",
    "teng",
    "neng",
    "leng",
    "geng",
    "keng",
    "heng",
    "zeng",
    "ceng",
    "seng",
    "zheng",
    "cheng",
    "sheng",
    "reng",
    "er",
]

data = []

for idx, py in enumerate(pinyin_list, 1):
    variants = []
    for tone in range(1, 5):
        pinyin_tone = convert_pinyin_tone(py, tone)
        variants.append({"pinyin": pinyin_tone, "audio": f"{py}{tone}.mp3"})
    entry = {"id": idx, "pinyin": py, "variants": variants}
    data.append(entry)

with open("pinyin_full.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"✅ Đã tạo file 'pinyin_full.json' với {len(data)} mục.")
