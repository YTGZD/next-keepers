/*
 * Site settings you may want to change without touching the pages themselves.
 *
 * formEndpoint: where every sign-up form sends its data (the landing page waitlist AND the
 *   dashboard email gate).
 *   It is set to the Next Keepers form on Formspree (https://formspree.io), which stores each
 *   sign-up and emails a notification. This address is public by design: anyone can post to
 *   it, which is why the forms have a hidden spam trap and Formspree filters spam on its side.
 *   Set it to '' (empty) and the waitlist tells visitors sign-ups are not open yet
 *   (it never pretends to have saved an email) and the dashboard opens without asking for one.
 *
 * dashboardGate: true  = the dashboard asks for an email before it opens (needs formEndpoint).
 *                false = the dashboard opens for everyone.
 *   Honest limit: this is a static website, so the gate is a sign-up step, not security. The
 *   dashboard's data files are ordinary public files. That is fine for lead capture; it is
 *   NOT enough to protect data people pay for (see README, "Free and paid").
 *
 * lockedSections: dashboard sections shown as "Searcher plan" instead of their content.
 *   The section names are: listings, sold, financing, industries, local.
 *   Use [] to make every section free.
 *
 * searcherPrice: the price quoted on the dashboard's locked-section panel. (The pricing cards
 *   on the landing page are written in index.html, so change the price there too.)
 */
window.NK_CONFIG = {
  formEndpoint: 'https://formspree.io/f/mgaojzzo',
  dashboardGate: true,
  lockedSections: ['sold', 'local'],
  searcherPrice: '$99'
};
