// ============================================================
//  RANKING WEIGHTS  —  THE ONLY FILE YOU CHANGE TO TUNE THE FEED
// ============================================================
//
//  Everything that controls "how the feed feels" lives here.
//  You should almost never touch the algorithm code in /src to
//  change behaviour — you change numbers in THIS file.
//
//  HOW TO READ IT:
//   - WEIGHTS  = how important each signal is (relative to others)
//   - PARAMS   = knobs inside a single signal (e.g. decay speed)
//   - ACTION_VALUES = how much each user action is "worth"
//
//  RULE OF THUMB: weights are relative. If recency = 2 and
//  affinity = 1, recency matters twice as much. They do NOT
//  need to add up to 1 — the ranker normalises internally.
// ============================================================

const WEIGHTS = {
  recency:    2.0,  // newer posts rank higher
  affinity:   3.0,  // how close the viewer is to the author
  engagement: 1.5,  // how much OTHER people engaged with the post
  interest:   2.5,  // does the post match the viewer's interests
};

const PARAMS = {
  // --- Recency signal ---
  // Higher = posts get "old" faster. 4 means a post is roughly
  // half as strong after ~4 hours. Lower it for a slower feed.
  recencyHalfLifeHours: 4,

  // --- Affinity signal ---
  // How many past interactions count as a "strong" relationship.
  // Once a viewer has interacted this many times with an author,
  // affinity is maxed out.
  affinitySaturation: 20,

  // --- Engagement signal ---
  // Stops one viral post from dominating forever. Engagement is
  // squashed with a log curve; this controls how aggressively.
  engagementDampening: 10,

  // --- Interest signal ---
  // Minimum interest score so a post with zero tag-overlap still
  // has a small chance to appear (avoids a too-narrow feed).
  interestFloor: 0.1,
};

// How much each interaction is "worth" when we measure engagement
// and when we update affinity. Tune these to push the feed toward
// the behaviour you care about (e.g. value comments over likes).
const ACTION_VALUES = {
  view:    0.5,
  like:    1.0,
  comment: 3.0,
  share:   5.0,
  hide:   -8.0,   // negative: viewer disliked it
  report: -15.0,
};

// Posts the viewer has already seen this many times get pushed
// down hard, so the feed keeps moving.
const SEEN_PENALTY = {
  perViewMultiplier: 0.6, // each prior view multiplies score by this
};

module.exports = { WEIGHTS, PARAMS, ACTION_VALUES, SEEN_PENALTY };
