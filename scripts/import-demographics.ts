import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HEADER_ROWS = 4; // age, gender, household, income
const LABEL_ROW_INDEX = 4; // 団体コード,都道府県コード,都道府県名,市区町村名
const HEADER_COLS = 4;
const SCALE = 10000; // 構成比(0〜1) を population_count(INT) に変換する係数

function parseCsv(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => line.split(","));
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "files/demographics_distributions.csv");
  const raw = readFileSync(csvPath, "utf-8").replace(/^﻿/, "");
  const rows = parseCsv(raw);

  const [ageRow, genderRow, householdRow, incomeRow] = rows;
  const dataRows = rows.slice(LABEL_ROW_INDEX + 1);

  const combos = [];
  for (let i = HEADER_COLS; i < ageRow.length; i++) {
    combos.push({
      ageRange: Number(ageRow[i]),
      gender: Number(genderRow[i]),
      householdType: Number(householdRow[i]),
      incomeRange: Number(incomeRow[i]),
    });
  }

  const prefectures = new Map<number, string>(); // code -> name
  const areas = new Map<string, { prefectureCode: number; name: string }>();
  const distributionRecords: {
    areaCode: string;
    incomeRange: number;
    householdType: number;
    ageRange: number;
    gender: number;
    populationCount: number;
  }[] = [];

  for (const row of dataRows) {
    if (!row[0]) continue;
    const areaCode = row[0].padStart(6, "0");
    const prefectureCode = Number(row[1]);
    const prefectureName = row[2];
    const areaName = row[3];

    prefectures.set(prefectureCode, prefectureName);
    areas.set(areaCode, { prefectureCode, name: areaName });

    for (let i = 0; i < combos.length; i++) {
      const cellValue = row[HEADER_COLS + i];
      if (cellValue === undefined || cellValue === "") continue;
      const combo = combos[i];
      distributionRecords.push({
        areaCode,
        incomeRange: combo.incomeRange,
        householdType: combo.householdType,
        ageRange: combo.ageRange,
        gender: combo.gender,
        populationCount: Math.round(Number(cellValue) * SCALE),
      });
    }
  }

  console.log(
    `prefectures: ${prefectures.size}, areas: ${areas.size}, distribution rows: ${distributionRecords.length}`,
  );

  await prisma.prefecture.createMany({
    data: [...prefectures.entries()].map(([code, name]) => ({ code, name })),
    skipDuplicates: true,
  });

  await prisma.area.createMany({
    data: [...areas.entries()].map(([code, { prefectureCode, name }]) => ({
      code,
      prefectureCode,
      name,
    })),
    skipDuplicates: true,
  });

  const BATCH_SIZE = 5000;
  for (let i = 0; i < distributionRecords.length; i += BATCH_SIZE) {
    const batch = distributionRecords.slice(i, i + BATCH_SIZE);
    await prisma.demographicsDistribution.createMany({ data: batch, skipDuplicates: true });
    console.log(`inserted ${Math.min(i + BATCH_SIZE, distributionRecords.length)}/${distributionRecords.length}`);
  }

  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
