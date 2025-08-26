// ---------- Tutorial helpers (same-anchor safe & low-latency) ----------

import { driver } from "driver.js";

// wait for next animation frame
const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));
const twoFrames = async () => { await nextFrame(); await nextFrame(); };
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

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
function waitForChangeOnSameElement(el: HTMLElement, timeout = 800, minDelay = 80): Promise<void> {
  return new Promise((resolve) => {
    const startRect = el.getBoundingClientRect();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      try { obs.disconnect(); } catch {}
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
    obs.observe(el, { attributes: true, attributeFilter: ['class', 'style'], childList: true, subtree: true });

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
      if (moved) { finish(); return; }
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

type StableOptions = {
  headerOffset?: number;
  timeout?: number;     // max wait for a change
  frames?: number;      // stable frames
  minDelay?: number;    // small delay to allow microtasks/transitions
  expectChange?: boolean; // if false, skip change-wait and go fast
};

export async function goToStepAfterStableSameAnchor(
  tourInstance: ReturnType<typeof driver>,
  selector: string,
  opts: StableOptions = {}
) {
  await delay(300);
  const {
    headerOffset = 0,
    timeout = 800,
    frames = 2,
    minDelay = 60,
    expectChange = true,
  } = opts;

  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    // fallback: nothing to wait, just proceed
    tourInstance.moveNext();
    return;
  }

  try {
    if (expectChange) {
      await waitForChangeOnSameElement(el, timeout, minDelay);
    } else {
      // quick path: tiny pause to let setState/microtasks flush
      await delay(minDelay);
    }

    await twoFrames();
    await waitForStableRect(el, frames);

    // 3) optional: if you need to pin to viewport top, hook here (headerOffset kept for API symmetry)
    if (headerOffset) {
      // reserved for future: externally you may call a forceStickToViewportTop here
    }
    
    // 强制重新计算布局，确保所有样式变化都已应用
    el.offsetHeight;
    
    tourInstance.refresh();
    
    // 再次等待refresh完成
    await delay(50);
    
    tourInstance.moveNext();
  } catch {
    tourInstance.moveNext();
  }
}
// ---------- /Tutorial helpers ----------
