/* ----------------------------------------------------------------
   orionfold — main.js
   Three concerns: entry stagger, custom cursor, form submission.
---------------------------------------------------------------- */

// Set this to the endpoint that should receive { email } as JSON.
// Examples:
//   Buttondown:   "https://buttondown.email/api/emails/embed-subscribe/orionfold"
//   ConvertKit:   "https://app.convertkit.com/forms/<id>/subscriptions"
//   Resend Audi.: your serverless function URL
//   Custom:       any HTTPS endpoint that accepts POST with JSON body
// Leave as "" to log to the console only (useful while still in stealth).
const SIGNUP_ENDPOINT = "";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---- entry stagger -------------------------------------------- */
// Entry choreography is driven entirely by CSS keyframe animations
// (see styles.css). No class flip needed — animations start as
// soon as the elements paint, so the reveal is robust across cache
// states, navigations, and timing edge cases.

/* ---- custom cursor -------------------------------------------- */
if (fineHover && !reduceMotion) {
  const cursor = document.querySelector(".cursor");
  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let x = tx, y = ty;

  addEventListener("pointermove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  }, { passive: true });

  addEventListener("pointerdown", () => cursor.classList.add("is-pointer"));
  addEventListener("pointerup",   () => cursor.classList.remove("is-pointer"));

  // Add the pointer modifier when hovering over anything clickable.
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button, input")) cursor.classList.add("is-pointer");
  });
  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button, input")) cursor.classList.remove("is-pointer");
  });

  function loop() {
    // simple lerp toward target — gives the cursor a gentle lag
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(loop);
  }
  loop();
} else {
  const c = document.querySelector(".cursor");
  if (c) c.remove();
}

/* ---- form submission ------------------------------------------ */
const form   = document.querySelector(".signup-form");
const input  = document.getElementById("email");
const statusEl = form.querySelector(".signup-status");

function setStatus(state, text) {
  statusEl.dataset.state = state;     // "" | "ok" | "err"
  statusEl.textContent = text;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = input.value.trim();

  if (!isValidEmail(email)) {
    setStatus("err", "that doesn't look right. try again.");
    input.focus();
    return;
  }

  setStatus("", "");
  form.setAttribute("aria-busy", "true");

  try {
    if (!SIGNUP_ENDPOINT) {
      // Stealth mode: no endpoint yet. Log locally so the form is testable.
      console.log("[orionfold] signup (no endpoint configured):", email);
      await new Promise((r) => setTimeout(r, 400));
    } else {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    input.value = "";
    setStatus("ok", "received. we'll be in touch.");
  } catch (err) {
    setStatus("err", "that didn't go through. write hello@orionfold.com.");
    console.warn("[orionfold] signup error:", err);
  } finally {
    form.removeAttribute("aria-busy");
  }
});
