import { hasUnlockedCard, unlockCard } from "./storage.js";

export function unlockCompletionRewardIfReady(cardSet) {
  if (!cardSet?.cards || cardSet.cards.length < 2) {
    return {
      changed: false,
      rewardCard: null
    };
  }

  const lockedCards = cardSet.cards.filter((card) => !hasUnlockedCard(card.id));

  if (lockedCards.length !== 1) {
    return {
      changed: false,
      rewardCard: null
    };
  }

  const unlockedCount = cardSet.cards.length - lockedCards.length;
  const neededForCompletionReward = cardSet.cards.length - 1;

  if (unlockedCount < neededForCompletionReward) {
    return {
      changed: false,
      rewardCard: null
    };
  }

  const rewardCard = lockedCards[0];
  unlockCard(rewardCard.id);

  return {
    changed: true,
    rewardCard
  };
}
