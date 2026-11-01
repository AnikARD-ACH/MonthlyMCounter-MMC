
/* ======================================
   SHARED WATER SPLASH + BUBBLES
====================================== */

function createWaterEffects() {
  const splash = document.getElementById("waterSplash");
  const bubbleField = document.getElementById("bubbleField");

  if (!splash || !bubbleField) return;

  splash.replaceChildren();
  bubbleField.replaceChildren();

  // Three expanding water rings
  for (let i = 0; i < 3; i++) {
    const ring = document.createElement("div");

    ring.className = "splash-ring";
    ring.style.setProperty("--delay", `${i * 1.25}s`);

    splash.appendChild(ring);
  }

  // Glossy water droplets moving in all directions
  const numberOfDrops = 52;

  for (let i = 0; i < numberOfDrops; i++) {
    const drop = document.createElement("div");
    drop.className = "splash-drop";

    const angle = (360 / numberOfDrops) * i;
    const delay = (i % 3) * 1.25;

    const width = 8 + Math.random() * 7;
    const height = width * (1.4 + Math.random() * 0.35);

    drop.style.setProperty("--angle", `${angle}deg`);
    drop.style.setProperty("--delay", `${delay}s`);
    drop.style.setProperty("--drop-width", `${width}px`);
    drop.style.setProperty("--drop-height", `${height}px`);

    splash.appendChild(drop);
  }

  // Random floating bubbles across the page
  const numberOfBubbles = 36;

  for (let i = 0; i < numberOfBubbles; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const size = 8 + Math.random() * 36;
    const left = Math.random() * 100;
    const top = Math.random() * 100;

    const opacity = 0.15 + Math.random() * 0.35;
    const duration = 5 + Math.random() * 8;
    const delay = -(Math.random() * duration);
    const drift = Math.random() * 30 - 15;

    bubble.style.setProperty("--size", `${size}px`);
    bubble.style.setProperty("--left", `${left}%`);
    bubble.style.setProperty("--top", `${top}%`);
    bubble.style.setProperty("--opacity", opacity);
    bubble.style.setProperty("--duration", `${duration}s`);
    bubble.style.setProperty("--delay", `${delay}s`);
    bubble.style.setProperty("--drift", `${drift}px`);

    bubbleField.appendChild(bubble);
  }
}

// Start animation
createWaterEffects();
