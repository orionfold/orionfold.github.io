/* ----------------------------------------------------------------
   orionfold — main.js
   Four concerns: entry stagger, custom cursor, form submission,
                  confirmation banner.
---------------------------------------------------------------- */

// Supabase edge function that captures the signup and sends a double
// opt-in confirmation email. Set to "" to log locally without posting.
const SIGNUP_ENDPOINT = "https://orionfold.supabase.co/functions/v1/waitlist-signup";

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

const honeypot = form.querySelector('input[name="website"]');

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
      console.log("[orionfold] signup (no endpoint configured):", email);
      await new Promise((r) => setTimeout(r, 400));
      input.value = "";
      setStatus("ok", "received. we'll be in touch.");
    } else {
      const res = await fetch(SIGNUP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: honeypot ? honeypot.value : "" })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("err", data.error || "that didn't go through. write hello@orionfold.com.");
        return;
      }
      input.value = "";
      setStatus("ok", data.message || "check your inbox to confirm.");
    }
  } catch (err) {
    setStatus("err", "that didn't go through. write hello@orionfold.com.");
    console.warn("[orionfold] signup error:", err);
  } finally {
    form.removeAttribute("aria-busy");
  }
});

/* ---- confirmation banner -------------------------------------- */
// When users click the confirmation link in the email, the edge function
// redirects them back to orionfold.com/?confirmed=1 (or =already, or
// =error&error=<msg>). Surface that state in the existing status element.
(() => {
  const params = new URLSearchParams(location.search);
  const state = params.get("confirmed");
  if (!state) return;
  if (state === "1")            setStatus("ok",  "confirmed. you're on the list.");
  else if (state === "already") setStatus("ok",  "you're already on the list.");
  else if (state === "error")   setStatus("err", params.get("error") || "that link didn't work.");
  // Clean the URL so a reload doesn't re-show the banner.
  history.replaceState({}, "", location.pathname);
})();
