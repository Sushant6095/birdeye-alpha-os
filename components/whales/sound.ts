"use client";

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const AC =
    (window.AudioContext as typeof AudioContext | undefined) ??
    ((window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext as typeof AudioContext | undefined);
  if (!AC) return null;
  try {
    _ctx = new AC();
  } catch {
    _ctx = null;
  }
  return _ctx;
}

/**
 * Short whale-alert beep. Web Audio so we don't ship an mp3 asset and don't
 * fight autoplay policy for too long — first user gesture unlocks the ctx
 * and beeps just work after that.
 */
export function whaleBeep(opts: { highPitch?: boolean } = {}) {
  const c = ctx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(opts.highPitch ? 1320 : 880, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(now);
  osc.stop(now + 0.42);
}
