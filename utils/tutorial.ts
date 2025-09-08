// ---------- Tutorial helpers (same-anchor safe & low-latency) ----------

import { driver } from 'driver.js';

// wait for next animation frame
const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));
const twoFrames = async () => {
  await nextFrame();
  await nextFrame();
};
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Wait until element's rect is stable for N frames
function waitForStableRect(el: HTMLElement, frames = 3): Promise<void> {
  return new Promise((resolve) => {
    let last: DOMRect | null = null;
    let stable = 0;
    const step = () => {
      const r = el.getBoundingClientRect();
      if (
        last &&
        Math.abs(r.top - last.top) < 0.5 &&
        Math.abs(r.left - last.left) < 0.5 &&
        Math.abs(r.width - last.width) < 0.5 &&
        Math.abs(r.height - last.height) < 0.5
      ) {
        stable++;
      } else {
        stable = 0;
      }
      last = r;
      if (stable >= frames) return resolve();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Wait for "meaningful change" on an element even if selector stays the same:
// - rect change (size/position)
// - or subtree/content mutation
function waitForChangeOnSameElement(
  el: HTMLElement,
  timeout = 800,
  minDelay = 80,
): Promise<void> {
  return new Promise((resolve) => {
    const startRect = el.getBoundingClientRect();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      try {
        obs.disconnect();
      } catch {}
      cancelAnimationFrame(rafId);
      clearTimeout(to);
      resolve();
    };

    // Observe class/style/subtree changes (narrow attributes to reduce noise)
    const obs = new MutationObserver(() => {
      const r = el.getBoundingClientRect();
      const moved =
        Math.abs(r.top - startRect.top) > 0.5 ||
        Math.abs(r.left - startRect.left) > 0.5 ||
        Math.abs(r.width - startRect.width) > 0.5 ||
        Math.abs(r.height - startRect.height) > 0.5;
      if (moved) finish();
    });
    obs.observe(el, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      childList: true,
      subtree: true,
    });

    // Also poll rect for transform/transition based changes
    let rafId = 0;
    const poll = () => {
      if (finished) return;
      const r = el.getBoundingClientRect();
      const moved =
        Math.abs(r.top - startRect.top) > 0.5 ||
        Math.abs(r.left - startRect.left) > 0.5 ||
        Math.abs(r.width - startRect.width) > 0.5 ||
        Math.abs(r.height - startRect.height) > 0.5;
      if (moved) {
        finish();
        return;
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);

    // Race: if nothing changes within a small minimum delay, proceed anyway
    const to = setTimeout(() => finish(), timeout);

    // Ensure at least a small UX delay so transitions can start; then if still nothing changed, finish.
    setTimeout(() => {
      if (!finished) finish();
    }, minDelay);
  });
}

const SMOOTH_CLASS = 'driver-smooth-transitioning';

// Ensure we only inject CSS once
function ensureDriverSmoothCSS() {
  if (document.getElementById('driver-smooth-style')) return;
  const style = document.createElement('style');
  style.id = 'driver-smooth-style';
  style.textContent = `
    .driver-overlay,
    .driver-popover,
    .driver-stage { transition: opacity 140ms ease, transform 140ms ease; }
    .${SMOOTH_CLASS} .driver-overlay,
    .${SMOOTH_CLASS} .driver-popover,
    .${SMOOTH_CLASS} .driver-stage { opacity: 0 !important; transform: translateZ(0) scale(0.995); pointer-events: none !important; }
  `;
  document.head.appendChild(style);
}

type StableOptions = {
  headerOffset?: number;
  timeout?: number; // max wait for a change
  frames?: number; // stable frames
  minDelay?: number; // small delay to allow microtasks/transitions
  expectChange?: boolean; // if false, skip change-wait and go fast
};

export async function goToStepAfterStableSameAnchor(
  tourInstance: ReturnType<typeof driver>,
  selector: string,
  opts: StableOptions = {},
) {
  const {
    headerOffset = 0,
    timeout = 800,
    frames = 2,
    minDelay = 60,
    expectChange = true,
  } = opts;

  // Inject smooth CSS once
  ensureDriverSmoothCSS();

  const root = document.documentElement;
  const el = document.querySelector(selector) as HTMLElement | null;

  // Soft-hide current driver UI to avoid popover/overlay flicker while we prep next step
  root.classList.add(SMOOTH_CLASS);

  // Helper to move next while revealing smoothly
  const smoothMoveNext = async () => {
    try {
      tourInstance.refresh();
    } catch {}
    await delay(40);
    tourInstance.moveNext();
    // Allow the next step to mount behind the fade, then reveal
    await twoFrames();
    root.classList.remove(SMOOTH_CLASS);
  };

  if (!el) {
    // Fallback: no target to stabilize — still do a smooth transition
    await delay(80);
    await smoothMoveNext();
    return;
  }

  try {
    if (expectChange) {
      await waitForChangeOnSameElement(el, timeout, minDelay);
    } else {
      await delay(minDelay); // quick path: give microtasks/transitions a beat
    }

    // Give layout a breath, then wait for a few stable frames on the SAME element
    await twoFrames();
    await waitForStableRect(el, frames);

    // Optional: gently center target to reduce jumpiness
    try {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
      await delay(160);
    } catch {}

    if (headerOffset) {
      // reserved for future pin-to-top behavior
    }

    // Force layout flush
    void el.offsetHeight;

    // Refresh driver measurements and go next; then fade in
    await smoothMoveNext();
  } catch {
    // Even on failure, proceed without flashing
    await smoothMoveNext();
  }
}
// ---------- /Tutorial helpers ----------
