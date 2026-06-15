import React, { useEffect, useRef } from 'react';

const GameBackground: React.FC = () => {
  // Use an <img> instead of CSS background-image so wallpaper mode can pan
  // horizontally on narrow viewports (mobile or small desktop windows). In
  // default mode the img acts like bg-cover via object-cover. In wallpaper
  // mode (body.wallpaper-mode) CSS swaps it to natural aspect at viewport
  // height and the container becomes horizontally scrollable.
  const rootRef = useRef<HTMLDivElement>(null);

  // When wallpaper mode toggles on (or the viewport resizes while it's on),
  // center the horizontally-scrollable container so the user sees the middle
  // of the image first rather than the left edge.
  useEffect(() => {
    const recenter = () => {
      const root = rootRef.current;
      if (!root) return;
      if (!document.body.classList.contains('wallpaper-mode')) return;
      // requestAnimationFrame ensures the layout (CSS swap to natural-width
      // image inside the scrollable container) has settled before we measure.
      requestAnimationFrame(() => {
        root.scrollLeft = Math.max(0, (root.scrollWidth - root.clientWidth) / 2);
      });
    };
    const obs = new MutationObserver(recenter);
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', recenter);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', recenter);
    };
  }, []);

  // Wallpaper mode: enable click-drag panning + wheel→horizontal scroll so
  // desktop users (no touch/trackpad) can actually move the image. Touch
  // devices already get native horizontal swipe via `touch-action: pan-x`.
  // Arrow keys also nudge for accessibility.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let dragging = false;
    let startX = 0;
    let startScrollLeft = 0;

    const isWallpaper = () => document.body.classList.contains('wallpaper-mode');

    const onPointerDown = (e: PointerEvent) => {
      if (!isWallpaper()) return;
      if (e.pointerType === 'touch') return; // native scroll handles touch
      dragging = true;
      startX = e.clientX;
      startScrollLeft = root.scrollLeft;
      root.setPointerCapture(e.pointerId);
      root.style.cursor = 'grabbing';
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      root.scrollLeft = startScrollLeft - (e.clientX - startX);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try { root.releasePointerCapture(e.pointerId); } catch { /* no-op */ }
      root.style.cursor = '';
    };
    const onWheel = (e: WheelEvent) => {
      if (!isWallpaper()) return;
      // Translate vertical wheel into horizontal scroll. Trackpads with
      // native horizontal deltaX already work — we add deltaY so a regular
      // mouse wheel pans too.
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        root.scrollLeft += e.deltaY;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isWallpaper()) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); root.scrollLeft += 80; }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); root.scrollLeft -= 80; }
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    root.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerUp);
      root.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="game-background-root fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gray-50 dark:bg-gray-900
      text-gray-900 dark:text-gray-100">
      <img
        src="/totembound.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="game-background-image absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dimming overlay — hidden in wallpaper mode (see index.css) so the
          user can see the artwork unobstructed when they explicitly ask for it. */}
      <div className="wallpaper-mask absolute inset-0 bg-black/10 dark:bg-black/30" />

      {/* Background gradient for better readability — also hidden in wallpaper mode. */}
      <div className="wallpaper-mask absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/10 to-gray-50/20
          dark:via-gray-900/10 dark:to-gray-900/20" />

    </div>
  );
};

export default GameBackground;