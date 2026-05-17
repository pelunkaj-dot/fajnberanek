async function loadColoring(storyId) {
  const response = await fetch(`data/coloring/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Omalovanka pro "${storyId}" zatim neni pripravena.`);
  }

  return response.json();
}

const palette = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#38bdf8",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#8b5a2b",
  "#ffffff"
];

export async function renderColoring({ screen, story, onBack }) {
  try {
    const coloring = await loadColoring(story.id);
    const colors = Object.fromEntries(coloring.parts.map((part) => [part.id, part.defaultColor]));

    renderColoringBoard({
      screen,
      story,
      coloring,
      colors,
      selectedColor: palette[0],
      drawMode: false,
      onBack
    });
  } catch (error) {
    console.error(error);
    renderColoringMissing({ screen, story, onBack, message: error.message });
  }
}

function renderColoringBoard({ screen, story, coloring, colors, selectedColor, drawMode, onBack }) {
  screen.innerHTML = `
    <section class="coloring-screen">
      <div class="coloring-card">
        <div class="coloring-top">
          <button class="soft-button coloring-back" id="backToStory">← Zpět</button>
          <div class="coloring-mode-label">${drawMode ? "Čmárej prstem" : "Vybarvuj plochy"}</div>
        </div>

        <p class="coloring-kicker">${story.title}</p>
        <h1>${coloring.title}</h1>
        <p class="coloring-instruction">${coloring.subtitle}</p>

        <div class="coloring-stage ${drawMode ? "is-drawing" : ""}" id="coloringStage">
          ${renderNoahSvg(colors)}
          <canvas class="coloring-canvas" id="drawingCanvas" aria-label="Kreslení prstem"></canvas>
        </div>

        <div class="coloring-tools">
          <div class="coloring-palette" aria-label="Barvy">
            ${palette.map((color) => renderColorButton(color, selectedColor)).join("")}
          </div>

          <div class="coloring-actions">
            <button class="soft-button" id="toggleDrawMode">
              ${drawMode ? "Vybarvuj plochy" : "Čmárej prstem"}
            </button>
            <button class="soft-button" id="clearDrawing">Smazat čmárání</button>
            <button class="soft-button" id="resetColors">Vyčistit celé</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const canvas = document.querySelector("#drawingCanvas");
  prepareCanvas(canvas);

  document.querySelector("#backToStory").addEventListener("click", onBack);

  document.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      renderColoringBoard({
        screen,
        story,
        coloring,
        colors,
        selectedColor: button.dataset.color,
        drawMode,
        onBack
      });
    });
  });

  document.querySelectorAll("[data-coloring-part]").forEach((part) => {
    part.addEventListener("click", () => {
      if (drawMode) return;

      colors[part.dataset.coloringPart] = selectedColor;
      renderColoringBoard({
        screen,
        story,
        coloring,
        colors,
        selectedColor,
        drawMode,
        onBack
      });
    });
  });

  document.querySelector("#toggleDrawMode").addEventListener("click", () => {
    renderColoringBoard({
      screen,
      story,
      coloring,
      colors,
      selectedColor,
      drawMode: !drawMode,
      onBack
    });
  });

  document.querySelector("#clearDrawing").addEventListener("click", () => {
    clearCanvas(canvas);
  });

  document.querySelector("#resetColors").addEventListener("click", () => {
    const resetColors = Object.fromEntries(coloring.parts.map((part) => [part.id, part.defaultColor]));

    renderColoringBoard({
      screen,
      story,
      coloring,
      colors: resetColors,
      selectedColor,
      drawMode: false,
      onBack
    });
  });

  if (drawMode) {
    enableDrawing(canvas, selectedColor);
  }
}

function renderColorButton(color, selectedColor) {
  const selected = color === selectedColor;

  return `
    <button
      class="coloring-color ${selected ? "is-selected" : ""}"
      data-color="${color}"
      style="background: ${color}"
      aria-label="barva ${color}"
    ></button>
  `;
}

function renderNoahSvg(colors) {
  return `
    <svg class="coloring-svg" viewBox="0 0 640 420" role="img" aria-label="Noe, archa a duha">
      <rect data-coloring-part="sky" x="0" y="0" width="640" height="250" fill="${colors.sky}" />
      <circle data-coloring-part="sun" cx="540" cy="64" r="38" fill="${colors.sun}" />

      <path data-coloring-part="rainbowRed" d="M150 168 A170 170 0 0 1 490 168" fill="none" stroke="${colors.rainbowRed}" stroke-width="28" stroke-linecap="round" />
      <path data-coloring-part="rainbowYellow" d="M178 168 A142 142 0 0 1 462 168" fill="none" stroke="${colors.rainbowYellow}" stroke-width="24" stroke-linecap="round" />
      <path data-coloring-part="rainbowGreen" d="M204 168 A116 116 0 0 1 436 168" fill="none" stroke="${colors.rainbowGreen}" stroke-width="22" stroke-linecap="round" />

      <rect data-coloring-part="water" x="0" y="250" width="640" height="95" fill="${colors.water}" />
      <rect data-coloring-part="grass" x="0" y="345" width="640" height="75" fill="${colors.grass}" />

      <path data-coloring-part="ark" d="M170 226 L470 226 L430 310 L210 310 Z" fill="${colors.ark}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="roof" d="M238 166 L402 166 L438 226 L202 226 Z" fill="${colors.roof}" stroke="#5f4630" stroke-width="5" />
      <rect x="292" y="184" width="58" height="42" fill="#fff8e8" stroke="#5f4630" stroke-width="5" />

      <path data-coloring-part="dove" d="M468 130 C488 104 520 108 532 132 C510 126 494 136 482 156 C476 148 470 140 468 130 Z" fill="${colors.dove}" stroke="#5f4630" stroke-width="4" />
      <circle cx="512" cy="126" r="4" fill="#263238" />

      <path d="M48 282 C88 262 128 302 168 282 C208 262 248 302 288 282 C328 262 368 302 408 282 C448 262 488 302 528 282 C568 262 608 302 648 282" fill="none" stroke="rgba(255,255,255,.85)" stroke-width="8" />
    </svg>
  `;
}

function prepareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));

  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function enableDrawing(canvas, color) {
  const ctx = canvas.getContext("2d");
  let drawing = false;

  function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    const source = touch || event;

    return {
      x: source.clientX - rect.left,
      y: source.clientY - rect.top
    };
  }

  function start(event) {
    event.preventDefault();
    drawing = true;
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }

  function move(event) {
    if (!drawing) return;

    event.preventDefault();
    const point = getPoint(event);
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function end(event) {
    if (!drawing) return;

    event.preventDefault();
    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  window.addEventListener("mouseup", end, { once: true });

  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end, { passive: false });
}

function renderColoringMissing({ screen, story, onBack, message }) {
  screen.innerHTML = `
    <section class="coloring-screen">
      <div class="coloring-card coloring-empty">
        <div class="coloring-empty-mark" aria-hidden="true">🎨</div>
        <h1>Omalovánky</h1>
        <p>${message}</p>
        <p>Příběh <strong>${story.title}</strong> doplníme později.</p>
        <button class="primary-button" id="backToStory">Zpět k příběhu</button>
      </div>
    </section>
  `;

  document.querySelector("#backToStory").addEventListener("click", onBack);
}
