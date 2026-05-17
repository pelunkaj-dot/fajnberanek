import { renderMiniStory } from "./modules/mini-stories/mini-stories.js";
import { renderCards } from "./modules/cards/cards.js";
import { renderFindScene } from "./modules/find-scene/find-scene.js";
import { renderPuzzle } from "./modules/puzzle/puzzle.js";
import { renderCollection } from "./modules/collection/collection.js";
import { renderColoring } from "./modules/coloring/coloring.js";
import { hasUnlockedCard } from "./storage.js";

const APP_VERSION = "25";
const screen = document.querySelector("#screen");

const state = {
  stories: [],
  modules: [],
  cardProgress: {}
};

async function loadJson(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${APP_VERSION}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst: ${path}`);
  }

  return response.json();
}

async function loadCardProgress() {
  const entries = await Promise.all(
    state.stories.map(async (story) => {
      try {
        const cardSet = await loadJson(`data/cards/${story.id}.json`);
        const unlocked = cardSet.cards.filter((card) => hasUnlockedCard(card.id)).length;

        return [
          story.id,
          {
            unlocked,
            total: cardSet.cards.length
          }
        ];
      } catch (error) {
        console.warn(error);

        return [
          story.id,
          {
            unlocked: 0,
            total: 0
          }
        ];
      }
    })
  );

  state.cardProgress = Object.fromEntries(entries);
}

async function init() {
  try {
    state.stories = await loadJson("data/stories.json");
    state.modules = await loadJson("data/modules.json");
    await loadCardProgress();
    renderHome();
  } catch (error) {
    console.error(error);
    renderError();
  }
}

async function refreshProgressAndRenderHome() {
  await loadCardProgress();
  renderHome();
}

function renderHome() {
  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark hero-mark-image" aria-hidden="true">
          <img src="assets/icons/app-icon.svg?v=${APP_VERSION}" alt="" />
        </div>
        <h1>FajnBeránek</h1>
        <p>
          Tiché biblické objevování pro děti.
          Bez reklam, bez spěchu, bez hluku.
        </p>
        <p>
          Vyber si příběh a pojď objevovat.
        </p>

        <button class="primary-button home-collection-button" id="openCollection">
          🌟 Moje kartičky
        </button>
      </div>

      <section>
        <h2 class="section-title">Biblické příběhy</h2>
        <div class="story-grid">
          ${state.stories.map(renderStoryCard).join("")}
        </div>
      </section>

      <section class="brand-footer" aria-label="Informace pro rodiče">
        <div class="brand-footer-icon" aria-hidden="true">
          <img src="assets/icons/app-icon.svg?v=${APP_VERSION}" alt="" />
        </div>
        <div>
          <p class="brand-footer-kicker">Vytvořilo FajnDoučko</p>
          <h2>FajnBeránek je zdarma</h2>
          <p>
            Tichá aplikace pro děti bez reklam a bez registrace.
          </p>
          <a class="brand-footer-link" href="https://fajndoucko.cz" target="_blank" rel="noopener noreferrer">
            Navštívit FajnDoučko.cz
          </a>
        </div>
      </section>
    </section>
  `;

  document.querySelector("#openCollection").addEventListener("click", () => {
    renderCollection({
      screen,
      stories: state.stories,
      onBack: refreshProgressAndRenderHome,
      onOpenStory: renderStoryDetail
    });
  });

  document.querySelectorAll("[data-story-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const storyId = button.dataset.storyId;
      renderStoryDetail(storyId);
    });
  });
}

function renderStoryCard(story) {
  const progress = state.cardProgress[story.id] || { unlocked: 0, total: 0 };
  const progressLabel = progress.total > 0
    ? `${progress.unlocked} / ${progress.total} kartičky`
    : "kartičky čekají";

  return `
    <button class="story-card" data-story-id="${story.id}">
      <div class="story-card-top">
        <div class="story-icon" aria-hidden="true">${story.icon}</div>
        <div>
          <h3>${story.title}</h3>
          <p>${story.subtitle}</p>
        </div>
      </div>

      <div class="badge-row">
        <span class="badge">věk ${story.age}</span>
        <span class="badge">${story.modules.length} aktivity</span>
        <span class="badge badge-progress">🌟 ${progressLabel}</span>
      </div>
    </button>
  `;
}

function renderStoryDetail(storyId) {
  const story = state.stories.find((item) => item.id === storyId);

  if (!story) {
    renderError("Příběh nebyl nalezen.");
    return;
  }

  const availableModules = story.modules
    .map((moduleId) => state.modules.find((module) => module.id === moduleId))
    .filter(Boolean);

  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark" aria-hidden="true">${story.icon}</div>
        <h1>${story.title}</h1>
        <p>${story.subtitle}</p>

        <button class="soft-button" id="backToHome">
          ← Zpět na příběhy
        </button>
      </div>

      <section>
        <h2 class="section-title">Co chceš dělat?</h2>
        <div class="story-grid">
          ${availableModules.map(renderModuleCard).join("")}
        </div>
      </section>
    </section>
  `;

  document.querySelector("#backToHome").addEventListener("click", refreshProgressAndRenderHome);

  document.querySelectorAll("[data-module-id]").forEach((button) => {
    button.addEventListener("click", () => {
      openModule(story, button.dataset.moduleId);
    });
  });
}

function renderModuleCard(module) {
  return `
    <button class="story-card" data-module-id="${module.id}">
      <div class="story-card-top">
        <div class="story-icon" aria-hidden="true">${module.icon}</div>
        <div>
          <h3>${module.title}</h3>
          <p>${module.description}</p>
        </div>
      </div>
    </button>
  `;
}

async function openModule(story, moduleId) {
  if (moduleId === "mini-stories") {
    await renderMiniStory({
      screen,
      story,
      onBack: () => renderStoryDetail(story.id)
    });

    return;
  }

  if (moduleId === "coloring") {
    await renderColoring({
      screen,
      story,
      stories: state.stories,
      onBack: () => renderStoryDetail(story.id)
    });

    return;
  }

  if (moduleId === "find-scene") {
    await renderFindScene({
      screen,
      story,
      onBack: () => renderStoryDetail(story.id)
    });

    return;
  }

  if (moduleId === "puzzle") {
    await renderPuzzle({
      screen,
      story,
      onBack: () => renderStoryDetail(story.id)
    });

    return;
  }

  if (moduleId === "cards") {
    await renderCards({
      screen,
      story,
      onBack: () => renderStoryDetail(story.id)
    });

    return;
  }

  renderModulePlaceholder(story, moduleId);
}

function renderModulePlaceholder(story, moduleId) {
  const module = state.modules.find((item) => item.id === moduleId);

  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark" aria-hidden="true">${module?.icon || "✨"}</div>
        <h1>${module?.title || "Aktivita"}</h1>

        <p>
          Příběh: <strong>${story.title}</strong>
        </p>

        <p>
          Tady brzy postavíme první skutečný modul.
        </p>

        <button class="primary-button" id="backToStory">
          Zpět k příběhu
        </button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", () => {
    renderStoryDetail(story.id);
  });
}

function renderError(message = "Něco se nepodařilo načíst.") {
  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark" aria-hidden="true">🌧️</div>
        <h1>Jejda</h1>
        <p>${message}</p>

        <button class="primary-button" onclick="location.reload()">
          Zkusit znovu
        </button>
      </div>
    </section>
  `;
}

init();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(`./service-worker.js?v=${APP_VERSION}`);
      await registration.update();

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (error) {
      console.warn("Service worker se nepodařilo zaregistrovat:", error);
    }
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}
