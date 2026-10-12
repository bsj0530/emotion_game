import type { Emotion } from "../types/game";

export default function EmotionFace({
  emotion,
  color,
}: {
  emotion: Emotion;
  color: string;
}) {
  return (
    <svg className="emotion-face" viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M23 39 Q13 8 39 22 Q60 13 81 22 Q107 8 97 39 C117 80 98 106 60 107 C22 106 3 80 23 39Z"
        fill={color}
        stroke="#263345"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {emotion === "happy" && (
        <g fill="none" stroke="#263345" strokeWidth="5" strokeLinecap="round">
          <path d="M33 57 Q42 44 51 57 M69 57 Q78 44 87 57" />
          <path d="M36 73 Q60 104 84 73Z" fill="#913f48" />
        </g>
      )}
      {emotion === "sad" && (
        <g
          fill="#263345"
          stroke="#263345"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path
            d="M34 43 L49 48 M71 48 L86 43 M40 88 Q60 67 80 88"
            fill="none"
          />
          <circle cx="43" cy="61" r="4" />
          <circle cx="77" cy="61" r="4" />
        </g>
      )}
      {emotion === "angry" && (
        <g stroke="#263345" strokeWidth="4" strokeLinecap="round">
          <path d="M33 43 L51 51 M69 51 L87 43" />
          <circle cx="44" cy="62" r="8" fill="white" />
          <circle cx="76" cy="62" r="8" fill="white" />
          <circle cx="46" cy="62" r="3" />
          <circle cx="74" cy="62" r="3" />
          <path
            d="M38 87 L44 75 L53 83 L60 75 L67 83 L76 75 L82 87Z"
            fill="white"
          />
        </g>
      )}
      {emotion === "scared" && (
        <g stroke="#263345" strokeWidth="3">
          <circle cx="42" cy="58" r="12" fill="white" />
          <circle cx="78" cy="58" r="12" fill="white" />
          <circle cx="42" cy="58" r="4" />
          <circle cx="78" cy="58" r="4" />
          <ellipse cx="60" cy="85" rx="8" ry="12" fill="#172231" />
        </g>
      )}
      {emotion === "calm" && (
        <g fill="none" stroke="#263345" strokeWidth="4" strokeLinecap="round">
          <path d="M32 55 Q42 65 52 55 M68 55 Q78 65 88 55 M44 81 Q60 94 76 81" />
        </g>
      )}
    </svg>
  );
}
