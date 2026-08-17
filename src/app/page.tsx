import { getTranslations } from "next-intl/server";
import { AreaSelector } from "@/components/AreaSelector";
import { DistributionExplorer } from "@/components/DistributionExplorer";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { areaCodeSchema, prefectureCodeSchema } from "@/lib/demographics";
import { prisma } from "@/lib/prisma";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const rawSearchParams = await searchParams;

  const prefectureCodeResult = prefectureCodeSchema.safeParse(
    firstValue(rawSearchParams.prefectureCode),
  );
  const areaCodeResult = areaCodeSchema.safeParse(firstValue(rawSearchParams.areaCode));

  const selectedPrefectureCode = prefectureCodeResult.success
    ? prefectureCodeResult.data
    : undefined;
  const selectedAreaCode = areaCodeResult.success ? areaCodeResult.data : undefined;

  const [t, prefectures, areas, distribution] = await Promise.all([
    getTranslations("App"),
    prisma.prefecture.findMany({ orderBy: { code: "asc" } }),
    prisma.area.findMany({ orderBy: { code: "asc" } }),
    selectedAreaCode
      ? prisma.demographicsDistribution.findMany({
          where: { areaCode: selectedAreaCode },
          orderBy: [
            { ageRange: "asc" },
            { gender: "asc" },
            { householdType: "asc" },
            { incomeRange: "asc" },
          ],
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("description")}</p>
        </div>
        <LocaleSwitcher />
      </header>

      <AreaSelector
        prefectures={prefectures}
        areas={areas}
        selectedPrefectureCode={selectedPrefectureCode}
        selectedAreaCode={selectedAreaCode}
      />

      <DistributionExplorer
        rows={distribution.map((row) => ({
          ageRange: row.ageRange,
          gender: row.gender,
          householdType: row.householdType,
          incomeRange: row.incomeRange,
          populationCount: row.populationCount,
        }))}
        areaCode={selectedAreaCode}
      />
    </div>
  );
}
