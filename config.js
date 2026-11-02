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
  // The card also hides itself the day after `date`, so update this for each new event.
  nextEvent: {
    title: "Campus Beautification Day",
    date: "2026-11-06",            // YYYY-MM-DD
    time: "9:30 AM–1:30 PM",       // optional
    place: "CVHS campus",
    note: "Planting a tree, cleaning up, replanting and repotting around campus with ECO Club and NHS. Counts for 6 service hours.",
    rsvp: "https://forms.gle/uWZ5XDxYxzrA1Cz69",   // sign-up form or mailto: link
    rsvpLabel: "Sign up",
    flyer: "assets/img/cvhs-flyer.jpg",            // optional; "" hides the link
  },

  // Where the "Donate" button sends people to pay. GitHub Pages can't take payments
  // itself, so the form hands off to a payment processor in a new tab.
  donate: {
    // Used first: TREE's PayPal.me name (paypal.me/TREEInitiative). The button opens
    // paypal.me/<name>/<amount>USD so the chosen amount is already filled in.
    paypalMe: "TREEInitiative",

    // Alternative: a PayPal Business account email (opens PayPal's donate page).
    // Only used if paypalMe is empty.
    paypalEmail: "",

    // Last resort (used only if both above are empty): any donation page link.
    url: "https://paypal.me/TREEInitiative",
  },
};
