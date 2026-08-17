"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { SearchableSelect } from "./SearchableSelect";

type Prefecture = { code: number; name: string };
type Area = { code: string; prefectureCode: number; name: string };

type Props = {
  prefectures: Prefecture[];
  areas: Area[];
  selectedPrefectureCode?: number;
  selectedAreaCode?: string;
};

export function AreaSelector({
  prefectures,
  areas,
  selectedPrefectureCode,
  selectedAreaCode,
}: Props) {
  const t = useTranslations("Selector");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const areasInPrefecture = selectedPrefectureCode
    ? areas.filter((area) => area.prefectureCode === selectedPrefectureCode)
    : [];

  function navigate(next: { prefectureCode?: number; areaCode?: string }) {
    const params = new URLSearchParams();
    if (next.prefectureCode !== undefined) {
      params.set("prefectureCode", String(next.prefectureCode));
    }
    if (next.areaCode !== undefined) {
      params.set("areaCode", next.areaCode);
    }
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row" aria-busy={isPending}>
      <label className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("prefectureLabel")}
        </span>
        <SearchableSelect
          options={prefectures.map((prefecture) => ({
            value: String(prefecture.code),
            label: prefecture.name,
          }))}
          value={selectedPrefectureCode !== undefined ? String(selectedPrefectureCode) : undefined}
          placeholder={t("prefecturePlaceholder")}
          noResultsLabel={t("prefectureNoResults")}
          onChange={(value) => {
            navigate({ prefectureCode: Number(value), areaCode: undefined });
          }}
        />
      </label>

      <label className="flex flex-1 flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {t("areaLabel")}
        </span>
        <SearchableSelect
          options={areasInPrefecture.map((area) => ({ value: area.code, label: area.name }))}
          value={selectedAreaCode}
          disabled={!selectedPrefectureCode}
          placeholder={t("areaPlaceholder")}
          noResultsLabel={t("areaNoResults")}
          onChange={(value) => {
            navigate({ prefectureCode: selectedPrefectureCode, areaCode: value });
          }}
        />
      </label>
    </div>
  );
}
