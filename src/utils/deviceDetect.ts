/**
 * Input device detection utility.
 * Detects whether the user is using: keyboard+mouse, keyboard+trackpad,
 * a computer touchscreen, or a smartphone touchscreen.
 */

export type InputDevice = 'mouse' | 'trackpad' | 'touchscreen' | 'smartphone';

const _listeners = new Set<(device: InputDevice) => void>();
let _device: InputDevice = detectInitialDevice();

function detectInitialDevice(): InputDevice {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const mobileWidth   = window.innerWidth <= 640;

  if (coarsePointer) {
    return mobileWidth ? 'smartphone' : 'touchscreen';
  }
  // Fine pointer – mouse or trackpad; can't tell for sure until wheel events come in
  return 'mouse';
}

function notifyListeners(): void {
  _listeners.forEach((fn) => fn(_device));
}

/** Get current detected input device. */
export function getInputDevice(): InputDevice {
  return _device;
}

/** Subscribe to device changes. Returns unsubscribe function. */
export function onInputDeviceChange(listener: (device: InputDevice) => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

// ---- Heuristic: detect trackpad vs mouse via wheel events ----
// Trackpad wheel events typically use small fractional deltaY (often < 4),
// while physical mouse wheels produce larger discrete values (e.g. 100, 120).
let _wheelEventCount = 0;
const WHEEL_SAMPLE_SIZE = 3;

function handleWheel(e: WheelEvent): void {
  if (_device === 'touchscreen' || _device === 'smartphone') return;
  // deltaMode 0 = pixel, 1 = line, 2 = page
  if (e.deltaMode !== 0) {
    // Line/page mode → almost certainly a mouse wheel
    if (_device !== 'mouse') {
      _device = 'mouse';
      notifyListeners();
    }
    return;
  }
  const absDelta = Math.abs(e.deltaY);
  _wheelEventCount++;
  // Small continuous deltas suggest a trackpad; large discrete deltas suggest a mouse
  if (_wheelEventCount >= WHEEL_SAMPLE_SIZE) {
    const likely = absDelta < 50 ? 'trackpad' : 'mouse';
    if (likely !== _device) {
      _device = likely;
      notifyListeners();
    }
    _wheelEventCount = 0;
  }
}

// ---- Heuristic: if we receive touch events on a fine-pointer device → touchscreen ----
function handleTouchStart(): void {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (!coarsePointer) {
    const mobileWidth = window.innerWidth <= 640;
    const next: InputDevice = mobileWidth ? 'smartphone' : 'touchscreen';
    if (_device !== next) {
      _device = next;
      notifyListeners();
    }
  }
}

// ---- Recheck on resize (phone/desktop switch) ----
function handleResize(): void {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  if (!coarsePointer) return;
  const mobileWidth = window.innerWidth <= 640;
  const next: InputDevice = mobileWidth ? 'smartphone' : 'touchscreen';
  if (_device !== next) {
    _device = next;
    notifyListeners();
  }
}

window.addEventListener('wheel', handleWheel, { passive: true });
window.addEventListener('touchstart', handleTouchStart, { passive: true });
window.addEventListener('resize', handleResize, { passive: true });
