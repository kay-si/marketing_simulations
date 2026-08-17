import { z } from "zod";

export const INCOME_RANGE_CODES = [0, 1, 2, 3, 4, 5, 6] as const;
export const HOUSEHOLD_TYPE_CODES = [0, 1, 2, 3] as const;
export const AGE_RANGE_CODES = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const GENDER_CODES = [0, 1] as const;

export const incomeRangeSchema = z.union(
  INCOME_RANGE_CODES.map((code) => z.literal(code)),
);
export const householdTypeSchema = z.union(
  HOUSEHOLD_TYPE_CODES.map((code) => z.literal(code)),
);
export const ageRangeSchema = z.union(AGE_RANGE_CODES.map((code) => z.literal(code)));
export const genderSchema = z.union(GENDER_CODES.map((code) => z.literal(code)));

export const areaCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "area_code must be a 6-digit code");

export const prefectureCodeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(47);

export const searchParamsSchema = z.object({
  prefectureCode: z.string().optional(),
  areaCode: z.string().optional(),
});

// LLM プロンプト用の日本語ラベル（messages/*.json の Codes セクションと対応）
export const CODE_LABELS = {
  incomeRange: {
    0: "収入なし（20歳以下）",
    1: "200万円未満",
    2: "200～400万円",
    3: "400～600万円",
    4: "600～800万円",
    5: "800～1000万円",
    6: "1000万円以上",
  },
  householdType: {
    0: "未婚子なし",
    1: "既婚子なし",
    2: "既婚子あり",
    3: "未婚子あり",
  },
  ageRange: {
    0: "20歳以下",
    1: "20代",
    2: "30代",
    3: "40代",
    4: "50代",
    5: "60代",
    6: "70代",
    7: "80歳以上",
  },
  gender: {
    0: "男性",
    1: "女性",
  },
} as const satisfies Record<string, Record<number, string>>;
