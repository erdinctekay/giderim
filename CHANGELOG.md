# giderim

## 1.0.1

### Patch Changes

- Added redirect handler and improve calendar calculation performance for all-time navigation to take performance back which lost on commit `7c76256`

  This release includes:

  - add redirect handler before bootstrap (`0445b57`)
  - optimized monthly calculations by removing full-range precomputation (`7ece1c6`)
  - reduced unnecessary work during month navigation (`7ece1c6`)

## 1.0.0

### Major Changes

- First release under new maintainer (Erdinc). Fork continued from gider.im by Nedim.

  **Features**

  - Data import: restore from Evolu SQLite backup (.db) with two-phase OPFS import
  - Data export: download database backup from Settings
  - Entry delete: delete entries with confirmation dialog
  - Calendar: year–month picker popover for quick navigation; removed 1-year back/forward limit
  - Sync: custom Evolu server setup (Docker, CORS, optional self-hosted sync)

  **Other**

  - App name changed to giderim (gider.im was the other project’s domain); attribution: Made by Nedim, maintaining by Erdinc
  - App URL and build: VITE_APP_URL required for build (og:url); Netlify redirect config for custom domain
  - Deprecation drawer removed; dependencies and tooling updates

## 0.7.1

### Patch Changes

- c26d15f: fix for calendar navigation

## 0.7.0

### Minor Changes

- 38342f6: UX improvements for add entry screen

## 0.6.0

### Minor Changes

- c5925e4: Private key and restore with private key options added
