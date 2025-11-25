# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Roadmap

*   **DarkerDB API Integration:** Investigate and potentially integrate with the DarkerDB API (`https://api.darkerdb.com/`) to pull live item data directly into the guild hub. This could enable features like an item database, tooltips, or market tracking.

    ### API Details (v1.0.7)

    *   **Host:** `https://api.darkerdb.com`
    *   **Health Check:** `GET /v1/health-check`

    #### Authentication
    Requests are authenticated by providing an API key as a query string parameter: `?key=your-api-key`. It is strongly recommended to use an API key for all applications.

    #### Authorization
    Currently, all documented endpoints are public and free to use with no rate limits. However, API keys are recommended as rate limits and user levels will be implemented in the future.

    #### Pagination
    The API supports both cursor-based and page-based pagination.
    *   **Limit:** The number of records per response can be set with `&limit=#` (default: 25, max: 50).
    *   **Cursor Pagination:** Use `&cursor=#` to traverse pages, setting the cursor to the largest cursor value from the previous response. This method is more efficient.
    *   **Page-based Pagination:** Provides total counts and is convenient for smaller datasets.

    All paginated requests include a `pagination` field in the response envelope with metadata and a link to the next page.
