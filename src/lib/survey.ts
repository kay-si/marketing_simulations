import { z } from "zod";
import {
  CODE_LABELS,
  areaCodeSchema,
  genderSchema,
  incomeRangeSchema,
} from "@/lib/demographics";

export const DEFAULT_SAMPLE_SIZE = 1000;
const MAX_SAMPLE_SIZE = 10000;

export const surveyRequestSchema = z.object({
  areaCode: areaCodeSchema,
  incomeRange: incomeRangeSchema.optional(),
  gender: genderSchema.optional(),
  question: z.string().trim().min(1).max(1000),
  sampleSize: z.number().int().min(1).max(MAX_SAMPLE_SIZE).optional(),
});

export type SurveyRequest = z.infer<typeof surveyRequestSchema>;

type DistributionRow = {
  gender: number;
  householdType: number;
  incomeRange: number;
  ageRange: number;
  populationCount: number;
};

type CompositionBucket = { code: number; label: string; ratio: number };

export type Composition = {
  totalPopulation: number;
  gender: CompositionBucket[];
  householdType: CompositionBucket[];
  incomeRange: CompositionBucket[];
  ageRange: CompositionBucket[];
};

function summarizeByDimension(
  rows: DistributionRow[],
  dimension: keyof Pick<DistributionRow, "gender" | "householdType" | "incomeRange" | "ageRange">,
  labels: Record<number, string>,
  totalPopulation: number,
): CompositionBucket[] {
  const counts = new Map<number, number>();
  for (const row of rows) {
    const code = row[dimension];
    counts.set(code, (counts.get(code) ?? 0) + row.populationCount);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => a - b)
    .map(([code, count]) => ({
      code,
      label: labels[code] ?? String(code),
      ratio: totalPopulation > 0 ? count / totalPopulation : 0,
    }));
}

export function computeComposition(rows: DistributionRow[]): Composition {
  const totalPopulation = rows.reduce((sum, row) => sum + row.populationCount, 0);
  return {
    totalPopulation,
    gender: summarizeByDimension(rows, "gender", CODE_LABELS.gender, totalPopulation),
    householdType: summarizeByDimension(
      rows,
      "householdType",
      CODE_LABELS.householdType,
      totalPopulation,
    ),
    incomeRange: summarizeByDimension(
      rows,
      "incomeRange",
      CODE_LABELS.incomeRange,
      totalPopulation,
    ),
    ageRange: summarizeByDimension(rows, "ageRange", CODE_LABELS.ageRange, totalPopulation),
  };
}

function formatBuckets(buckets: CompositionBucket[]): string {
  return buckets.map((b) => `${b.label}: ${(b.ratio * 100).toFixed(1)}%`).join(" / ");
}

export function buildSurveyPrompt(params: {
  areaName: string;
  composition: Composition;
  question: string;
  sampleSize: number;
}) {
  const { areaName, composition, question, sampleSize } = params;

  const system = [
    "あなたは日本の地域住民を対象にした世論調査のシミュレーターです。",
    "与えられた人口構成比（性別・世帯構成・収入レンジ・年齢レンジ）に統計的に合致する仮想の回答者集団を想定し、",
    "指定された人数にアンケートを実施した場合に得られるであろう回答分布をシミュレーションしてください。",
    "出力は必ず有効なJSONオブジェクトのみとし、説明文やコードブロックの記法は含めないでください。",
    'JSON形式: { "summary": string, "answers": [{ "label": string, "ratio": number, "count": number }], "notes": string } ',
    "answers の ratio は 0〜1 の割合、count は sampleSize に ratio を掛けた概算人数（整数）です。ratio の合計は概ね1になるようにしてください。",
  ].join("\n");

  const user = [
    `対象地域: ${areaName}`,
    `アンケート対象人数: ${sampleSize}人`,
    "人口構成比:",
    `- 性別: ${formatBuckets(composition.gender)}`,
    `- 世帯構成: ${formatBuckets(composition.householdType)}`,
    `- 収入レンジ: ${formatBuckets(composition.incomeRange)}`,
    `- 年齢レンジ: ${formatBuckets(composition.ageRange)}`,
    "",
    `質問: ${question}`,
  ].join("\n");

  return { system, user };
}
