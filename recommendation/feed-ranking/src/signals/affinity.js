// ============================================================
//  SIGNAL: AFFINITY  —  how close is the viewer to the author?
// ============================================================
//  Built from the viewer's PAST interactions with this author.
//  More (and more valuable) past interactions => higher affinity.
//  Returns 0..1, saturating so a super-fan doesn't get infinite.
// ============================================================

const { PARAMS, ACTION_VALUES } = require('../../config/ranking-weights');

/**
 * @param {string} viewerId
 * @param {string} authorId
 * @param {import('../models/types').Interaction[]} interactions - viewer's history
 * @returns {number} 0..1
 */
function affinityScore(viewerId, authorId, interactions) {
  let total = 0;
  for (const i of interactions) {
    if (i.userId === viewerId && i.authorId === authorId) {
      total += ACTION_VALUES[i.action] ?? 0;
    }
  }
  if (total <= 0) return 0;
  // Saturating curve: total / (total + saturation) → approaches 1
  return total / (total + PARAMS.affinitySaturation);
}

module.exports = { affinityScore };
