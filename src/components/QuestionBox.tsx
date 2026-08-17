"use client";

import { useTranslations } from "next-intl";
import { type FormEvent, useState } from "react";
import { DEFAULT_SAMPLE_SIZE } from "@/lib/survey";

type SurveyAnswer = { label: string; ratio: number; count: number };
type SurveyResult = { summary?: string; answers?: SurveyAnswer[]; notes?: string };

type Props = {
  areaCode?: string;
  incomeRange?: number;
  gender?: number;
};

export function QuestionBox({ areaCode, incomeRange, gender }: Props) {
  const t = useTranslations("Question");

  const [question, setQuestion] = useState("");
  const [sampleSize, setSampleSize] = useState(String(DEFAULT_SAMPLE_SIZE));
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SurveyResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !areaCode) return;

    setStatus("loading");
    setErrorMessage(null);
    setResult(null);

    const parsedSampleSize = Number(sampleSize);
    const resolvedSampleSize =
      Number.isFinite(parsedSampleSize) && parsedSampleSize > 0
        ? Math.min(Math.trunc(parsedSampleSize), 10000)
        : DEFAULT_SAMPLE_SIZE;

    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          areaCode,
          question: question.trim(),
          sampleSize: resolvedSampleSize,
          ...(incomeRange !== undefined ? { incomeRange } : {}),
          ...(gender !== undefined ? { gender } : {}),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : t("errorGeneric"));
      }

      setResult(data.result ?? {});
      setStatus("idle");
    } catch {
      setErrorMessage(t("errorGeneric"));
      setStatus("error");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>

      {!areaCode ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("areaRequired")}</p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <textarea
            className="resize-none rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            rows={2}
            placeholder={t("placeholder")}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("sampleSizeLabel")}
              </span>
              <input
                type="number"
                min={1}
                max={10000}
                className="w-28 rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                value={sampleSize}
                onChange={(event) => setSampleSize(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className="ml-auto shrink-0 rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              disabled={!question.trim() || status === "loading"}
            >
              {status === "loading" ? t("loading") : t("submit")}
            </button>
          </div>
        </form>
      )}

      {status === "error" && errorMessage && (
        <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
      )}

      {result && (
        <div className="flex flex-col gap-2 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
          {result.summary && <p className="text-zinc-800 dark:text-zinc-200">{result.summary}</p>}
          {Array.isArray(result.answers) && result.answers.length > 0 && (
            <ul className="flex flex-col gap-1">
              {result.answers.map((answer, index) => (
                <li key={index} className="flex items-center justify-between gap-2">
                  <span className="text-zinc-700 dark:text-zinc-300">{answer.label}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {(answer.ratio * 100).toFixed(1)}% ({answer.count.toLocaleString()})
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result.notes && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{result.notes}</p>
          )}
        </div>
      )}
    </section>
  );
}
