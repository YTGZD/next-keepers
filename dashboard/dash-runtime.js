/*
 * dash-runtime.js
 *
 * The dashboard was designed inside claude.ai, where a built-in "dash" object
 * supplies its data. Out on GitHub Pages that object does not exist, so this
 * file is a small stand-in with the same six functions the page already uses:
 *
 *   dash.data(id)       -> { status, data, message }  (reads ./data/<id>.json)
 *   dash.calc(id, def)  -> a value worked out from one or more datasets
 *   dash.onData(fn)     -> run fn now, and again whenever data, params or width change
 *   dash.params()       -> the current filters (kept in the page URL, so links are shareable)
 *   dash.setParams(o)   -> change filters
 *   dash.setLink(name)  -> scroll to a section
 *
 * To add a dataset: drop <name>.json into ./data/ (an array of row objects)
 * and read it in the page with dash.data('<name>').
 */
(function () {
  'use strict';

  var DATA_DIR = 'data/';
  var sources = {};     // dataset id -> { status, data, message }
  var calcs = {};       // calc id    -> { inputs, fn, cache }
  var listeners = [];
  var params = readParams();
  var queued = false;

  /* ---------- filters live in the URL query string ---------- */
  function readParams() {
    var out = {};
    new URLSearchParams(location.search).forEach(function (v, k) { out[k] = v; });
    return out;
  }
  function writeParams() {
    var q = new URLSearchParams();
    Object.keys(params).forEach(function (k) { q.set(k, params[k]); });
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  /* ---------- datasets: one JSON file each, fetched the first time it is read ---------- */
  function load(id) {
    if (sources[id]) return sources[id];
    if ((window.DASH_SKIP || []).indexOf(id) !== -1) return (sources[id] = { status: 'missing', data: [], message: 'not published' });
    var entry = sources[id] = { status: 'loading', data: [], message: '' };
    fetch(DATA_DIR + id + '.json')
      .then(function (r) {
        if (!r.ok) { var e = new Error('HTTP ' + r.status); e.http = r.status; throw e; }
        return r.json();
      })
      .then(function (rows) { entry.data = rows; entry.status = 'ok'; })
      .catch(function (err) {
        entry.status = err.http === 404 ? 'missing' : 'error';
        entry.message = err.message;
      })
      .then(queueNotify);
    return entry;
  }

  /* ---------- calcs: derived tables, recomputed only when their inputs change ---------- */
  function runCalc(id) {
    var c = calcs[id];
    var ins = c.inputs.map(entryFor);
    var bad = ins.filter(function (e) { return e.status !== 'ok'; })[0];
    if (bad) return { status: bad.status, data: [], message: bad.message || '' };
    var same = c.cache && c.cache.args.length === ins.length &&
      c.cache.args.every(function (a, i) { return a === ins[i].data; });
    if (same) return c.cache.out;
    var out;
    try { out = { status: 'ok', data: c.fn.apply(null, ins.map(function (e) { return e.data; })), message: '' }; }
    catch (err) { console.error('calc "' + id + '" failed:', err); out = { status: 'error', data: [], message: String(err.message || err) }; }
    c.cache = { args: ins.map(function (e) { return e.data; }), out: out };
    return out;
  }
  function entryFor(id) { return calcs[id] ? runCalc(id) : load(id); }

  /* ---------- re-render notifications ---------- */
  function notifyNow() {
    listeners.slice().forEach(function (fn) {
      try { fn(); } catch (err) { console.error(err); }
    });
  }
  function queueNotify() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; notifyNow(); });
  }
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(notifyNow, 150);
  });

  /* ---------- the public object ---------- */
  window.dash = {
    data: function (id) {
      var e = entryFor(id);
      // .rows and .value are older names the page may still use
      return { status: e.status, data: e.data, rows: e.data, value: e.data, message: e.message, refreshing: false, meta: [] };
    },
    calc: function (id, def) { calcs[id] = { inputs: def.inputs || [], fn: def.fn, cache: null }; },
    loader: function () { /* not needed: the JSON files are already tables */ },
    onData: function (fn) {
      listeners.push(fn);
      try { fn(); } catch (err) { console.error(err); }
    },
    params: function () { return Object.assign({}, params); },
    setParams: function (obj) {
      Object.keys(obj || {}).forEach(function (k) {
        var v = obj[k];
        if (v === null || v === undefined || v === '') delete params[k]; else params[k] = String(v);
      });
      writeParams();
      notifyNow();
    },
    resetParams: function () { params = {}; writeParams(); notifyNow(); },
    setLink: function (name) {
      requestAnimationFrame(function () {
        var el = document.getElementById(name);
        if (el) el.scrollIntoView({ block: 'start' });
      });
    },
    refresh: function (id) { delete sources[id]; queueNotify(); },
    colors: ['#1A5C45', '#C9973F', '#6E9A86', '#B4532A', '#0E1F18', '#8A6420', '#A9BCB2', '#4A5A52']
  };
})();
