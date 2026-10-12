// src/pages/GamePage.tsx

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Navigate, useNavigate } from "react-router";
import confetti from "canvas-confetti";

import { EMOTIONS, shuffle } from "../types/game";
import type { Emotion, GameSession } from "../types/game";

import happyImage from "../assets/happy.png";
import sadImage from "../assets/sad.png";
import angryImage from "../assets/angry.png";
import scaredImage from "../assets/scared.png";
import calmImage from "../assets/calm.png";

import correctSfx from "../assets/sounds/correct.mp3";
import wrongSfx from "../assets/sounds/wrong.mp3";

type Props = {
  session: GameSession | null;
};

type SoundType = "correct" | "wrong";

const emotionImages: Record<Emotion, string> = {
  happy: happyImage,
  sad: sadImage,
  angry: angryImage,
  scared: scaredImage,
  calm: calmImage,
};

const EFFECT_DURATION = 450;
const NEXT_QUESTION_DELAY = 800;

const animationStyles = `
  @keyframes quiz-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
    20%, 40%, 60%, 80% { transform: translateX(8px); }
  }

  @keyframes quiz-boom {
    0% { transform: scale(0.4); opacity: 0; }
    35% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1.8); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .quiz-shake, .quiz-boom {
      animation: none !important;
    }
  }
`;

export default function GamePage({ session }: Props) {
  if (!session || session.questions.length === 0) {
    return <Navigate to="/" replace />;
  }

  return <Quiz key={session.id} session={session} />;
}

