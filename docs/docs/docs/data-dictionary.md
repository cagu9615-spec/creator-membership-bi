# Data Dictionary

## Master Join Identifier
- **`email`**: Universal foreign key used to perform `FULL OUTER JOIN` operations across all 5 source systems.

## Substack Dataset (`sample_data/substack_subscribers_dataset.csv`)
- `subscriber_id`: Unique identifier (e.g., `SUB_001`).
- `full_name`: Subscriber name.
- `email`: Universal join key.
- `subscription_tier`: Membership status (`Paid Member`, `Free Subscriber`, `Churned`).
- `open_rate_pct`: Newsletter open percentage.
- `click_rate_pct`: Newsletter link click percentage.
- `signup_date`: Date subscribed (`YYYY-MM-DD`).
- `status`: Account status (`Active`, `Cancelled`, `Unsubscribed`).
- `plan_details`: Plan rate and cadence.

## Ebook Dataset (`sample_data/ebook_sales_dataset.csv`)
- `order_id`: Unique transaction identifier (`EB_1001`).
- `buyer_customer_id`: Internal customer reference.
- `email`: Universal join key.
- `product_title`: Title of digital asset.
- `purchase_date`: Order date (`YYYY-MM-DD`).
- `amount`: Product price in USD.
- `currency`: Currency code (`USD`).
- `transaction_id`: Gateway payment identifier.
