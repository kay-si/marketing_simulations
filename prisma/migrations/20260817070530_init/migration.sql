-- CreateTable
CREATE TABLE "prefectures" (
    "prefecture_code" SMALLINT NOT NULL,
    "prefecture_name" VARCHAR(20) NOT NULL,

    CONSTRAINT "prefectures_pkey" PRIMARY KEY ("prefecture_code")
);

-- CreateTable
CREATE TABLE "areas" (
    "area_code" VARCHAR(6) NOT NULL,
    "prefecture_code" SMALLINT NOT NULL,
    "area_name" VARCHAR(50) NOT NULL,

    CONSTRAINT "areas_pkey" PRIMARY KEY ("area_code")
);

-- CreateTable
CREATE TABLE "demographics_distributions" (
    "id" BIGSERIAL NOT NULL,
    "area_code" VARCHAR(6) NOT NULL,
    "income_range" SMALLINT NOT NULL,
    "household_type" SMALLINT NOT NULL,
    "age_range" SMALLINT NOT NULL,
    "gender" SMALLINT NOT NULL,
    "population_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demographics_distributions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chk_income_zero_when_under20" CHECK ("age_range" <> 0 OR "income_range" = 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "demographics_distributions_unique_idx" ON "demographics_distributions"("area_code", "income_range", "household_type", "age_range", "gender");

-- AddForeignKey
ALTER TABLE "areas" ADD CONSTRAINT "areas_prefecture_code_fkey" FOREIGN KEY ("prefecture_code") REFERENCES "prefectures"("prefecture_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demographics_distributions" ADD CONSTRAINT "demographics_distributions_area_code_fkey" FOREIGN KEY ("area_code") REFERENCES "areas"("area_code") ON DELETE RESTRICT ON UPDATE CASCADE;
