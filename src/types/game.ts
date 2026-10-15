export const EMOTIONS = [
  {
    value: "happy",
    label: "기쁨",
    color: "#e6ad27",
    tint: "#fff6da",
    colorName: "노랑",
  },
  {
    value: "sad",
    label: "슬픔",
    color: "#4787c4",
    tint: "#eaf4ff",
    colorName: "파랑",
  },
  {
    value: "angry",
    label: "화남",
    color: "#d65757",
    tint: "#fff0ef",
    colorName: "빨강",
  },
  {
    value: "scared",
    label: "무서움",
    color: "#35465c",
    tint: "#eef1f6",
    colorName: "검정",
  },
  {
    value: "calm",
    label: "평온",
    color: "#409976",
    tint: "#edf8f0",
    colorName: "초록",
  },
] as const;

export type Emotion = (typeof EMOTIONS)[number]["value"];

export type GamePhoto = {
  id: string;
  name: string;
  src: string;
  answer: Emotion[];
};

export type Question = Omit<GamePhoto, "answer"> & {
  answer: Emotion[];
};

export type GameSession = {
  id: string;
  questions: Question[];
};

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }

  return result;
}
