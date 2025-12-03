export const SAMPLE_QUERIES = [
  {
    id: "state-counts-2023",
    label: "Count respondents by state (2023 table)",
    prompt: "Show respondent counts by state for 2023.",
    requiredYears: [2023],
    sql: `SELECT _STATE AS state_fips, COUNT(*) AS respondents
FROM brfss_2023
GROUP BY 1
ORDER BY respondents DESC
LIMIT 25;`,
  },
  {
    id: "smoking-status-tbi-prevalence-2022",
    label: "Correlate smoking status with TBI prevalence (2022 table)",
    prompt: "Correlate smoking status with TBI prevalence for 2022.",
    requiredYears: [2022],
    sql: `SELECT
    CASE _SMOKER3
        WHEN 1 THEN 'Everyday smoker'
        WHEN 2 THEN 'Someday smoker'
        WHEN 3 THEN 'Former smoker'
        WHEN 4 THEN 'Never smoked'
        ELSE 'Other/Unknown Smoking Status'
    END AS smoking_status,
    CAST(SUM(CASE WHEN OH8_1 = 1 THEN 1 ELSE 0 END) AS DOUBLE) * 100.0 / COUNT(*) AS tbi_prevalence_percentage
FROM
    brfss_2022
WHERE
    _SMOKER3 IN (1, 2, 3, 4) AND OH8_1 IN (1, 2)
GROUP BY
    smoking_status
ORDER BY
    smoking_status;`,
  },
  {
    id: "tbi-prevalence-2016-to-2020",
    label: "Compare TBI prevalence from 2016 to 2020",
    prompt: "Compare TBI prevalence from 2016 to 2020.",
    requiredYears: [2016, 2017, 2018, 2019, 2020],
    sql: `SELECT
    2016 AS year,
    COUNT(*) AS total_respondents,
    SUM(CASE
        WHEN (brfss_2016.oh7_1 = 1 OR brfss_2016.oh7_2 = 1 OR brfss_2016.oh7_3 = 1 OR brfss_2016.oh7_4 = 1 OR brfss_2016.oh7_5 = 1 OR brfss_2016.oh7_6 = 1 OR brfss_2016.oh7_10 = 1) THEN 1
        ELSE 0
    END) AS tbi_count,
    (SUM(CASE
        WHEN (brfss_2016.oh7_1 = 1 OR brfss_2016.oh7_2 = 1 OR brfss_2016.oh7_3 = 1 OR brfss_2016.oh7_4 = 1 OR brfss_2016.oh7_5 = 1 OR brfss_2016.oh7_6 = 1 OR brfss_2016.oh7_10 = 1) THEN 1
        ELSE 0
    END) * 100.0 / COUNT(*)) AS tbi_prevalence
FROM
    brfss_2016
UNION ALL
SELECT
    2017 AS year,
    COUNT(*) AS total_respondents,
    SUM(CASE
        WHEN (brfss_2017.oh6_1 = 1 OR brfss_2017.oh6_2 = 1 OR brfss_2017.oh6_3 = 1 OR brfss_2017.oh6_4 = 1 OR brfss_2017.oh6_5 = 1 OR brfss_2017.oh6_6 = 1 OR brfss_2017.oh6_10 = 1) THEN 1
        ELSE 0
    END) AS tbi_count,
    (SUM(CASE
        WHEN (brfss_2017.oh6_1 = 1 OR brfss_2017.oh6_2 = 1 OR brfss_2017.oh6_3 = 1 OR brfss_2017.oh6_4 = 1 OR brfss_2017.oh6_5 = 1 OR brfss_2017.oh6_6 = 1 OR brfss_2017.oh6_10 = 1) THEN 1
        ELSE 0
    END) * 100.0 / COUNT(*)) AS tbi_prevalence
FROM
    brfss_2017
UNION ALL
SELECT
    2018 AS year,
    COUNT(*) AS total_respondents,
    SUM(CASE
        WHEN (brfss_2018.OH7_1 = 1 OR brfss_2018.OH7_2 = 1 OR brfss_2018.OH7_3 = 1 OR brfss_2018.OH7_4 = 1 OR brfss_2018.OH7_5 = 1 OR brfss_2018.OH7_6 = 1 OR brfss_2018.OH7_10 = 1) THEN 1
        ELSE 0
    END) AS tbi_count,
    (SUM(CASE
        WHEN (brfss_2018.OH7_1 = 1 OR brfss_2018.OH7_2 = 1 OR brfss_2018.OH7_3 = 1 OR brfss_2018.OH7_4 = 1 OR brfss_2018.OH7_5 = 1 OR brfss_2018.OH7_6 = 1 OR brfss_2018.OH7_10 = 1) THEN 1
        ELSE 0
    END) * 100.0 / COUNT(*)) AS tbi_prevalence
FROM
    brfss_2018
UNION ALL
SELECT
    2019 AS year,
    COUNT(*) AS total_respondents,
    SUM(CASE
        WHEN (brfss_2019.OH5_1 = 1 OR brfss_2019.OH5_2 = 1 OR brfss_2019.OH5_3 = 1 OR brfss_2019.OH5_4 = 1 OR brfss_2019.OH5_5 = 1 OR brfss_2019.OH5_6 = 1 OR brfss_2019.OH5_10 = 1) THEN 1
        ELSE 0
    END) AS tbi_count,
    (SUM(CASE
        WHEN (brfss_2019.OH5_1 = 1 OR brfss_2019.OH5_2 = 1 OR brfss_2019.OH5_3 = 1 OR brfss_2019.OH5_4 = 1 OR brfss_2019.OH5_5 = 1 OR brfss_2019.OH5_6 = 1 OR brfss_2019.OH5_10 = 1) THEN 1
        ELSE 0
    END) * 100.0 / COUNT(*)) AS tbi_prevalence
FROM
    brfss_2019
UNION ALL
SELECT
    2020 AS year,
    COUNT(*) AS total_respondents,
    SUM(CASE
        WHEN (brfss_2020.OH4_1 = 1 OR brfss_2020.OH4_2 = 1 OR brfss_2020.OH4_3 = 1 OR brfss_2020.OH4_4 = 1 OR brfss_2020.OH4_5 = 1 OR brfss_2020.OH4_6 = 1 OR brfss_2020.OH4_7 = 1 OR brfss_2020.OH4_10 = 1) THEN 1
        ELSE 0
    END) AS tbi_count,
    (SUM(CASE
        WHEN (brfss_2020.OH4_1 = 1 OR brfss_2020.OH4_2 = 1 OR brfss_2020.OH4_3 = 1 OR brfss_2020.OH4_4 = 1 OR brfss_2020.OH4_5 = 1 OR brfss_2020.OH4_6 = 1 OR brfss_2020.OH4_7 = 1 OR brfss_2020.OH4_10 = 1) THEN 1
        ELSE 0
    END) * 100.0 / COUNT(*)) AS tbi_prevalence
FROM
    brfss_2020;`,
  },
  {
    id: "tbi-er-visit-rate-2022",
    label: "Head/neck injury ER visit rate (2022)",
    prompt: "What share of 2022 respondents report ever being hospitalized or treated in an ER for head or neck injury (OH8_1)?",
    requiredYears: [2022],
    sql: `SELECT
  SUM(CASE WHEN OH8_1 = 1 THEN 1 ELSE 0 END) AS ever_hospitalized_head_injury,
  COUNT(*) AS total,
  SUM(CASE WHEN OH8_1 = 1 THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) * 100 AS percent_ever
FROM brfss_2022;`,
  },
  {
    id: "tbi-er-by-agegroup-2022",
    label: "Head/neck injury ER visits by age group (2022)",
    prompt: "Break out 2022 ER/hospital head injury (OH8_1) responses by six-level age category (_AGE_G).",
    requiredYears: [2022],
    sql: `SELECT
  _AGE_G AS age_group_code,
  SUM(CASE WHEN OH8_1 = 1 THEN 1 ELSE 0 END) AS ever_hospitalized_head_injury,
  SUM(CASE WHEN OH8_1 = 2 THEN 1 ELSE 0 END) AS never_hospitalized_head_injury,
  COUNT(*) AS total
FROM brfss_2022
GROUP BY 1
ORDER BY 1;`,
  },
  {
    id: "tbi-er-by-sex-2022",
    label: "Head/neck injury ER visits by sex (2022)",
    prompt: "Show 2022 head/neck injury ER experience (OH8_1) by respondent sex.",
    requiredYears: [2022],
    sql: `SELECT
  SEXVAR,
  OH8_1,
  COUNT(*)
FROM brfss_2022
GROUP BY
  SEXVAR,
  OH8_1
ORDER BY
  SEXVAR,
  OH8_1;`,
  },
  {
    id: "tbi-child-sports-2022",
    label: "Child sports head injuries (2022)",
    prompt: "Distribution of reported sports-related head injury counts for the nth child (OH4_2) in 2022.",
    requiredYears: [2022],
    sql: `SELECT
  OH4_2 AS sports_head_injury_count,
  COUNT(*) AS respondents
FROM brfss_2022
WHERE OH4_2 IS NOT NULL
    GROUP BY 1
    ORDER BY respondents DESC;`,
  },
  {
    id: "tbi-incident-count-2019",
    label: "Head/neck injury counts (2019 TBI module)",
    prompt: "Count respondents with any reported head/neck injury indicators (OH5_1..OH5_10) in 2019.",
    requiredYears: [2019],
    sql: `SELECT
  SUM(
    CASE WHEN OH5_1 = 1 OR OH5_2 = 1 OR OH5_3 = 1 OR OH5_4 = 1
           OR OH5_5 = 1 OR OH5_6 = 1 OR OH5_10 = 1
      THEN 1 ELSE 0 END
  ) AS any_head_injury_indicator,
  COUNT(*) AS total
FROM brfss_2019;`,
  },
  {
    id: "tbi-prevalence-2018",
    label: "TBI prevalence (2018 module)",
    prompt: "Compute prevalence of reported TBI indicators (OH7_1..OH7_10) in 2018.",
    requiredYears: [2018],
    sql: `SELECT
  SUM(
    CASE WHEN OH7_1 = 1 OR OH7_2 = 1 OR OH7_3 = 1 OR OH7_4 = 1
           OR OH7_5 = 1 OR OH7_6 = 1 OR OH7_10 = 1
      THEN 1 ELSE 0 END
  ) AS tbi_indicated,
  COUNT(*) AS total,
  SUM(
    CASE WHEN OH7_1 = 1 OR OH7_2 = 1 OR OH7_3 = 1 OR OH7_4 = 1
           OR OH7_5 = 1 OR OH7_6 = 1 OR OH7_10 = 1
      THEN 1 ELSE 0 END
  )::DOUBLE / COUNT(*) * 100 AS percent_tbi_indicated
FROM brfss_2018;`,
  },
  {
    id: "tbi-agegroup-2017",
    label: "TBI indicators by age group (2017)",
    prompt: "Break out 2017 TBI indicator responses (OH6_1..OH6_10) by six-level age group (_AGE_G).",
    requiredYears: [2017],
    sql: `SELECT
  _AGE_G AS age_group_code,
  SUM(
    CASE WHEN OH6_1 = 1 OR OH6_2 = 1 OR OH6_3 = 1 OR OH6_4 = 1
           OR OH6_5 = 1 OR OH6_6 = 1 OR OH6_10 = 1
      THEN 1 ELSE 0 END
  ) AS tbi_indicated,
  COUNT(*) AS total,
  SUM(
    CASE WHEN OH6_1 = 1 OR OH6_2 = 1 OR OH6_3 = 1 OR OH6_4 = 1
           OR OH6_5 = 1 OR OH6_6 = 1 OR OH6_10 = 1
      THEN 1 ELSE 0 END
  )::DOUBLE / COUNT(*) * 100 AS percent_tbi_indicated
FROM brfss_2017
GROUP BY 1
ORDER BY 1;`,
  },
  {
    id: "tbi-trend-2016-2018",
    label: "TBI indicator trend 2016-2018",
    prompt: "Trend of TBI indicators across 2016-2018 modules.",
    requiredYears: [2016, 2017, 2018],
    sql: `WITH unioned AS (
  SELECT 2016 AS survey_year,
    CASE WHEN OH7_1 = 1 OR OH7_2 = 1 OR OH7_3 = 1 OR OH7_4 = 1
           OR OH7_5 = 1 OR OH7_6 = 1 OR OH7_10 = 1 THEN 1 ELSE 0 END AS tbi_indicated
  FROM brfss_2016
  UNION ALL
  SELECT 2017,
    CASE WHEN OH6_1 = 1 OR OH6_2 = 1 OR OH6_3 = 1 OR OH6_4 = 1
           OR OH6_5 = 1 OR OH6_6 = 1 OR OH6_10 = 1 THEN 1 ELSE 0 END
  FROM brfss_2017
  UNION ALL
  SELECT 2018,
    CASE WHEN OH7_1 = 1 OR OH7_2 = 1 OR OH7_3 = 1 OR OH7_4 = 1
           OR OH7_5 = 1 OR OH7_6 = 1 OR OH7_10 = 1 THEN 1 ELSE 0 END
  FROM brfss_2018
)
SELECT
  survey_year,
  SUM(tbi_indicated) AS tbi_indicated,
  COUNT(*) AS total,
  SUM(tbi_indicated)::DOUBLE / COUNT(*) * 100 AS percent_tbi_indicated
FROM unioned
GROUP BY 1
ORDER BY survey_year;`,
  },
  {
    id: "tbi-er-trend-2022-2023",
    label: "Head/neck injury ER visit trend (2022 vs 2023)",
    prompt: "Compare counts of respondents ever hospitalized/ER-treated for head/neck injury (OH8_1) between 2022 and 2023.",
    requiredYears: [2022, 2023],
    sql: `WITH unioned AS (
  SELECT 2022 AS survey_year, OH8_1 FROM brfss_2022
  UNION ALL
  SELECT 2023 AS survey_year, OH8_1 FROM brfss_2023
)
SELECT
  survey_year,
  SUM(CASE WHEN OH8_1 = 1 THEN 1 ELSE 0 END) AS ever_hospitalized_head_injury,
  SUM(CASE WHEN OH8_1 = 2 THEN 1 ELSE 0 END) AS never_hospitalized_head_injury,
  COUNT(*) AS total
FROM unioned
GROUP BY 1
ORDER BY survey_year;`,
  },
  {
    id: "general-overweight-2022",
    label: "Overweight/obesity prevalence (2022)",
    prompt: "Percent of 2022 respondents who are overweight or obese (_RFBMI5).",
    requiredYears: [2022],
    sql: `SELECT
  SUM(CASE WHEN _RFBMI5 = 2 THEN 1 ELSE 0 END)::DOUBLE / COUNT(*) * 100 AS percent_overweight_or_obese,
  COUNT(*) AS total
FROM brfss_2022;`,
  },
  {
    id: "general-smoking-status-2022",
    label: "Smoking status distribution (2022)",
    prompt: "Distribution of four-level smoker status (_SMOKER3) for 2022.",
    requiredYears: [2022],
    sql: `SELECT
  _SMOKER3 AS smoker_status_code,
  COUNT(*) AS respondents
FROM brfss_2022
GROUP BY 1
ORDER BY respondents DESC;`,
  },
  {
    id: "general-bmi-category-by-state-2022",
    label: "BMI category by state (2022)",
    prompt: "Break down BMI category (_BMI5CAT) by state for 2022 respondents.",
    requiredYears: [2022],
    sql: `SELECT
  _STATE AS state_fips,
  _BMI5CAT AS bmi_category,
  COUNT(*) AS respondents
FROM brfss_2022
WHERE _BMI5CAT IS NOT NULL
GROUP BY 1, 2
ORDER BY state_fips, bmi_category;`,
  },
  {
    id: "general-income-by-tbi-2022",
    label: "Income distribution for TBI vs non-TBI (2022)",
    prompt: "Show income category (_INCOMG1) distribution split by head/neck injury ER experience (OH8_1) in 2022.",
    requiredYears: [2022],
    sql: `SELECT
  CASE WHEN OH8_1 = 1 THEN 'Ever hospitalized for head/neck injury'
       WHEN OH8_1 = 2 THEN 'Never hospitalized for head/neck injury'
       ELSE 'Unknown'
  END AS tbi_group,
  _INCOMG1 AS income_category,
  COUNT(*) AS respondents
FROM brfss_2022
GROUP BY 1, 2
ORDER BY tbi_group, income_category;`,
  },
];
