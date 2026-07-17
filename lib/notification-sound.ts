/**
 * A short two-tone "bell" notification, synthesized with the Web Audio API so
 * no audio asset is needed. Used to alert a user/admin when a new chat message
 * arrives while they have the site open.
 *
 * Browser autoplay policy: audio can only start after a user gesture, so call
 * `armNotificationSound()` once on mount — it resumes the shared AudioContext on
 * the first click/keypress. `playNotificationBell()` is throttled so overlapping
 * pollers (e.g. list + thread) can both call it without double-ringing.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;
let armed = false;
let lastPlayed = 0;
const MIN_GAP_MS = 1500;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Resume the audio context on the first user gesture (autoplay policy). */
export function armNotificationSound(): void {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const unlock = () => {
    getCtx()?.resume().catch(() => {});
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

function ring(audio: AudioContext): void {
  const now = audio.currentTime;
  // Two quick sine notes (a high then higher) for a pleasant chime.
  const notes: Array<[number, number]> = [
    [880, 0],
    [1320, 0.09],
  ];
  for (const [freq, delay] of notes) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const start = now + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.6);
  }
}

/** Play the bell (throttled). No-op if audio is unavailable/blocked. */
export function playNotificationBell(): void {
  const now = Date.now();
  if (now - lastPlayed < MIN_GAP_MS) return;
  lastPlayed = now;
  const audio = getCtx();
  if (!audio) return;
  try {
    if (audio.state === "suspended") {
      audio.resume().then(() => ring(audio)).catch(() => {});
    } else {
      ring(audio);
    }
  } catch {
    /* audio blocked — silently ignore */
  }
}
