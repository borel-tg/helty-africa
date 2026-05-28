import { ANIMAL_AVATARS } from "./animalIcons";

/**
 * Deterministic string hash — same user id always maps to the same animal.
 */
export function hashUserId(userId) {
  let hash = 0;
  const str = String(userId ?? "");
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve the animal avatar definition for a learner.
 * @param {string} userId
 * @returns {typeof ANIMAL_AVATARS[number]}
 */
export function getLearnerAnimal(userId) {
  const index = hashUserId(userId) % ANIMAL_AVATARS.length;
  return ANIMAL_AVATARS[index];
}
