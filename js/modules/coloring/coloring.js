async function loadColoring(storyId) {
  const response = await fetch(`data/coloring/${storyId}.json`);

  if (!response.ok) {
    throw new Error(`Omalovanka pro "${storyId}" zatim neni pripravena.`);
  }

  return response.json();
}

const palette = [
  "#000000",
  "#ef4444",
  "#fca5a5",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#86efac",
  "#38bdf8",
  "#dff4ff",
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
      blankMode: false,
      onBack
    });
  } catch (error) {
    console.error(error);
    renderColoringMissing({ screen, story, onBack, message: error.message });
  }
}

function renderColoringBoard({ screen, story, coloring, colors, selectedColor, drawMode, blankMode, onBack }) {
  screen.innerHTML = `
    <section class="coloring-screen">
      <div class="coloring-card ${blankMode ? "is-blank-mode" : ""}">
        <div class="coloring-top">
          <button class="soft-button coloring-back icon-button" id="backToStory" aria-label="Zpět">←</button>
          <button class="soft-button icon-button" id="openBlankPaper" aria-label="Volné kreslení">⬜</button>
        </div>

        ${blankMode ? "" : `<p class="coloring-kicker">${story.title}</p><h1>${coloring.title}</h1>`}

        <div class="coloring-stage ${drawMode || blankMode ? "is-drawing" : ""} ${blankMode ? "is-blank" : ""}" id="coloringStage">
          ${blankMode ? renderBlankPaper() : renderStorySvg(coloring.storyId, colors)}
          <canvas class="coloring-canvas" id="drawingCanvas" aria-label="Kreslení prstem"></canvas>
        </div>

        <div class="coloring-tools">
          <div class="coloring-palette" aria-label="Barvy">
            ${palette.map((color) => renderColorButton(color, selectedColor)).join("")}
          </div>

          <div class="coloring-actions">
            <button class="soft-button icon-action" id="toggleDrawMode" aria-label="Přepnout režim">
              ${blankMode ? "🖼️" : drawMode ? "🪣" : "✏️"}
            </button>
            <button class="soft-button icon-action" id="clearDrawing" aria-label="Smazat čmárání">🧽</button>
            <button class="soft-button icon-action" id="resetColors" aria-label="Vyčistit celé">🧹</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const canvas = document.querySelector("#drawingCanvas");
  const stage = document.querySelector("#coloringStage");
  const toggleDrawButton = document.querySelector("#toggleDrawMode");
  prepareCanvas(canvas);

  document.querySelector("#backToStory").addEventListener("click", onBack);

  document.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedColor = button.dataset.color;

      document.querySelectorAll("[data-color]").forEach((colorButton) => {
        colorButton.classList.toggle("is-selected", colorButton.dataset.color === selectedColor);
      });
    });
  });

  document.querySelectorAll("[data-coloring-part]").forEach((part) => {
    part.addEventListener("click", () => {
      if (drawMode || blankMode) return;

      colors[part.dataset.coloringPart] = selectedColor;
      part.setAttribute("fill", selectedColor);
      part.setAttribute("stroke", selectedColor);
    });
  });

  toggleDrawButton.addEventListener("click", () => {
    if (blankMode) {
      renderColoringBoard({
        screen,
        story,
        coloring,
        colors,
        selectedColor,
        drawMode: false,
        blankMode: false,
        onBack
      });

      return;
    }

    drawMode = !drawMode;
    stage.classList.toggle("is-drawing", drawMode);
    toggleDrawButton.textContent = drawMode ? "🪣" : "✏️";

    if (drawMode) {
      enableDrawing(canvas, () => selectedColor);
    }
  });

  document.querySelector("#openBlankPaper").addEventListener("click", () => {
    renderColoringBoard({
      screen,
      story,
      coloring,
      colors,
      selectedColor,
      drawMode: false,
      blankMode: true,
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
      blankMode: false,
      onBack
    });
  });

  if (drawMode || blankMode) {
    enableDrawing(canvas, () => selectedColor);
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

function renderStorySvg(storyId, colors) {
  const renderers = {
    "noe": renderNoahSvg,
    "jonas": renderJonahSvg,
    "david": renderDavidSvg,
    "dobry-pastyr": renderGoodShepherdSvg,
    "jezis-a-deti": renderJesusChildrenSvg
  };

  return (renderers[storyId] || renderNoahSvg)(colors);
}

function renderBlankPaper() {
  return `<div class="coloring-blank-paper" aria-hidden="true"></div>`;
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

function renderJonahSvg(colors) {
  return `
    <svg class="coloring-svg" viewBox="0 0 640 420" role="img" aria-label="Jonáš, loď a veliká ryba">
      <rect data-coloring-part="sky" x="0" y="0" width="640" height="230" fill="${colors.sky}" />
      <path data-coloring-part="cloud" d="M70 82 C86 52 132 58 142 88 C170 78 202 98 196 128 L66 128 C42 120 44 92 70 82 Z" fill="${colors.cloud}" stroke="#5f4630" stroke-width="4" />
      <path data-coloring-part="water" d="M0 230 H640 V420 H0 Z" fill="${colors.water}" />
      <path data-coloring-part="boat" d="M110 218 L300 218 L260 292 L150 292 Z" fill="${colors.boat}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="sail" d="M204 92 L204 218 L300 218 Z" fill="${colors.sail}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="fish" d="M410 248 C472 192 570 218 590 274 C548 332 456 332 410 286 L360 316 L378 268 L360 220 Z" fill="${colors.fish}" stroke="#5f4630" stroke-width="5" />
      <circle cx="532" cy="260" r="7" fill="#263238" />
      <path data-coloring-part="waves" d="M20 330 C70 300 112 360 160 330 C210 300 252 360 300 330 C350 300 392 360 440 330 C490 300 532 360 580 330" fill="none" stroke="${colors.waves}" stroke-width="18" stroke-linecap="round" />
    </svg>
  `;
}

function renderDavidSvg(colors) {
  return `
    <svg class="coloring-svg" viewBox="0 0 640 420" role="img" aria-label="David, ovečka a harfa">
      <rect data-coloring-part="sky" x="0" y="0" width="640" height="250" fill="${colors.sky}" />
      <circle data-coloring-part="sun" cx="540" cy="70" r="40" fill="${colors.sun}" />
      <rect data-coloring-part="grass" x="0" y="250" width="640" height="170" fill="${colors.grass}" />
      <circle data-coloring-part="davidFace" cx="300" cy="150" r="42" fill="${colors.davidFace}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="davidRobe" d="M250 198 L350 198 L386 336 L214 336 Z" fill="${colors.davidRobe}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="harp" d="M420 126 C514 156 506 300 414 314 C458 260 462 180 420 126 Z" fill="${colors.harp}" stroke="#5f4630" stroke-width="5" />
      <line x1="440" y1="162" x2="440" y2="296" stroke="#5f4630" stroke-width="4" />
      <line x1="464" y1="178" x2="454" y2="286" stroke="#5f4630" stroke-width="3" />
      <line x1="488" y1="204" x2="466" y2="270" stroke="#5f4630" stroke-width="3" />
      <ellipse data-coloring-part="sheep" cx="160" cy="300" rx="68" ry="42" fill="${colors.sheep}" stroke="#5f4630" stroke-width="5" />
      <circle cx="215" cy="292" r="28" fill="${colors.sheep}" stroke="#5f4630" stroke-width="5" />
    </svg>
  `;
}

function renderGoodShepherdSvg(colors) {
  return `
    <svg class="coloring-svg" viewBox="0 0 640 420" role="img" aria-label="Dobrý pastýř a ovečka">
      <rect data-coloring-part="sky" x="0" y="0" width="640" height="245" fill="${colors.sky}" />
      <circle data-coloring-part="sun" cx="540" cy="68" r="38" fill="${colors.sun}" />
      <rect data-coloring-part="grass" x="0" y="245" width="640" height="175" fill="${colors.grass}" />
      <circle data-coloring-part="shepherdFace" cx="310" cy="138" r="42" fill="${colors.shepherdFace}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="robe" d="M250 190 L370 190 L402 350 L218 350 Z" fill="${colors.robe}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="staff" d="M438 96 C484 70 510 118 470 142" fill="none" stroke="${colors.staff}" stroke-width="13" stroke-linecap="round" />
      <line x1="438" y1="98" x2="438" y2="356" stroke="${colors.staff}" stroke-width="13" stroke-linecap="round" />
      <ellipse data-coloring-part="sheep" cx="160" cy="306" rx="72" ry="44" fill="${colors.sheep}" stroke="#5f4630" stroke-width="5" />
      <circle cx="220" cy="296" r="28" fill="${colors.sheep}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="home" d="M462 250 H574 V344 H462 Z M448 250 L518 196 L588 250 Z" fill="${colors.home}" stroke="#5f4630" stroke-width="5" />
    </svg>
  `;
}

function renderJesusChildrenSvg(colors) {
  return `
    <svg class="coloring-svg" viewBox="0 0 640 420" role="img" aria-label="Ježíš a děti">
      <rect data-coloring-part="sky" x="0" y="0" width="640" height="250" fill="${colors.sky}" />
      <circle data-coloring-part="sun" cx="540" cy="70" r="38" fill="${colors.sun}" />
      <rect data-coloring-part="grass" x="0" y="250" width="640" height="170" fill="${colors.grass}" />
      <circle data-coloring-part="jesusFace" cx="320" cy="130" r="44" fill="${colors.jesusFace}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="jesusRobe" d="M252 188 L388 188 L420 350 L220 350 Z" fill="${colors.jesusRobe}" stroke="#5f4630" stroke-width="5" />
      <circle data-coloring-part="childOne" cx="170" cy="226" r="34" fill="${colors.childOne}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="childOne" d="M130 260 L210 260 L232 350 L108 350 Z" fill="${colors.childOne}" stroke="#5f4630" stroke-width="5" />
      <circle data-coloring-part="childTwo" cx="492" cy="226" r="34" fill="${colors.childTwo}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="childTwo" d="M452 260 L532 260 L554 350 L430 350 Z" fill="${colors.childTwo}" stroke="#5f4630" stroke-width="5" />
      <path data-coloring-part="heart" d="M320 290 C288 254 230 286 320 354 C410 286 352 254 320 290 Z" fill="${colors.heart}" stroke="#5f4630" stroke-width="5" />
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

function enableDrawing(canvas, getColor) {
  if (canvas.dataset.drawingEnabled === "true") return;

  canvas.dataset.drawingEnabled = "true";

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
    ctx.strokeStyle = getColor();
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
  window.addEventListener("mouseup", end);

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
