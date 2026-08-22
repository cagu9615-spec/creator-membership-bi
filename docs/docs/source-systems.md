# Source Systems Mapping

| Platform | Data Domain | Primary Key | Join Key | Connection Method |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe** | Subscriptions, One-time Payments | `customer_id` | `email` | REST API (Test Mode) |
| **Shopify** | Physical Merch & Book Orders | `order_id` | `email` | REST API (Dev Store) |
| **Calendly** | Consulting & Strategy Bookings | `event_uuid` | `email` | REST API v2 |
| **Substack** | Newsletter Tiers & Engagement Rates | `subscriber_id` | `email` | CSV / Google Sheets |
| **Ebook Sales** | Digital Product Transactions | `order_id` | `email` | CSV Import |
