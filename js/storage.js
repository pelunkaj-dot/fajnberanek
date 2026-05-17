const STORAGE_KEY = "fajnberanek-progress-v1";

const defaultProgress = {
  completedMiniStories: [],
  unlockedCards: []
};

function readProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return structuredClone(defaultProgress);
    }

    return {
      ...structuredClone(defaultProgress),
      ...JSON.parse(raw)
    };
  } catch (error) {
    console.warn("Nepodařilo se načíst pokrok:", error);
    return structuredClone(defaultProgress);
  }
}

function writeProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("Nepodařilo se uložit pokrok:", error);
  }
}

export function getProgress() {
  return readProgress();
}

export function completeMiniStory(storyId) {
  const progress = readProgress();

  if (!progress.completedMiniStories.includes(storyId)) {
    progress.completedMiniStories.push(storyId);
  }

  writeProgress(progress);
  return progress;
}

export function unlockCard(cardId) {
  const progress = readProgress();

  if (!progress.unlockedCards.includes(cardId)) {
    progress.unlockedCards.push(cardId);
  }

  writeProgress(progress);
  return progress;
}

export function hasUnlockedCard(cardId) {
  const progress = readProgress();
  return progress.unlockedCards.includes(cardId);
}

export function resetProgress() {
  writeProgress(structuredClone(defaultProgress));
}
