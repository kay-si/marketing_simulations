"use client";

import { useState } from "react";
import { type DistributionFilter, DistributionView } from "./DistributionView";
import { QuestionBox } from "./QuestionBox";

type DistributionRow = {
  ageRange: number;
  gender: number;
  householdType: number;
  incomeRange: number;
  populationCount: number;
};

type Props = {
  rows: DistributionRow[];
  areaCode?: string;
};

export function DistributionExplorer({ rows, areaCode }: Props) {
  const [incomeFilter, setIncomeFilter] = useState<DistributionFilter>("all");
  const [genderFilter, setGenderFilter] = useState<DistributionFilter>("all");

  return (
    <>
      <DistributionView
        rows={rows}
        incomeFilter={incomeFilter}
        genderFilter={genderFilter}
        onIncomeFilterChange={setIncomeFilter}
        onGenderFilterChange={setGenderFilter}
      />

      <QuestionBox
        areaCode={areaCode}
        incomeRange={incomeFilter === "all" ? undefined : incomeFilter}
        gender={genderFilter === "all" ? undefined : genderFilter}
      />
    </>
  );
}
