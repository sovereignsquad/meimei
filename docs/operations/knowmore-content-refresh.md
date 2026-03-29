# knowmore content refresh (operational)

**Scope:** `/knowmore` catalog cards driven by `config/knowmore-releases.v1.json` and `dashboard/lib/platform-pages/catalog-pages.mjs`. **No** `meimei_jobs` involvement (by design).

## Cadence

1. Update release entries or links in `config/knowmore-releases.v1.json` when shipping meaningful dashboard or miniapp changes operators should discover.
2. Validate JSON (no trailing commas; match existing schema in-repo).
3. Reload dashboard / clear CDN if a reverse proxy caches static JSON (unusual for local dev).

## Ownership

Product/architect updates the file; CI does not gate content freshness. Track staleness in release notes or roadmap when cards drift from reality.