function Quiz({ session }: { session: GameSession }) {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(() => shuffle(session.questions));
  const [index, setIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shaking, setShaking] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);

  const locked = useRef(false);
  const timers = useRef<Set<number>>(new Set());
  const coverButton = useRef<HTMLButtonElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<Record<SoundType, HTMLAudioElement> | null>(null);

  const total = questions.length;
  const question = questions[index]!;
  const canAnswer = revealed && imageLoaded && !imageFailed && !busy;

  useEffect(() => {
    const correctAudio = new Audio(correctSfx);
    const wrongAudio = new Audio(wrongSfx);

    for (const audio of [correctAudio, wrongAudio]) {
      audio.preload = "auto";
      audio.volume = 0.9;
    }

    audioRef.current = {
      correct: correctAudio,
      wrong: wrongAudio,
    };

    const pendingTimers = timers.current;

    return () => {
      pendingTimers.forEach((timer) => window.clearTimeout(timer));
      pendingTimers.clear();

      for (const audio of [correctAudio, wrongAudio]) {
        audio.pause();
        audio.currentTime = 0;
      }

      audioRef.current = null;
      confetti.reset();
    };
  }, []);

  useEffect(() => {
    if (!finished) coverButton.current?.focus();
  }, [index, finished]);

  useEffect(() => {
    if (canAnswer) firstOption.current?.focus();
  }, [canAnswer]);

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);

    timers.current.add(timer);
  }

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
  }

  function stopSounds() {
    if (!audioRef.current) return;

    Object.values(audioRef.current).forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function playSound(type: SoundType) {
    const audio = audioRef.current?.[type];
    if (!audio) return;

    stopSounds();

    try {
      void audio.play().catch(() => {});
    } catch {
      // 효과음 재생에 실패해도 게임은 계속 진행합니다.
    }
  }

  function revealPhoto() {
    if (revealed || locked.current) return;

    setRevealed(true);
    setFeedback("");
  }

  function triggerEffects(isCorrect: boolean) {
    setShaking(false);
    setShowExplosion(false);

    if (isCorrect) {
      void confetti({
        origin: { x: 0.5, y: 0.5 },
        zIndex: 10001,
        disableForReducedMotion: true,
        particleCount: 100,
        spread: 110,
        startVelocity: 45,
        colors: ["#FFD700", "#FF69B4", "#38BDF8", "#86EFAC"],
        shapes: ["circle", "square"],
        scalar: 2,
        ticks: 115,
        gravity: 0.8,
        decay: 0.92,
      });

      return;
    }

    setShaking(true);
    setShowExplosion(true);

    void confetti({
      origin: { x: 0.5, y: 0.45 },
      zIndex: 10001,
      disableForReducedMotion: true,
      particleCount: 65,
      spread: 360,
      startVelocity: 52,
      colors: ["#FF0000", "#FF4500", "#FFD700"],
      shapes: ["star", "square", "circle"],
      scalar: 5,
      ticks: 60,
      gravity: 0,
      decay: 0.9,
    });

    schedule(() => {
      setShaking(false);
      setShowExplosion(false);
    }, EFFECT_DURATION);
  }

  function resetQuestion() {
    setRevealed(false);
    setImageLoaded(false);
    setImageFailed(false);
    setSelected(null);
    setBusy(false);
    setFeedback("");
    setShaking(false);
    setShowExplosion(false);

    locked.current = false;
  }

  function choose(emotion: Emotion) {
    if (!canAnswer || locked.current) return;

    locked.current = true;
    setBusy(true);
    setSelected(emotion);

    const isCorrect = emotion === question.answer;

    triggerEffects(isCorrect);
    playSound(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setStars((previous) => previous + 1);
      setFeedback("⭐ 맞았어요!");

      schedule(() => {
        if (index === total - 1) {
          setFinished(true);
          return;
        }

        setIndex((previous) => previous + 1);
        resetQuestion();
      }, NEXT_QUESTION_DELAY);
    } else {
      setFeedback("다시 골라볼까요?");

      schedule(() => {
        setSelected(null);
        setBusy(false);
        locked.current = false;
      }, EFFECT_DURATION);
    }
  }

  function replay() {
    clearTimers();
    stopSounds();
    confetti.reset();

    setQuestions(shuffle(session.questions));
    setIndex(0);
    setStars(0);
    setFinished(false);
    resetQuestion();
  }

  if (finished) {
    return (
      <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#fcfaf5] p-4 font-sans text-slate-800">
        <section className="w-full max-w-xl rounded-3xl border-4 border-amber-300 bg-white px-5 py-8 text-center shadow-xl shadow-amber-900/5 sm:p-10">
          <div aria-hidden="true" className="mb-4 text-6xl sm:text-7xl">
            🌟
          </div>

          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {total}문제를 모두 풀었어요!
          </h1>

          <p className="mt-4 text-base text-slate-500 sm:text-lg">
            별 <strong className="text-amber-700">{stars}개</strong>를 모았어요.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={replay}
              className="rounded-xl bg-amber-400 px-5 py-3 font-extrabold text-amber-950 transition hover:bg-amber-300 focus-visible:outline-4 focus-visible:outline-blue-500"
            >
              한 번 더 하기
            </button>

            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-xl border-2 border-slate-200 px-5 py-3 font-bold text-slate-600 transition hover:bg-slate-50 focus-visible:outline-4 focus-visible:outline-blue-500"
            >
              새 사진 준비
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <style>{animationStyles}</style>

      <main className="h-dvh overflow-hidden bg-[#fcfaf5] p-3 font-sans text-slate-800 sm:p-5">
        <div
          className={[
            "mx-auto flex h-full min-h-0 w-full max-w-[1600px] flex-col gap-3",
            shaking
              ? "quiz-shake animate-[quiz-shake_450ms_ease-in-out_both]"
              : "",
          ].join(" ")}
        >
          <header className="flex shrink-0 items-center justify-between gap-2 rounded-2xl border-2 border-amber-300 bg-white px-3 py-2 sm:px-5 sm:py-3">
            <p className="text-base font-black whitespace-nowrap sm:text-2xl">
              🎯 문제 <span className="text-amber-700">{index + 1}</span>
              <span className="ml-1 text-slate-500">/ {total}</span>
            </p>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-[11px] font-extrabold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-4 focus-visible:outline-blue-500 sm:px-4 sm:text-sm"
              >
                📁 사진 바꾸기
              </button>

              <p
                aria-label={`모은 별 ${stars}개, 전체 ${total}개`}
                className="rounded-lg bg-amber-50 px-2 py-2 text-sm font-black whitespace-nowrap sm:px-4 sm:text-lg"
              >
                ⭐ {stars}/{total}
              </p>
            </div>
          </header>

          <div
            role="progressbar"
            aria-label="완료한 문제"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={stars}
            className="h-1.5 shrink-0 overflow-hidden rounded-full bg-amber-100"
          >
            <div
              style={{ width: `${(stars / total) * 100}%` }}
              className="h-full rounded-full bg-amber-400 transition-[width] duration-300 motion-reduce:transition-none"
            />
          </div>

          <section
            aria-label={`${index + 1}번 문제의 상황 사진`}
            className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border-[3px] border-amber-300 bg-white sm:rounded-3xl"
          >
            {!imageFailed && (
              <img
                key={question.id}
                src={question.src}
                alt={revealed ? `${index + 1}번 문제의 상황 사진` : ""}
                aria-hidden={!revealed}
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageLoaded(false);
                  setImageFailed(true);
                }}
                className={[
                  "absolute inset-0 h-full w-full object-contain",
                  revealed ? "visible" : "invisible",
                ].join(" ")}
              />
            )}

            {revealed && !imageLoaded && !imageFailed && (
              <div
                role="status"
                className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-500"
              >
                写真을 불러오는 중…
              </div>
            )}

            {revealed && imageFailed && (
              <div className="absolute inset-0 flex items-center justify-center p-5 text-center">
                <p
                  role="alert"
                  className="text-sm leading-7 text-slate-500 sm:text-base"
                >
                  사진을 표시하지 못했어요.
                  <br />
                  ‘사진 바꾸기’에서 다시 준비해 주세요.
                </p>
              </div>
            )}

            {!revealed && (
              <button
                ref={coverButton}
                type="button"
                onClick={revealPhoto}
                aria-label={`${index + 1}번 사진 공개하기`}
                className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center gap-4 bg-amber-300 text-amber-950 transition-colors hover:bg-amber-200 focus-visible:outline-4 focus-visible:-outline-offset-8 focus-visible:outline-blue-500"
              >
                <span
                  aria-hidden="true"
                  className="text-[clamp(3rem,12vh,8rem)]"
                >
                  ?
                </span>

                <span className="text-lg font-black sm:text-2xl">
                  클릭해서 사진 보기
                </span>
              </button>
            )}
          </section>

          <section
            aria-label="감정 선택"
            className="grid shrink-0 grid-cols-5 gap-2 sm:gap-4"
          >
            {EMOTIONS.map((emotion, emotionIndex) => (
              <button
                key={emotion.value}
                ref={emotionIndex === 0 ? firstOption : undefined}
                type="button"
                onClick={() => choose(emotion.value)}
                disabled={!canAnswer}
                aria-pressed={selected === emotion.value}
                style={
                  {
                    "--emotion-color": emotion.color,
                    "--emotion-tint": emotion.tint,
                  } as CSSProperties
                }
                className={[
                  "flex min-w-0 flex-col items-center justify-center gap-2",
                  "rounded-xl border-2 border-[var(--emotion-color)]",
                  "bg-[var(--emotion-tint)] px-1 py-2",
                  "transition motion-reduce:transition-none",
                  "enabled:hover:-translate-y-1",
                  "focus-visible:outline-4 focus-visible:outline-offset-2",
                  "focus-visible:outline-blue-500 disabled:cursor-default",
                  "sm:rounded-2xl sm:border-[3px] sm:py-3",
                  !revealed ? "opacity-50" : "",
                  selected === emotion.value
                    ? "ring-2 ring-[var(--emotion-color)] ring-offset-2 ring-offset-[#fcfaf5]"
                    : "",
                ].join(" ")}
              >
                <img
                  src={emotionImages[emotion.value]}
                  alt=""
                  draggable={false}
                  className="size-[clamp(32px,10vh,110px)] max-w-full object-contain"
                />

                <strong className="text-xs font-black tracking-tight whitespace-nowrap sm:text-xl lg:text-2xl">
                  {emotion.label}
                </strong>
              </button>
            ))}
          </section>

          <footer className="flex min-h-8 shrink-0 items-center justify-center">
            <p
              role="status"
              aria-live="polite"
              className={[
                "text-center text-xs leading-5 font-bold sm:text-base",
                feedback === "⭐ 맞았어요!"
                  ? "text-emerald-700"
                  : "text-slate-600",
              ].join(" ")}
            >
              {feedback}
            </p>
          </footer>
        </div>

        {showExplosion && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center overflow-hidden"
          >
            <span className="quiz-boom animate-[quiz-boom_450ms_ease-out_both] text-[clamp(5rem,20vw,12rem)] leading-none drop-shadow-xl select-none">
              💥
            </span>
          </div>
        )}
      </main>
    </>
  );
}
