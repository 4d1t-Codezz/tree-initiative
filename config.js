/*
 * ─────────────────────────────────────────────────────────────
 *  SITE NUMBERS: edit these to update the website.
 *  (Everything else on the page reads from here.)
 * ─────────────────────────────────────────────────────────────
 */
window.TREE_CONFIG = {
  // Students from Vedika's school (not counting her) who have planted with TREE.
  // Set to a number, e.g. 25. Leave as null to show a dash.
  schoolStudents: null,

  // Visitors counted before this site launched (e.g. the total from Wix Analytics).
  // The live counter adds new visits on top of this number.
  visitorBaseline: 0,

  // Live visitor counter (free, no account needed: abacus.jasoncameron.dev).
  // Only change these if you want to reset the count.
  counterNamespace: "treeinitiative-net",
  counterKey: "site-visits",

  // Partner organizations: the count on the page is computed from this list.
  partners: [
    "Friends of Columbia Tap",
    "Trees for Houston",
    "Alief Super Neighborhood Council",
    "Sewa International (Houston)",
    "AliefVotes",
    "FIFA World Cup Sustainability Subcommittee",
    "Houston Wilderness",
    "Texas A&M AgriLife",
  ],

  // Next event shown in "Get involved". Set to null to hide the card.
  nextEvent: {
    title: "October Tree Planting",
    date: "2026-10-24",            // YYYY-MM-DD
    place: "3616 Briley St, Houston",
    rsvp: "mailto:houstontreeinitiative@gmail.com?subject=RSVP%3A%20October%20Tree%20Planting",
  },
};
