export const WEIGHTS = {
  recency:    1.5,
  affinity:   4.0,  // boosted — knowing the author matters most
  engagement: 2.0,
  interest:   2.5,
}

export const PARAMS = {
  recencyHalfLifeHours: 48, // 2 days — small community, posts stay relevant longer
  affinitySaturation:   10, // easier to reach high affinity (was 20)
  engagementDampening:  10,
  interestFloor:        0.1,
}

export const ACTION_VALUES: Record<string, number> = {
  view:    0.3,  // views are cheap signals, weight them less
  like:    2.0,  // explicit positive signal
  comment: 5.0,
  share:   8.0,
  hide:   -8.0,
  report: -15.0,
}

export const SEEN_PENALTY = {
  perViewMultiplier: 0.85, // very soft — 0.85^5 = 0.44 (was 0.6^5 = 0.078)
}
