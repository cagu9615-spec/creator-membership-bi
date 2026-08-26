-- Staging Substack
CREATE OR REPLACE TABLE `creator_staging.stg_substack` AS
SELECT
  LOWER(TRIM(email)) AS email,
  subscriber_id,
  subscription_tier,
  status,
  SAFE_CAST(signup_date AS TIMESTAMP) AS signup_date
FROM `creator_raw.raw_substack`
WHERE email IS NOT NULL;

-- Staging Ebook Sales
CREATE OR REPLACE TABLE `creator_staging.stg_ebook` AS
SELECT
  LOWER(TRIM(email)) AS email,
  order_id,
  product_title,
  SAFE_CAST(amount AS NUMERIC) AS amount,
  SAFE_CAST(purchase_date AS TIMESTAMP) AS purchase_date
FROM `creator_raw.raw_ebook`
WHERE email IS NOT NULL;
