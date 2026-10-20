# Next Keepers

Landing page and market-intelligence dashboard for Next Keepers, deal sourcing for acquisition entrepreneurs.

It is a plain static website: HTML, CSS and JavaScript files, no server and no build step.
GitHub Pages serves it directly from this repository.

## What is here

```
index.html                 The landing page
assets/
  img/                     Photos used on the landing page
  js/landing.js            Landing page behaviour: role buttons, waitlist form, live market numbers
  js/site-config.js        Settings you may change (the waitlist form address)
  js/vendor/d3.min.js      Charting library (d3 v7), kept here so the site needs no outside CDN
dashboard/
  index.html               The market dashboard page
  dash-runtime.js          Small loader that feeds the dashboard from the JSON files below
  mine.js                  Code for the "Your listings" tab (switched off in the public site)
  data/*.json              The dashboard's data, one file per table
.github/workflows/pages.yml   Publishes the site on every push to main
```

## How the pieces connect

The landing page and the dashboard read the **same** files in `dashboard/data/`.
The four numbers in the "market right now" section of the landing page are computed live from
`metrics.json` and `sba_states.json`, and each tile links to the matching dashboard section
(for example `dashboard/?cat=financing`). Update the data once and both pages change.

## Run it on your computer

Browsers block file loading from `file://` pages, so serve the folder:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 (landing page) and http://localhost:8000/dashboard/ (dashboard).

## Publish

Push to the `main` branch. The workflow in `.github/workflows/pages.yml` checks the data and
publishes the site. Progress shows in the repo's **Actions** tab, and the address appears there when it finishes.
One-time setting: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Update the dashboard data

Each file in `dashboard/data/` is a JSON array of rows (one object per row). To refresh a table,
replace its file with the new rows, using the same column names, and push. The workflow rejects
files that are not valid JSON.

To add a new table, drop `<name>.json` in `dashboard/data/` and read it in the page with
`dash.data('<name>')`.

## Turn on the waitlist form

The form on the landing page does not store anything until it is connected to a form service.
Create a free form (Formspree, Tally, Basin or similar), copy its address, and put it in
`assets/js/site-config.js` as `formEndpoint`. Until then the form tells visitors that sign-ups
are not open yet, so nobody is told they are on a list when they are not.

## Private data

The dashboard's "Your listings" and "Deal finder" tabs run on individual marketplace listings
(titles, prices and links from BizBuySell). That file, `dashboard/data/listings.json`, is **not**
in this repository and is blocked from being committed (`.gitignore`) or published (the workflow
stops if it finds it). The tabs are hidden by the `public-mode` block in `dashboard/index.html`.
Marketplace listings are usually not licensed for republishing, so keep that file in a private place.

## Data sources

BizBuySell Insight Reports (active listings, sold deals, multiples), SBA 7(a) loan data,
U.S. Census Bureau (population estimates, building permits, County Business Patterns),
SBA Office of Advocacy small-business profiles.
