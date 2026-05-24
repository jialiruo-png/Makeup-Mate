function canScrollY(el: Element): boolean {
  const style = window.getComputedStyle(el);
  return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
}

function findScrollable(start: EventTarget | null): HTMLElement | null {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el instanceof HTMLElement && canScrollY(el)) return el;
    el = el.parentElement;
  }
  return null;
}

export function installPullRefreshGuard(): () => void {
  let startY = 0;
  let activeScroller: HTMLElement | null = null;

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    startY = event.touches[0].clientY;
    activeScroller = findScrollable(event.target);
  };

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    const currentY = event.touches[0].clientY;
    const deltaY = currentY - startY;
    if (Math.abs(deltaY) < 2) return;

    if (!activeScroller) {
      event.preventDefault();
      return;
    }

    const atTop = activeScroller.scrollTop <= 0;
    const atBottom =
      activeScroller.scrollTop + activeScroller.clientHeight >= activeScroller.scrollHeight - 1;

    if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
      event.preventDefault();
    }
  };

  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchmove", onTouchMove, { passive: false });

  return () => {
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchmove", onTouchMove);
  };
}
