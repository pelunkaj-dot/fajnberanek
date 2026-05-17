import { renderMiniStory } from "./modules/mini-stories/mini-stories.js";

const screen = document.querySelector("#screen");

const state = {
  stories: [],
  modules: []
};

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Nepodařilo se načíst: ${path}`);
  }

  return response.json();
}

async function init() {
  try {
    state.stories = await loadJson("data/stories.json");
    state.modules = await loadJson("data/modules.json");
    renderHome();
  } catch (error) {
    console.error(error);
    renderError();
  }
}

function renderHome() {
  screen.innerHTML = `
    <section class="home">
      <div class="hero">
        <div class="hero-mark" aria-hidden="true">🐑</div>
        <h1>FajnBeránek</h1>
        <p>
          Tiché biblické objevování pro děti.
          Bez reklam, bez spěchu, bez hluku.
        </p>
        <p>
          Vyber si příběh a pojď objevovat.
        </p>
      </div>

      <section>
        <h2 class="section-title">Biblické příběhy</h2>
        <div class="story-grid">
          ${state.stories.map(renderStoryCard).join("")}
        </div>
      </section>
    </section>
  `;

  document.querySelectorAll("[data-story-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const storyId = button.dataset.storyId;
      renderStoryDetail(storyId);
    });
  });
}

function renderStoryCard(story) {
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

  document.querySelector("#backToHome").addEventListener("click", renderHome);

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
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => {
        console.warn("Service worker se nepodařilo zaregistrovat:", error);
      });
  });
}
