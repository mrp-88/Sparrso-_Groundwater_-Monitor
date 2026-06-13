# Bangladesh Groundwater Monitor 💧

**Satellite-based groundwater storage (GWS) monitoring for all 64 districts of Bangladesh, validated against the BWDB in-situ well network.**

A single-page, dependency-light web app that visualises NASA GRACE / GRACE-FO total-water-storage anomalies combined with GLDAS-2.2 land-surface model outputs to estimate groundwater storage change (2003–2025), with Sen's slope, Mann–Kendall and OLS regression diagnostics — and an independent ground-truth **Validation** layer built from **217 Bangladesh Water Development Board (BWDB) monitoring wells** (1990 vs 2025).

> Built at SPARRSO / BUP by **Mashiyat Raunaq Preetom**. Open-source, non-commercial, academic use.

---

## Live demo

Once published to GitHub Pages, the app is served straight from `index.html` at:

```
https://<your-username>.github.io/<repo-name>/
```

See [Publishing to GitHub Pages](#publishing-to-github-pages) below.

---

## What's in this app

| Tab | Contents |
|-----|----------|
| **Map View** | Interactive Leaflet map with IDW-interpolated raster layers (GWS / TWS trends and anomalies, soil moisture, precipitation, cumulative ΔGWS), district clipping, basemap and opacity controls. |
| **Overview** | Per-district KPI cards, water-balance decomposition chart, and Bangladesh hydrological-driver context. |
| **Time Series** | Monthly / annual GWS, TWS and soil-moisture curves with OLS overlays. |
| **Factors** | Pearson correlation of GWS against each water-balance component. |
| **Rankings** | All 64 districts ranked by GWS trend. |
| **Validation** | **BWDB in-situ well network** — well-point map coloured by 35-year decline rate, observed-vs-satellite per-district comparison, national monthly DBGL curve (1990 vs 2025), and seasonal comparison. |
| **GEE Code** | The full Google Earth Engine script used to generate the satellite layers. |

### Administrative correctness

Bangladesh has **8 administrative divisions and 64 districts**. This build fixes two common errors:

- **Mymensingh Division** (created 2015 from four northern Dhaka-division districts) is now a separate division: *Jamalpur, Mymensingh, Netrokona, Sherpur*.
- **Bagerhat** is placed in **Khulna** Division (not Barishal).

Division totals: Barishal 6 · Chattogram 11 · Dhaka 13 · Khulna 10 · Mymensingh 4 · Rajshahi 8 · Rangpur 8 · Sylhet 4 = **64**.

---

## Validation data (BWDB)

The Validation tab uses **real, observed** groundwater data — not the satellite estimate.

- **Source:** Bangladesh Water Development Board (BWDB), Hydroinformatics & Flood Forecasting Circle, Dhaka.
- **Coverage:** 217 monitoring wells across 26 districts.
- **Period:** calendar years **1990 and 2025** (Δt = 35 years); 10,007 + 10,457 weekly readings.
- **Metric:** Depth Below Ground Level (DBGL, m); a *rising* DBGL / *positive* decline rate (mm/yr) indicates aquifer depletion.

The comparison panel checks **direction agreement** between observed water-table decline and the satellite GWS slope. The satellite column currently shows this build's synthetic demo values; replace them with the real GEE export (see below) to compute a quantitative skill score (e.g. Spearman ρ, RMSE).

Extracted data lives in [`/data`](data/):

- `bwdb_validation.json` — the dataset embedded in the app (districts, wells, monthly & seasonal curves).
- `district_trends.csv` — district-level 35-year depletion summary.
- `well_points.csv` — per-well coordinates, DBGL, Δ and decline rate.
- `BWDB_GW_1990_2025_Validation_Workbook.xlsx` — the original source workbook.

---

## Replacing the synthetic satellite layer with real data

The dashboard ships with a **deterministic synthetic generator** so it works offline with no setup. To use real GRACE/GLDAS values:

1. Open [`gee/grace_gldas_gws.js`](gee/grace_gldas_gws.js) in the [Google Earth Engine Code Editor](https://code.earthengine.google.com).
2. Run it and export `BD_GWS_SensSlope_2003_2025` (per-district Sen's slope) as CSV to Drive.
3. Replace the synthetic `gd()` generator in `index.html` (search for `SYNTHETIC DATA GENERATOR`) with values parsed from your CSV, or load the CSV at runtime.

---

## Run locally

No build step — it's a single static file. Any static server works:

```bash
# Python
python3 -m http.server 8000
# then open http://localhost:8000

# or Node
npx serve .
```

Opening `index.html` directly via `file://` also works (React, Leaflet and the data are all inline / from CDN).

---

## Publishing to GitHub Pages

**Option A — Settings (no Actions):**
1. Push this folder to a GitHub repository.
2. Repo → **Settings → Pages**.
3. **Source:** *Deploy from a branch* → branch `main`, folder `/ (root)` → **Save**.
4. Your site goes live at `https://<user>.github.io/<repo>/` in a minute or two.

**Option B — GitHub Actions:** this repo includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which publishes on every push to `main`. Just enable Pages → **Source: GitHub Actions**.

The included `.nojekyll` file tells GitHub Pages to serve files as-is (no Jekyll processing).

---

## Tech stack

- **React 18** + **Leaflet 1.9** (loaded from CDN) — no bundler, no `npm install`.
- Pure inline SVG charts (no charting dependency).
- **Google Earth Engine** for the satellite pipeline.

## Data & methodology sources

- NASA **GRACE / GRACE-FO** CSR RL06 Mascon v02 — total water storage anomalies.
- NASA **GLDAS-2.2 CLSM v2.5** (GRACE-DA) — soil moisture, SWE, canopy, surface water.
- **FAO GAUL 2015** Level 2 — administrative boundaries.
- **BWDB** — in-situ groundwater levels (validation).
- Water-balance framework after Ouyang et al. (2024): ΔGWS = ΔTWS − ΔSM − ΔSWE − ΔCAN − ΔSW.

## License

Released under the [MIT License](LICENSE). © 2026 Mashiyat Raunaq Preetom.

The BWDB groundwater data is the property of the Bangladesh Water Development Board and is included here for academic validation; cite BWDB when reusing it.
