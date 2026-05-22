export interface DragState {
  active: boolean;
  clientX: number;
  clientY: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export function createDragState(): DragState {
  return {
    active: false,
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
  };
}

export function attachDraggable(
  handle: HTMLElement,
  container: HTMLElement,
  state: DragState,
  onMove: () => void,
  onReset?: () => void
): () => void {
  const handleMouseDown = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sro-btn-group')) return;
    state.active = true;
    state.startX = e.clientX - state.offsetX;
    state.startY = e.clientY - state.offsetY;
  };

  const handleDoubleClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sro-btn-group')) return;
    state.offsetX = 0;
    state.offsetY = 0;
    container.style.transform = 'translate3d(0,0,0)';
    onMove();
    onReset?.();
  };

  const handleMouseUp = () => {
    if (!state.active) return;
    state.active = false;
    clampToBounds(container, state);
    onMove();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.active) return;
    e.preventDefault();
    state.clientX = e.clientX - state.startX;
    state.clientY = e.clientY - state.startY;
    state.offsetX = state.clientX;
    state.offsetY = state.clientY;
    container.style.transform = `translate3d(${state.clientX}px, ${state.clientY}px, 0)`;
  };

  handle.addEventListener('mousedown', handleMouseDown);
  handle.addEventListener('dblclick', handleDoubleClick);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousemove', handleMouseMove);

  return function detachDraggable() {
    handle.removeEventListener('mousedown', handleMouseDown);
    handle.removeEventListener('dblclick', handleDoubleClick);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mousemove', handleMouseMove);
  };
}

export function clampToBounds(container: HTMLElement, state: DragState): void {
  const rect = container.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  let clamped = false;

  if (rect.left < 0) {
    state.offsetX -= rect.left;
    clamped = true;
  }
  if (rect.top < 0) {
    state.offsetY -= rect.top;
    clamped = true;
  }
  if (rect.right > w) {
    state.offsetX -= rect.right - w;
    clamped = true;
  }
  if (rect.bottom > h) {
    state.offsetY -= rect.bottom - h;
    clamped = true;
  }

  if (clamped)
    container.style.transform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0)`;
}

export function applyPosition(container: HTMLElement, state: DragState): void {
  container.style.transform = `translate3d(${state.offsetX}px, ${state.offsetY}px, 0)`;
}
