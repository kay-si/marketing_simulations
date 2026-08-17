import { NextResponse } from "next/server";
import { z } from "zod";
import { OpenAiError, createJsonChatCompletion } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SAMPLE_SIZE, buildSurveyPrompt, computeComposition, surveyRequestSchema } from "@/lib/survey";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const parsed = surveyRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { areaCode, incomeRange, gender, question, sampleSize } = parsed.data;
  const resolvedSampleSize = sampleSize ?? DEFAULT_SAMPLE_SIZE;

  const area = await prisma.area.findUnique({ where: { code: areaCode } });
  if (!area) {
    return NextResponse.json({ error: `Unknown areaCode: ${areaCode}` }, { status: 404 });
  }

  const rows = await prisma.demographicsDistribution.findMany({
    where: {
      areaCode,
      ...(incomeRange !== undefined ? { incomeRange } : {}),
      ...(gender !== undefined ? { gender } : {}),
    },
  });

  const composition = computeComposition(rows);
  if (composition.totalPopulation === 0) {
    return NextResponse.json(
      { error: "No population data matches the given filters" },
      { status: 404 },
    );
  }

  const { system, user } = buildSurveyPrompt({
    areaName: area.name,
    composition,
    question,
    sampleSize: resolvedSampleSize,
  });

  try {
    const result = await createJsonChatCompletion({ system, user });
    return NextResponse.json({
      areaCode,
      areaName: area.name,
      sampleSize: resolvedSampleSize,
      question,
      composition,
      result,
    });
  } catch (error) {
    if (error instanceof OpenAiError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    throw error;
  }
}
