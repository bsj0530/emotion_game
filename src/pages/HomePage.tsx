// src/pages/HomePage.tsx

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { EMOTIONS } from "../types/game";
import type { Emotion, GamePhoto, GameSession, Question } from "../types/game";

type Props = {
  onStart: (session: GameSession) => void;
};

// 사진이 많아도 화면 높이를 유지하도록 10장씩 표시합니다.
const PAGE_SIZE = 10;

async function readPhoto(file: File): Promise<GamePhoto> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽지 못했어요."));
    reader.onabort = () => reject(new Error("사진 읽기가 취소되었어요."));

    reader.readAsDataURL(file);
  });

  const image = new Image();
  image.src = src;
  await image.decode();

  return {
    id: crypto.randomUUID(),
    name: file.name,
    src,
    answer: "",
  };
}

export default function HomePage({ onStart }: Props) {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<GamePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const answered = photos.filter((photo) => photo.answer !== "").length;
  const ready = photos.length > 0 && answered === photos.length && !loading;

  const pageCount = Math.max(1, Math.ceil(photos.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const startIndex = currentPage * PAGE_SIZE;
  const visiblePhotos = photos.slice(startIndex, startIndex + PAGE_SIZE);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) return;

    setError("");

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("이미지 파일을 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const added = await Promise.all(files.map(readPhoto));
      setPhotos((previous) => [...previous, ...added]);
    } catch {
      setError("사진을 열지 못했어요. JPG, PNG, WebP 파일로 선택해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function changeAnswer(id: string, answer: Emotion | "") {
    setPhotos((previous) =>
      previous.map((photo) => (photo.id === id ? { ...photo, answer } : photo)),
    );
  }

  function removePhoto(id: string) {
    setPhotos((previous) => previous.filter((photo) => photo.id !== id));
    setPage(currentPage);
  }

  function startGame() {
    if (!ready) return;

    const questions: Question[] = photos.flatMap((photo) =>
      photo.answer === "" ? [] : [{ ...photo, answer: photo.answer }],
    );

    onStart({
      id: crypto.randomUUID(),
      questions,
    });

    navigate("/game");
  }

  return (
    <main className="h-dvh overflow-hidden bg-[#fcfaf5] p-3 font-sans text-slate-800 sm:p-5">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-3 sm:gap-4">
        <header className="shrink-0 text-center">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            상황 감정 맞추기
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            원하는 만큼 사진을 선택하고 정답 감정을 설정해 주세요.
          </p>
        </header>

        <section
          aria-label="게임 준비"
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-lg shadow-amber-900/5 sm:rounded-3xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-5">
            <div>
              <h2 className="text-sm font-extrabold sm:text-lg">
                문제 사진 준비하기
              </h2>

              <p
                aria-live="polite"
                className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-sm"
              >
                사진 {photos.length}장 · 정답 설정 {answered}/{photos.length}
              </p>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={() => fileInput.current?.click()}
              className="shrink-0 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-amber-950 transition hover:bg-amber-300 focus-visible:outline-4 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-sm"
            >
              {loading ? "읽는 중…" : "📁 사진 선택"}
            </button>

            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={loading}
              onChange={handleUpload}
              aria-label="문제 사진 선택"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="shrink-0 bg-red-50 px-4 py-2 text-xs leading-5 text-red-700"
            >
              {error}
            </p>
          )}

          <div className="min-h-0 flex-1 p-3 sm:p-4">
            {photos.length === 0 ? (
              <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/40 px-4 text-center">
                <span aria-hidden="true" className="text-5xl sm:text-6xl">
                  🖼️
                </span>

                <h3 className="text-lg font-extrabold sm:text-2xl">
                  어떤 상황을 살펴볼까요?
                </h3>

                <p className="text-xs leading-6 text-slate-500 sm:text-sm">
                  사진 1장부터 원하는 만큼 선택할 수 있어요.
                </p>
              </div>
            ) : (
              <div className="grid h-full min-h-0 grid-cols-2 grid-rows-5 gap-2 sm:grid-cols-5 sm:grid-rows-2 sm:gap-3">
                {visiblePhotos.map((photo, index) => {
                  const number = startIndex + index + 1;

                  return (
                    <article
                      key={photo.id}
                      className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white sm:rounded-2xl"
                    >
                      <div className="relative min-h-0 flex-1 bg-slate-50">
                        <img
                          src={photo.src}
                          alt={`문제 사진 ${number}`}
                          className="absolute inset-0 h-full w-full object-contain"
                        />

                        <span className="absolute top-1 left-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-white/95 px-1 text-[10px] font-black shadow-sm sm:top-2 sm:left-2 sm:h-7 sm:min-w-7 sm:text-xs">
                          {number}
                        </span>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => removePhoto(photo.id)}
                          aria-label={`${number}번 사진 삭제`}
                          className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/95 text-lg leading-none text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-40 sm:top-2 sm:right-2 sm:size-7"
                        >
                          ×
                        </button>
                      </div>

                      <div className="shrink-0 border-t border-slate-100 p-1.5 sm:p-3">
                        <label
                          htmlFor={`answer-${photo.id}`}
                          className="sr-only"
                        >
                          {number}번 사진의 정답 감정
                        </label>

                        <select
                          id={`answer-${photo.id}`}
                          value={photo.answer}
                          onChange={(event) =>
                            changeAnswer(
                              photo.id,
                              event.target.value as Emotion | "",
                            )
                          }
                          className="h-7 w-full rounded-lg border border-slate-200 bg-slate-50 px-1 text-[11px] font-semibold text-slate-700 focus:border-amber-400 focus:outline-2 focus:outline-amber-400 sm:h-10 sm:px-2 sm:text-sm"
                        >
                          <option value="">정답 감정 선택</option>

                          {EMOTIONS.map((emotion) => (
                            <option key={emotion.value} value={emotion.value}>
                              {emotion.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="사진 목록 페이지"
              className="flex shrink-0 items-center justify-center gap-4 px-3 pb-3"
            >
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30"
              >
                ← 이전
              </button>

              <span
                aria-live="polite"
                className="text-xs font-bold text-slate-600"
              >
                {currentPage + 1} / {pageCount}
              </span>

              <button
                type="button"
                disabled={currentPage === pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-500 disabled:opacity-30"
              >
                다음 →
              </button>
            </nav>
          )}

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-5">
            <p className="text-[11px] leading-5 text-slate-500 sm:text-sm">
              {ready
                ? `${photos.length}문제 준비 완료!`
                : photos.length === 0
                  ? "사진을 1장 이상 선택해 주세요."
                  : `정답 감정을 ${photos.length - answered}개 더 설정해 주세요.`}
            </p>

            <button
              type="button"
              disabled={!ready}
              onClick={startGame}
              className="shrink-0 rounded-xl bg-slate-800 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-slate-700 focus-visible:outline-4 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:px-7 sm:text-sm"
            >
              게임 시작 →
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}
