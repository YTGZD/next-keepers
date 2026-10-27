
dash.calc('mine_counties', {
  title: 'Your counties against their metro',
  description: 'Per county: listings, operating businesses, medians for operating businesses (asking, revenue, SDE, asking / SDE) and data completeness, next to the metro\'s latest-quarter listed medians and average cash-flow multiple.',
  inputs: ['listings', 'metrics'],
  fn: (listings, metrics) => {
    const GROUP = { Erie: 'Western NY', Monroe: 'Western NY', Niagara: 'Western NY', Genesee: 'Western NY', Orleans: 'Western NY', Allegany: 'Western NY',
      'New York': 'New York City', Kings: 'New York City', Queens: 'New York City', Bronx: 'New York City', Richmond: 'New York City', Westchester: 'New York City',
      'Suffolk (MA)': 'Boston', Albany: 'Albany' };
    const NYM = 'New York-Northern New Jersey-Long Island, NY-NJ-PA';
    const MKT = { Erie: 'Buffalo-Niagara Falls, NY', Niagara: 'Buffalo-Niagara Falls, NY', Allegany: 'Buffalo-Niagara Falls, NY', Monroe: 'Rochester, NY', Orleans: 'Rochester, NY',
      Genesee: 'Rochester, NY', 'Suffolk (MA)': 'Boston-Cambridge-Quincy, MA-NH', 'New York': NYM, Kings: NYM, Queens: NYM, Bronx: NYM, Richmond: NYM, Westchester: NYM,
      Albany: 'Albany-Schenectady-Troy, NY' };
    const med = (a) => { const s = a.filter((v) => v != null && isFinite(v)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const last = new Map();
    metrics.forEach((m) => { const q = last.get(m.market); if (!q || m.quarter > q.quarter) last.set(m.market, m); });
    const by = new Map();
    listings.forEach((r) => { if (!by.has(r.county)) by.set(r.county, []); by.get(r.county).push(r); });
    return [...by.entries()].map(([county, rows]) => {
      const op = rows.filter((r) => r.operating === 'Yes');
      const pe = op.filter((r) => r.asking > 0 && r.earnings > 0).map((r) => r.asking / r.earnings);
      const m = last.get(MKT[county]) || {};
      const medPe = med(pe);
      const withEarn = rows.filter((r) => r.earnings > 0).length;
      return { county, group: GROUP[county] || 'Other', market: MKT[county] || null, market_short: m.short || null,
        listings: rows.length, operating: op.length, with_earn: withEarn, earn_share: rows.length ? withEarn / rows.length : null,
        med_ask: med(op.map((r) => r.asking)), med_rev: med(op.map((r) => r.revenue)), med_earn: med(op.filter((r) => r.earnings > 0).map((r) => r.earnings)),
        med_pe: medPe, n_pe: pe.length, mkt_ask: m.ask ?? null, mkt_cf: m.cf ?? null, mkt_pe: m.cfx ?? null, mkt_quarter: m.quarter || null,
        pe_gap: medPe != null && m.cfx ? (medPe / m.cfx - 1) * 100 : null,
        page_share: rows.length ? rows.filter((r) => !(r.flags || '').includes('CARD_ONLY')).length / rows.length : null,
        review: rows.filter((r) => r.needs_review === 'Yes').length, out_area: rows.filter((r) => (r.flags || '').includes('OUT_OF_COUNTY')).length };
    });
  }
});

dash.calc('mine_groups', {
  title: 'Your listings by region',
  description: 'Western NY, New York City, Albany, Boston and all together: listings, counties, operating businesses, how many show earnings, and medians for operating businesses.',
  inputs: ['listings'],
  fn: (listings) => {
    const GROUP = { Erie: 'Western NY', Monroe: 'Western NY', Niagara: 'Western NY', Genesee: 'Western NY', Orleans: 'Western NY', Allegany: 'Western NY',
      'New York': 'New York City', Kings: 'New York City', Queens: 'New York City', Bronx: 'New York City', Richmond: 'New York City', Westchester: 'New York City',
      'Suffolk (MA)': 'Boston', Albany: 'Albany' };
    const med = (a) => { const s = a.filter((v) => v != null && isFinite(v)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    return ['All', 'Western NY', 'New York City', 'Albany', 'Boston'].map((group) => {
      const rows = group === 'All' ? listings : listings.filter((r) => GROUP[r.county] === group);
      const op = rows.filter((r) => r.operating === 'Yes');
      const pe = op.filter((r) => r.asking > 0 && r.earnings > 0).map((r) => r.asking / r.earnings);
      const withEarn = rows.filter((r) => r.earnings > 0).length;
      return { group, listings: rows.length, counties: new Set(rows.map((r) => r.county)).size, operating: op.length, with_earn: withEarn,
        earn_share: rows.length ? withEarn / rows.length : null, med_ask: med(op.map((r) => r.asking)), med_rev: med(op.map((r) => r.revenue)),
        med_earn: med(op.filter((r) => r.earnings > 0).map((r) => r.earnings)), med_pe: med(pe), n_pe: pe.length };
    });
  }
});

dash.calc('mine_industries', {
  title: 'Your listings by industry',
  description: 'For each region (and all together): listings per industry, how many show earnings, and the median asking price and price / earnings of operating businesses.',
  inputs: ['listings'],
  fn: (listings) => {
    const GROUP = { Erie: 'Western NY', Monroe: 'Western NY', Niagara: 'Western NY', Genesee: 'Western NY', Orleans: 'Western NY', Allegany: 'Western NY',
      'New York': 'New York City', Kings: 'New York City', Queens: 'New York City', Bronx: 'New York City', Richmond: 'New York City', Westchester: 'New York City',
      'Suffolk (MA)': 'Boston', Albany: 'Albany' };
    const med = (a) => { const s = a.filter((v) => v != null && isFinite(v)).sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    const out = [];
    ['All', 'Western NY', 'New York City', 'Albany', 'Boston'].forEach((group) => {
      const rows = group === 'All' ? listings : listings.filter((r) => GROUP[r.county] === group);
      const by = new Map();
      rows.forEach((r) => { const k = r.industry || 'Unclassified'; if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
      by.forEach((v, industry) => {
        const op = v.filter((r) => r.operating === 'Yes');
        const pe = op.filter((r) => r.asking > 0 && r.earnings > 0).map((r) => r.asking / r.earnings);
        out.push({ key: group + '|' + industry, group, industry, listings: v.length, with_earn: v.filter((r) => r.earnings > 0).length,
          med_ask: med(op.map((r) => r.asking)), med_pe: med(pe), n_pe: pe.length });
      });
    });
    return out;
  }
});

(() => {
  const $ = (q) => document.querySelector(q);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const usdS = (n) => (n == null || !isFinite(n) ? '—' : '$' + d3.format('.3~s')(n).replace('G', 'B'));
  const x2 = (n) => (n == null || !isFinite(n) ? '—' : n.toFixed(2) + '×');
  const int = (n) => (n == null ? '—' : d3.format(',')(n));
  const pctS = (v) => (v == null || !isFinite(v) ? '—' : Math.round(v * 100) + '%');
  const gap = (v) => (v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(0) + '%');
  const SHOWN = { 'New York': 'New York (Manhattan)', Kings: 'Kings (Brooklyn)', Richmond: 'Richmond (Staten Island)', 'Suffolk (MA)': 'Suffolk, MA (Boston)' };
  const nameOf = (c) => SHOWN[c] || c;
  const GC = { 'Western NY': 'var(--nk-c0)', 'New York City': 'var(--nk-c1)', Albany: 'var(--nk-c5)', Boston: 'var(--nk-c3)' };
  const GROUPS = ['Western NY', 'New York City', 'Albany', 'Boston'];
  const COUNTY_GROUP = { 'Suffolk (MA)': 'Boston', 'New York': 'New York City', Kings: 'New York City', Queens: 'New York City', Bronx: 'New York City', Richmond: 'New York City', Westchester: 'New York City', Albany: 'Albany' };
  const groupOf = (c) => COUNTY_GROUP[c] || 'Western NY';
  const grp = () => (['All', ...GROUPS].includes(dash.params().mg) ? dash.params().mg : 'All');
  const st = { sort: 'listings', dir: -1 };

  // page switching shares the page param with the other tabs
  $('#tab-mine').addEventListener('click', () => { dash.setParams({ page: 'mine' }); dash.setLink('pg-mine'); });
  if (location.hash.slice(1).startsWith('pg-mine') || location.hash.slice(1).startsWith('mn-')) dash.setParams({ page: 'mine' });
  $('#mn-seg').addEventListener('click', (e) => { const b = e.target.closest('button[data-g]'); if (b) { dash.setParams({ mg: b.dataset.g }); dash.setLink('mn-glance'); } });
  document.querySelectorAll('#mn-tbl-cty th button').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.msort; if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = ['county', 'group', 'market'].includes(k) ? 1 : -1; }
    drawCountyTable();
  }));

  function legend(host, items) {
    host.replaceChildren(...items.map(([label, color, tick]) => { const s = el('span'); const i = el('i'); i.style.background = color; if (tick) { i.style.width = '3px'; i.style.height = '.75rem'; } s.append(i, label); return s; }));
  }
  function tipAt(host, tip, ev) {
    const b = host.getBoundingClientRect(); const tw = tip.offsetWidth, th = tip.offsetHeight;
    let x = ev.clientX - b.left + 12, y = ev.clientY - b.top + 12;
    if (x + tw > b.width) x = Math.max(0, ev.clientX - b.left - tw - 12);
    if (y + th > b.height) y = Math.max(0, ev.clientY - b.top - th - 12);
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  function fillTip(tip, title, rows) {
    tip.replaceChildren(el('div', 't', title));
    rows.forEach(([k, v, c]) => { const r = el('div', 'r'); if (c) { const i = el('i'); i.style.background = c; r.append(i); } r.append(el('span', null, k), el('b', null, v)); tip.appendChild(r); });
  }

  function drawGlance() {
    const g = grp();
    document.querySelectorAll('#mn-seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === g)));
    $('#mn-glance-h').textContent = g === 'All' ? 'At a glance: all regions' : 'At a glance: ' + g;
    const d = dash.data('mine_groups');
    const row = d.status === 'ok' ? d.data.find((r) => r.group === g) : null;
    const F = { listings: int, counties: int, operating: int, with_earn: int, n_pe: int, earn_share: pctS, med_ask: usdS, med_rev: usdS, med_earn: usdS, med_pe: x2 };
    document.querySelectorAll('#mn-glance .mn-k').forEach((n) => { n.setAttribute('data-where', 'group=' + g); n.textContent = row ? F[n.dataset.k](row[n.dataset.k]) : '—'; });
    const t = (id, grpName, k, f) => { const r = d.status === 'ok' ? d.data.find((x) => x.group === grpName) : null; $(id).textContent = r ? f(r[k]) : '—'; };
    t('#mn-t-n', 'All', 'listings', int); t('#mn-t-c', 'All', 'counties', int); t('#mn-t-op', 'All', 'operating', int);
    t('#mn-t-nyc', 'New York City', 'med_pe', x2); t('#mn-t-wny', 'Western NY', 'med_pe', x2); t('#mn-t-alb', 'Albany', 'med_pe', x2); t('#mn-t-bos', 'Boston', 'med_pe', x2);
  }

  function countyRows() {
    const d = dash.data('mine_counties'); if (d.status !== 'ok') return null;
    const g = grp(); return d.data.filter((r) => g === 'All' || r.group === g);
  }

  function drawCountyChart() {
    const host = $('#mn-ch-cty');
    const rows = countyRows();
    host.replaceChildren();
    if (!rows) return;
    host.classList.remove('dash-skeleton');
    const pts = rows.filter((r) => r.med_pe != null).sort((a, b) => a.med_pe - b.med_pe);
    legend($('#mn-lg-cty'), [...GROUPS.filter((gName) => pts.some((r) => r.group === gName)).map((gName) => [gName, GC[gName]]), ['Metro average, listed in the latest quarter (tick)', 'var(--color-fg-muted)', true]]);
    if (!pts.length) { host.append(el('p', 'lx-note', 'No county in this region has a listing that shows earnings.')); return; }
    const W = Math.max(300, host.clientWidth), rowH = 26, top = 6, bottom = 26;
    const H = top + bottom + pts.length * rowH;
    const svg = d3.select(host).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Median price to earnings by county against its metro');
    const probe = svg.append('text').attr('class', 'lx-tick');
    let lw = 0; pts.forEach((r) => { probe.text(nameOf(r.county)); lw = Math.max(lw, probe.node().getComputedTextLength()); }); probe.remove();
    const ml = Math.min(W * 0.42, Math.ceil(lw) + 14), mr = 54;
    const max = d3.max(pts, (r) => Math.max(r.med_pe, r.mkt_pe || 0)) * 1.08;
    const x = d3.scaleLinear([0, max], [ml, W - mr]).nice();
    x.ticks(6).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', top).attr('y2', H - bottom).style('stroke', 'var(--cds-chart-grid)');
      svg.append('text').attr('class', 'lx-tick').attr('x', x(t)).attr('y', H - 8).attr('text-anchor', 'middle').style('fill', 'var(--color-fg-muted)').text(t + '×');
    });
    host.style.position = 'relative';
    const tip = el('div', 'lx-tip'); tip.hidden = true; host.appendChild(tip);
    pts.forEach((r, i) => {
      const y = top + i * rowH + rowH / 2;
      const below = r.mkt_pe != null && r.med_pe <= r.mkt_pe;
      const lineCol = r.mkt_pe == null ? 'var(--color-fg-muted)' : below ? 'var(--color-ok)' : 'var(--color-warn)';
      svg.append('text').attr('class', 'lx-tick').attr('x', ml - 8).attr('y', y).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg)').text(nameOf(r.county));
      if (r.mkt_pe != null) {
        svg.append('line').attr('x1', x(r.mkt_pe)).attr('x2', x(r.med_pe)).attr('y1', y).attr('y2', y).style('stroke', lineCol).attr('stroke-width', 2).attr('stroke-linecap', 'round');
        svg.append('line').attr('x1', x(r.mkt_pe)).attr('x2', x(r.mkt_pe)).attr('y1', y - 7).attr('y2', y + 7).style('stroke', 'var(--color-fg-muted)').attr('stroke-width', 2);
      }
      svg.append('circle').attr('cx', x(r.med_pe)).attr('cy', y).attr('r', 5.5).style('fill', GC[r.group] || 'var(--color-fg)');
      svg.append('text').attr('class', 'lx-tick').attr('x', W - mr + 8).attr('y', y).attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg-muted)').text(gap(r.pe_gap));
      svg.append('rect').attr('x', 0).attr('y', y - rowH / 2).attr('width', W).attr('height', rowH).attr('fill', 'transparent')
        .on('mousemove', (ev) => {
          fillTip(tip, nameOf(r.county) + ' · ' + r.group, [['Median price / SDE', x2(r.med_pe) + ' (' + int(r.n_pe) + ' listings)'], [(r.market_short || 'Metro') + ' listed average', x2(r.mkt_pe)],
            ['Difference', gap(r.pe_gap)], ['Median asking', usdS(r.med_ask)], ['Median SDE', usdS(r.med_earn)]]);
          tip.hidden = false; tipAt(host, tip, ev);
        })
        .on('mouseleave', () => { tip.hidden = true; });
    });
  }

  function drawCountyTable() {
    const rows = countyRows(); const body = $('#mn-tbl-cty tbody');
    if (!rows) { body.replaceChildren(); return; }
    const k = st.sort, dir = st.dir;
    const sorted = rows.slice().sort((a, b) => { const x = a[k], y = b[k]; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
    body.replaceChildren(...sorted.map((r) => {
      const tr = el('tr'); tr.dataset.key = r.county;
      const g = el('td', r.pe_gap == null ? 'muted' : r.pe_gap <= -10 ? 'good' : r.pe_gap >= 10 ? 'warn' : '', gap(r.pe_gap));
      tr.append(el('td', null, nameOf(r.county)), el('td', 'muted', r.group), el('td', null, int(r.listings)), el('td', null, int(r.operating)),
        el('td', null, usdS(r.med_ask)), el('td', 'muted', usdS(r.mkt_ask)), el('td', null, usdS(r.med_earn)), el('td', null, x2(r.med_pe)),
        el('td', 'muted', x2(r.mkt_pe)), g, el('td', 'muted', r.market_short || ''));
      return tr;
    }));
    document.querySelectorAll('#mn-tbl-cty th').forEach((th) => th.setAttribute('aria-sort', th.dataset.field === k ? (dir > 0 ? 'ascending' : 'descending') : 'none'));
  }

  function drawQuality() {
    const rows = countyRows(); const body = $('#mn-tbl-q tbody');
    if (!rows) { body.replaceChildren(); return; }
    body.replaceChildren(...rows.slice().sort((a, b) => b.listings - a.listings).map((r) => {
      const tr = el('tr'); tr.dataset.key = r.county;
      tr.append(el('td', null, nameOf(r.county)), el('td', null, int(r.listings)), el('td', r.page_share < 0.9 ? 'warn' : null, pctS(r.page_share)),
        el('td', r.earn_share < 0.4 ? 'warn' : null, pctS(r.earn_share)), el('td', null, int(r.review)), el('td', r.out_area ? 'warn' : 'muted', int(r.out_area)));
      return tr;
    }));
  }

  function drawIndustries() {
    const host = $('#mn-ch-ind');
    const d = dash.data('mine_industries');
    host.replaceChildren();
    if (d.status !== 'ok') return;
    host.classList.remove('dash-skeleton');
    const g = grp();
    $('#mn-ind-h').textContent = 'What is for sale, by industry' + (g === 'All' ? '' : ': ' + g);
    const rows = d.data.filter((r) => r.group === g).sort((a, b) => b.listings - a.listings);
    if (!rows.length) { host.append(el('p', 'lx-note', 'No listings in this region.')); return; }
    const W = Math.max(300, host.clientWidth), rowH = 24, top = 4, bottom = 6;
    const H = top + bottom + rows.length * rowH;
    const svg = d3.select(host).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Listings by industry');
    const probe = svg.append('text').attr('class', 'lx-tick');
    let lw = 0; rows.forEach((r) => { probe.text(r.industry); lw = Math.max(lw, probe.node().getComputedTextLength()); }); probe.remove();
    const ml = Math.min(W * 0.42, Math.ceil(lw) + 14), mr = 96;
    const x = d3.scaleLinear([0, d3.max(rows, (r) => r.listings)], [ml, W - mr]);
    const col = g === 'All' ? 'var(--nk-c0)' : GC[g];
    host.style.position = 'relative';
    const tip = el('div', 'lx-tip'); tip.hidden = true; host.appendChild(tip);
    rows.forEach((r, i) => {
      const y = top + i * rowH;
      svg.append('text').attr('class', 'lx-tick').attr('x', ml - 8).attr('y', y + rowH / 2).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg)').text(r.industry);
      svg.append('rect').attr('x', ml).attr('y', y + 4).attr('width', Math.max(1, x(r.listings) - ml)).attr('height', rowH - 8).attr('rx', 3).style('fill', col);
      svg.append('text').attr('class', 'lx-tick').attr('x', x(r.listings) + 6).attr('y', y + rowH / 2).attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg)')
        .text(int(r.listings) + (r.med_pe != null ? '  ·  ' + x2(r.med_pe) : ''));
      svg.append('rect').attr('x', 0).attr('y', y).attr('width', W).attr('height', rowH).attr('fill', 'transparent')
        .on('mousemove', (ev) => {
          fillTip(tip, r.industry + (g === 'All' ? '' : ' · ' + g), [['Listings', int(r.listings)], ['Show earnings', int(r.with_earn)], ['Median asking (operating)', usdS(r.med_ask)],
            ['Median price / SDE', r.med_pe != null ? x2(r.med_pe) + ' (' + int(r.n_pe) + ')' : '—']]);
          tip.hidden = false; tipAt(host, tip, ev);
        })
        .on('mouseleave', () => { tip.hidden = true; });
    });
  }

  function drawScatter() {
    const host = $('#mn-ch-sc');
    const d = dash.data('listings');
    host.replaceChildren();
    if (d.status !== 'ok') return;
    host.classList.remove('dash-skeleton');
    const g = grp();
    const pts = d.data.filter((r) => r.operating === 'Yes' && r.asking > 0 && r.earnings > 0 && (g === 'All' || groupOf(r.county) === g))
      .map((r) => ({ r, grp: groupOf(r.county), m: r.asking / r.earnings }));
    legend($('#mn-lg-sc'), GROUPS.filter((gName) => pts.some((p) => p.grp === gName)).map((gName) => [gName + ' (' + int(pts.filter((p) => p.grp === gName).length) + ')', GC[gName]]));
    if (!pts.length) { host.append(el('p', 'lx-note', 'No operating business in this region shows both a price and earnings.')); return; }
    const W = Math.max(300, host.clientWidth), H = Math.min(460, Math.max(280, W * 0.55)), ml = 56, mr = 40, mt = 10, mb = 34;
    const ex = d3.extent(pts, (p) => p.r.earnings), ey = d3.extent(pts, (p) => p.r.asking);
    const x = d3.scaleLog([Math.max(5000, ex[0] * 0.8), ex[1] * 1.2], [ml, W - mr]);
    const y = d3.scaleLog([Math.max(5000, ey[0] * 0.8), ey[1] * 1.2], [H - mb, mt]);
    const svg = d3.select(host).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Asking price against earnings, log scales');
    const tk = (s, n) => s.ticks(n).filter((t) => /^[125]/.test(String(t)));
    tk(x, 8).forEach((t) => {
      svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', mt).attr('y2', H - mb).style('stroke', 'var(--cds-chart-grid)');
      svg.append('text').attr('class', 'lx-tick').attr('x', x(t)).attr('y', H - 12).attr('text-anchor', 'middle').style('fill', 'var(--color-fg-muted)').text(usdS(t));
    });
    tk(y, 8).forEach((t) => {
      svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', y(t)).attr('y2', y(t)).style('stroke', 'var(--cds-chart-grid)');
      svg.append('text').attr('class', 'lx-tick').attr('x', ml - 6).attr('y', y(t)).attr('text-anchor', 'end').attr('dominant-baseline', 'middle').style('fill', 'var(--color-fg-muted)').text(usdS(t));
    });
    svg.append('text').attr('class', 'lx-tick').attr('x', W - mr).attr('y', H - 1).attr('text-anchor', 'end').style('fill', 'var(--color-fg-muted)').text('Earnings (SDE) →');
    svg.append('text').attr('class', 'lx-tick').attr('x', 4).attr('y', mt + 2).attr('dominant-baseline', 'hanging').style('fill', 'var(--color-fg-muted)').text('↑ Asking');
    const [x0, x1] = x.domain(), [y0, y1] = y.domain();
    [2, 3, 4].forEach((k) => {
      const a = Math.max(x0, y0 / k), b = Math.min(x1, y1 / k);
      if (a >= b) return;
      svg.append('line').attr('x1', x(a)).attr('y1', y(a * k)).attr('x2', x(b)).attr('y2', y(b * k)).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '4 4').attr('stroke-width', 1);
      svg.append('text').attr('class', 'lx-tick').attr('x', x(b) + 4).attr('y', y(b * k)).attr('dominant-baseline', 'middle').style('fill', 'var(--cds-chart-reference)').text(k + '×');
    });
    host.style.position = 'relative';
    const tip = el('div', 'lx-tip'); tip.hidden = true; host.appendChild(tip);
    const order = ['New York City', 'Western NY', 'Albany', 'Boston'];
    pts.sort((a, b) => order.indexOf(a.grp) - order.indexOf(b.grp)).forEach((p) => {
      svg.append('circle').attr('cx', x(p.r.earnings)).attr('cy', y(p.r.asking)).attr('r', 3.6).style('fill', GC[p.grp]).style('fill-opacity', 0.72)
        .style('stroke', 'var(--color-panel)').attr('stroke-width', 0.6)
        .on('mouseenter', function (ev) {
          d3.select(this).attr('r', 6).style('fill-opacity', 1);
          fillTip(tip, p.r.title, [['County', nameOf(p.r.county) + (p.r.city ? ' · ' + p.r.city : ''), GC[p.grp]], ['Industry', p.r.industry || '—'], ['Asking', usdS(p.r.asking)], ['Earnings', usdS(p.r.earnings)], ['Price / earnings', x2(p.m)]]);
          tip.hidden = false; tipAt(host, tip, ev);
        })
        .on('mousemove', (ev) => tipAt(host, tip, ev))
        .on('mouseleave', function () { d3.select(this).attr('r', 3.6).style('fill-opacity', 0.72); tip.hidden = true; });
    });
  }

  dash.onData(() => {
    const on = dash.params().page === 'mine';
    $('#pg-mine').hidden = !on;
    $('#tab-mine').setAttribute('aria-selected', String(on));
    if (!on) return;
    drawGlance(); drawCountyChart(); drawCountyTable(); drawIndustries(); drawScatter(); drawQuality();
  });
})();
