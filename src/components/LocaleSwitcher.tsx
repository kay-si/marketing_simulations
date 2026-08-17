"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE_NAME, type Locale } from "@/i18n/locale";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("Locale");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(nextLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
      <span>{t("label")}</span>
      <select
        className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        value={locale}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as Locale)}
      >
        {LOCALES.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
