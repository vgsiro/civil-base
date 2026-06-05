// ============================================================
//  DATA MODELS  —  the shape of everything flowing through the
//  system. These are the "contracts". If you change a field here,
//  search the codebase for it before deleting.
// ============================================================
//
//  This file uses JSDoc typedefs so any editor gives you
//  autocomplete without needing TypeScript. Swap to real TS
//  interfaces later if you want — the shapes are identical.
// ============================================================

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string[]} interests   - tags the user cares about, e.g. ["tech","football"]
 */

/**
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} authorId
 * @property {number} createdAt     - unix ms timestamp
 * @property {string[]} tags        - topic tags, e.g. ["tech","ai"]
 * @property {('text'|'image'|'video'|'link')} type
 * @property {PostStats} stats
 */

/**
 * @typedef {Object} PostStats
 * @property {number} likes
 * @property {number} comments
 * @property {number} shares
 * @property {number} impressions   - how many times shown (avoid /0)
 */

/**
 * @typedef {Object} Interaction
 * One row each time a viewer does something to a post.
 * This is the raw event log that powers affinity + engagement.
 * @property {string} userId
 * @property {string} postId
 * @property {string} authorId
 * @property {('view'|'like'|'comment'|'share'|'hide'|'report')} action
 * @property {number} at            - unix ms timestamp
 */

/**
 * @typedef {Object} ScoredPost
 * What the ranker returns. The breakdown is kept so you can debug
 * WHY a post ranked where it did (hugely useful — keep it).
 * @property {Post} post
 * @property {number} score
 * @property {Object<string, number>} breakdown  - per-signal contribution
 */

module.exports = {}; // typedefs only — nothing to export
