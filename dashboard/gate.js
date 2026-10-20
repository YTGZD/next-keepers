/*
 * gate.js: who may open the dashboard, and which sections belong to which plan.
 *
 *  1. Email gate. A visitor without access sees the dashboard blurred behind a small form. One email
 *     opens it. The email goes to the same Formspree form as the waitlist (tagged source "dashboard"),
 *     and the browser remembers a marker, never the email, so returning visitors are not asked again.
 *  2. Section lock. Sections listed in NK_CONFIG.lockedSections show a "Searcher plan" panel instead
 *     of their content, with a link to join the Searcher waitlist.
 *
 * Be clear about what this is: a sign-up step and a plan signal, not security. This is a static site,
 * so everything the page can show is also downloadable. Settings live in ../assets/js/site-config.js.
 */
(function () {
  'use strict';

  var cfg = window.NK_CONFIG || {};
  var KEY = 'nk_dashboard_access';
  var remembered = false;                       // fallback when the browser blocks local storage

  function hasAccess() {
    try { return window.localStorage.getItem(KEY) === 'explorer'; } catch (e) { return remembered; }
  }
  function remember() {
    remembered = true;
    try { window.localStorage.setItem(KEY, 'explorer'); } catch (e) { /* blocked: the in-memory flag still works for this visit */ }
  }

  var gateOn = !!(cfg.dashboardGate && cfg.formEndpoint);   // no form address means nothing could be captured, so do not block
  var gated = gateOn && !hasAccess();
  var root = document.documentElement;
  if (gated) root.classList.add('nk-gated');                 // blur at once, before the page paints

  var locked = Array.isArray(cfg.lockedSections) ? cfg.lockedSections : [];
  var price = cfg.searcherPrice || '$99';

  var INFO = {
    sold: ['Sold deals', 'What businesses actually sold for, 2013 to 2026. Asking prices show what sellers hope for; closed deals show what buyers paid.'],
    local: ['Local economy', 'Housing permits, population and small-business counts by county, to see where demand is growing.'],
    financing: ['SBA financing', 'Acquisition loans by market, state and county.'],
    industries: ['Industries', 'Sector mix and multiples by industry.'],
    listings: ['Listings for sale', 'Asking prices, listings and multiples by market.']
  };

  /* ---------- section lock (called by the dashboard each time the section changes) ---------- */
  function applyLock(cat) {
    var isLocked = locked.indexOf(cat) !== -1;
    if (isLocked) {
      Array.prototype.forEach.call(document.querySelectorAll('#pg-market section[data-cat="' + cat + '"]'), function (s) { s.hidden = true; });
    }
    var panel = document.getElementById('nk-lock');
    if (!panel) return;
    panel.hidden = !isLocked;
    if (!isLocked) return;
    var info = INFO[cat] || [cat, ''];
    panel.querySelector('[data-lock="title"]').textContent = info[0] + ' is part of the Searcher plan';
    panel.querySelector('[data-lock="line"]').textContent = info[1];
    panel.querySelector('[data-lock="fine"]').textContent = 'Searcher is ' + price + '/month and opens at launch. Until then, the free Explorer plan stays open.';
  }
  window.NK_PLANS = { apply: applyLock, locked: locked };

  function addLockUi() {
    var nav = document.getElementById('lx-subnav');
    if (!nav || !locked.length) return;
    locked.forEach(function (cat) {
      var b = nav.querySelector('button[data-cat="' + cat + '"]');
      if (!b || b.querySelector('.nk-badge')) return;
      var badge = document.createElement('span');
      badge.className = 'nk-badge';
      badge.textContent = 'Searcher';
      b.appendChild(badge);
    });
    var panel = document.createElement('section');
    panel.id = 'nk-lock';
    panel.className = 'nk-lock';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    panel.innerHTML =
      '<p class="nk-eyebrow">Searcher plan</p>' +
      '<h2 data-lock="title"></h2>' +
      '<p class="nk-lede" data-lock="line"></p>' +
      '<div class="nk-lock-cta">' +
        '<a class="nk-btn" href="../?plan=searcher#join">Join the Searcher waitlist</a>' +
        '<a class="nk-link" href="../#pricing">Compare plans</a>' +
      '</div>' +
      '<p class="nk-fine" data-lock="fine"></p>';
    nav.insertAdjacentElement('afterend', panel);
    var current = nav.querySelector('button[aria-pressed="true"]');
    if (current) applyLock(current.getAttribute('data-cat'));
  }

  /* ---------- "Free plan" pill ---------- */
  function showPlanPill() {
    var bar = document.querySelector('.site-back');
    if (!bar || bar.querySelector('.nk-plan')) return;
    var pill = document.createElement('span');
    pill.className = 'nk-plan';
    pill.innerHTML = 'Free plan &middot; <a href="../#pricing">Compare plans</a>';
    bar.classList.add('nk-has-plan');
    bar.appendChild(pill);
  }

  /* ---------- the gate itself ---------- */
  function setInert(on) {
    ['#dash-root', '.site-back'].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el) el.inert = on;
    });
  }

  function unlock() {
    remember();
    root.classList.remove('nk-gated');
    var g = document.getElementById('nk-gate');
    if (g) g.remove();
    setInert(false);
    showPlanPill();
    var h = document.getElementById('lx-title');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function buildGate() {
    var gate = document.createElement('div');
    gate.id = 'nk-gate';
    gate.className = 'nk-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'nk-gate-h');
    gate.setAttribute('aria-describedby', 'nk-gate-p');
    gate.innerHTML =
      '<div class="nk-gate-card">' +
        '<p class="nk-eyebrow">Free &middot; no password, no card</p>' +
        '<h2 id="nk-gate-h">Open the live market dashboard.</h2>' +
        '<p class="nk-lede" id="nk-gate-p">Enter your email to get in: asking prices, SBA financing and industry multiples across the US.</p>' +
        '<form id="nk-gate-form">' +
          '<label for="nk-gate-email">Email address</label>' +
          '<input id="nk-gate-email" name="email" type="email" autocomplete="email" required placeholder="you@company.com">' +
          '<fieldset><legend>I am a&hellip; <span>(optional)</span></legend>' +
            '<div class="nk-roles">' +
              '<button type="button" class="nk-role" data-role="Buyer" aria-pressed="false">Buyer</button>' +
              '<button type="button" class="nk-role" data-role="Business owner" aria-pressed="false">Business owner</button>' +
              '<button type="button" class="nk-role" data-role="Investor" aria-pressed="false">Investor</button>' +
              '<button type="button" class="nk-role" data-role="Broker" aria-pressed="false">Broker</button>' +
            '</div>' +
          '</fieldset>' +
          '<input class="nk-trap" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '<button type="submit" class="nk-btn" id="nk-gate-submit">Open the dashboard</button>' +
          '<p class="nk-status" id="nk-gate-status" role="status" aria-live="polite"></p>' +
          '<p class="nk-fine">By continuing you agree to our <a href="../privacy.html">Privacy Policy</a>. We add you to the Next Keepers list and only email you about Next Keepers. You can leave any time. This is the free Explorer plan; <a href="../#pricing">see all plans</a>.</p>' +
        '</form>' +
        '<p class="nk-gate-back"><a href="../">&larr; Back to Next Keepers</a></p>' +
      '</div>';
    document.body.appendChild(gate);

    var form = gate.querySelector('#nk-gate-form');
    var input = gate.querySelector('#nk-gate-email');
    var btn = gate.querySelector('#nk-gate-submit');
    var status = gate.querySelector('#nk-gate-status');
    var role = '';
    var chips = Array.prototype.slice.call(gate.querySelectorAll('.nk-role'));
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        role = role === c.getAttribute('data-role') ? '' : c.getAttribute('data-role');     // click again to clear
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-role') === role)); });
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var trap = form.elements['company'];
      if (trap && trap.value) return;                                   // a bot filled the hidden field: ignore silently
      status.className = 'nk-status';
      status.textContent = 'Opening…';
      btn.disabled = true;
      fetch(cfg.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email: input.value.trim(), role: role || 'not given', plan: 'explorer', source: 'dashboard',
          _subject: 'New Next Keepers dashboard sign-up' + (role ? ' (' + role + ')' : '')
        })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        unlock();
      }).catch(function () {
        // Fail closed: if we could not record the email, do not open the dashboard. The visitor can retry.
        status.className = 'nk-status err';
        status.textContent = 'Something went wrong. Please check your connection and try again.';
        btn.disabled = false;
      });
    });

    input.focus();
  }

  function init() {
    addLockUi();
    if (gated) {
      setInert(true);
      buildGate();
    } else if (gateOn) {
      showPlanPill();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
