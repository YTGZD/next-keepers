/*
 * landing.js: the small amount of behaviour the landing page needs.
 *   1. "I am a..." role buttons
 *   2. the waitlist form, including which plan the visitor is interested in
 *   3. the "market right now" numbers, read from the dashboard's own data files
 *      (dashboard/data/metrics.json and sba_states.json), so the landing page
 *      and the dashboard can never disagree.
 */
(function () {
  'use strict';

  /* ---------- 1. role buttons ---------- */
  var roleButtons = Array.prototype.slice.call(document.querySelectorAll('button[data-role]'));
  var role = 'Buyer';
  function paintRoles() {
    roleButtons.forEach(function (b) {
      var on = b.getAttribute('data-role') === role;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.background = on ? '#FFFFFF' : 'transparent';
      b.style.color = on ? '#0E1F18' : '#FFFFFF';
    });
  }
  roleButtons.forEach(function (b) {
    b.addEventListener('click', function () { role = b.getAttribute('data-role'); paintRoles(); });
  });

  /* ---------- 2. waitlist form ---------- */
  // Plans a visitor can pick from the pricing cards (or from ?plan=searcher in a link, which the
  // dashboard's "Searcher" lock uses). The plan travels with the sign-up so we know what they want.
  var PLANS = {
    searcher: 'Searcher, $99/month (opens at launch)',
    private: 'Private Network, by invitation'
  };
  var plan = '';
  var planBox = document.getElementById('join-plan');
  var planLabel = document.getElementById('join-plan-label');
  var submitBtn = document.getElementById('join-submit');
  function paintPlan() {
    if (planBox) planBox.hidden = !plan;
    if (planLabel) planLabel.textContent = plan ? PLANS[plan] : '';
    if (submitBtn) submitBtn.textContent = plan === 'private' ? 'Request an invitation' : 'Join the waitlist';
  }
  function choosePlan(name) {
    plan = PLANS[name] ? name : '';
    if (plan === 'private') { role = 'Investor'; paintRoles(); }   // the invitation tier is for investors; they can change it
    paintPlan();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-plan-link]'), function (a) {
    var name = a.getAttribute('data-plan-link');
    if (PLANS[name]) a.addEventListener('click', function () { choosePlan(name); });
  });
  var clearBtn = document.getElementById('join-plan-clear');
  if (clearBtn) clearBtn.addEventListener('click', function () { choosePlan(''); });
  var fromUrl = /[?&]plan=([a-z]+)/.exec(location.search);
  if (fromUrl) choosePlan(fromUrl[1]);

  var form = document.getElementById('join-form');
  if (form) {
    var status = document.getElementById('join-status');
    var fields = document.getElementById('join-fields');
    var sent = document.getElementById('join-sent');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('ol-email').value.trim();
      var trap = form.elements['company'];
      if (trap && trap.value) return;                       // a bot filled the hidden field: ignore silently
      var endpoint = (window.NK_CONFIG || {}).formEndpoint;
      if (!endpoint) {
        status.textContent = 'Sign-ups are not open yet. Please check back soon.';
        return;
      }
      status.textContent = 'Sending…';
      if (submitBtn) submitBtn.disabled = true;             // no double sign-ups from a double click
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        // "_subject" is a Formspree convention: it becomes the subject of the notification email you receive
        body: JSON.stringify({
          email: email, role: role, plan: plan || 'not chosen', source: 'landing',
          _subject: 'New Next Keepers waitlist signup (' + role + (plan ? ', ' + plan : '') + ')'
        })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        // The fields wrapper has an inline "display: contents", which beats the plain `hidden`
        // attribute, so hide it with an inline style as well.
        fields.hidden = true;
        fields.style.display = 'none';
        sent.hidden = false;
      }).catch(function () {
        status.textContent = 'Something went wrong. Please try again in a moment.';
        if (submitBtn) submitBtn.disabled = false;
      });
    });
  }

  /* ---------- 3. market numbers ---------- */
  var DATA = 'dashboard/data/';
  function getJSON(name) {
    return fetch(DATA + name + '.json').then(function (r) {
      if (!r.ok) throw new Error(name + ' HTTP ' + r.status);
      return r.json();
    });
  }
  function put(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
  function pct(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%'; }
  function quarterKey(q) { var m = /^(\d{4}) Q(\d)$/.exec(q); return m ? (+m[1]) * 4 + (+m[2]) : -1; }

  Promise.all([getJSON('metrics'), getJSON('sba_states')]).then(function (res) {
    var metrics = res[0], states = res[1];

    // latest national quarter, and the same quarter one year earlier
    var nat = metrics.filter(function (r) { return r.type === 'National'; });
    nat.sort(function (a, b) { return quarterKey(a.quarter) - quarterKey(b.quarter); });
    var latest = nat[nat.length - 1];
    var prior = nat.filter(function (r) { return quarterKey(r.quarter) === quarterKey(latest.quarter) - 4; })[0];

    put('pulse-listings', Math.round(latest.listings).toLocaleString('en-US'));
    put('pulse-ask', '$' + Math.round(latest.ask).toLocaleString('en-US'));
    put('pulse-cfx', latest.cfx.toFixed(2) + '×');
    if (prior) {
      put('pulse-listings-chg', pct((latest.listings / prior.listings - 1) * 100) + ' vs. ' + prior.quarter);
      put('pulse-ask-chg', pct((latest.ask / prior.ask - 1) * 100) + ' vs. ' + prior.quarter);
      put('pulse-cfx-chg', pct((latest.cfx / prior.cfx - 1) * 100) + ' vs. ' + prior.quarter);
    }

    // SBA acquisition loans: last four quarters against the four before
    var now = 0, before = 0;
    states.forEach(function (s) { now += +s.acq_loans || 0; before += +s.acq_loans_prev || 0; });
    put('pulse-sba', now.toLocaleString('en-US'));
    if (before) put('pulse-sba-chg', pct((now / before - 1) * 100) + ' vs. the 4 quarters before');

    put('pulse-asof', 'Latest quarter: ' + latest.quarter + '.');
  }).catch(function () {
    put('pulse-asof', 'The numbers are temporarily unavailable; the full dashboard has them.');
  });
})();
