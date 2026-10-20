# Next Keepers

Landing page and market-intelligence dashboard for Next Keepers, deal sourcing for acquisition entrepreneurs.

It is a plain static website: HTML, CSS and JavaScript files, no server and no build step.
GitHub Pages serves it directly from this repository.

## What is here

```
index.html                 The landing page
privacy.html               Privacy policy (linked from the form and every footer)
yousef/index.html          Founder page (about Yousef), linked from the landing page footer
assets/
  img/                     Photos used on the landing page
  js/landing.js            Landing page behaviour: role buttons, waitlist form and plan choice, live market numbers
  js/site-config.js        Settings you may change (form address, dashboard gate, locked sections)
  js/vendor/d3.min.js      Charting library (d3 v7), kept here so the site needs no outside CDN
dashboard/
  index.html               The market dashboard page
  dash-runtime.js          Small loader that feeds the dashboard from the JSON files below
  gate.js, gate.css        Email gate and "Searcher plan" locks (see "Free and paid" below)
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

## The waitlist form

The form on the landing page sends each sign-up (email, chosen role, and a `source` tag) to a
Formspree form. The address is `formEndpoint` in `assets/js/site-config.js`. Sign-ups and their
notification emails are managed in the Formspree dashboard, not in this repository.

If `formEndpoint` is empty, the form tells visitors that sign-ups are not open yet, so nobody is
told they are on a list when they are not. To use a different service (Tally, Basin and similar),
paste its address there instead. If you change which data the form collects, update
`privacy.html` to match.

## Free and paid: the dashboard gate and the plans

The pricing cards on the landing page describe three plans: **Explorer** (free), **Searcher**
($99/month) and **Private Network** (by invitation). Paid plans open at launch; nobody is charged
anything today, and the cards say so. Choosing Searcher or Private Network on the landing page puts
the plan on the sign-up, so each entry in Formspree says what the person wants.

What is live now is controlled from `assets/js/site-config.js`:

- `dashboardGate` asks for an email before the dashboard opens (the dashboard stays visible but
  blurred behind the form). The email goes to the same Formspree form, tagged `source: dashboard`.
  The browser remembers a marker, not the email, so returning visitors are not asked again.
- `lockedSections` lists the dashboard sections that show a "Searcher plan" panel instead of
  their content. Today: `sold` and `local`. Use `[]` to make every section free.
- `searcherPrice` is the price quoted on that panel. The pricing cards in `index.html` are written
  by hand, so change the price there as well.

**This is a sign-up step, not security.** A website served from GitHub Pages has no server, so
anything the page can show can also be downloaded: the dashboard's data files are public files in a
public repository. That is fine for collecting emails and signalling plans. It is not enough to
protect data people will pay for. When the paid product (the business database, alerts) launches, it
needs a real back end with logins, and that data must live there, not in this repository.

## Adding another page or section

A single page at the top level (like `privacy.html`) is published automatically. A page in its own
folder (like `yousef/`) must also be added to the `cp -r` line in `.github/workflows/pages.yml`,
otherwise it is not copied into the published site.

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
