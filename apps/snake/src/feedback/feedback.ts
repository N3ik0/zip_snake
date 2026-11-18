import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Sound + haptic feedback. Every call is fire-and-forget and silently
 * degrades when audio or haptics are unavailable (tests, old WebViews).
 * Sounds are synthesised, so there are no audio assets to ship yet.
 */
export interface Feedback {
  /** The snake grew; `progress` in [0, 1] raises the pitch as the board fills. */
  step(progress: number): void;
  fruit(): void;
  win(): void;
}

const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const BASE_FREQUENCY = 330;

export function createFeedback(): Feedback {
  let context: AudioContext | null = null;

  const audio = (): AudioContext | null => {
    if (context) return context;
    const Ctor = typeof window === 'undefined' ? undefined : window.AudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    return context;
  };

  const tone = (semitones: number, delay = 0, duration = 0.09, volume = 0.08) => {
    try {
      const ctx = audio();
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = BASE_FREQUENCY * 2 ** (semitones / 12);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    } catch {
      // Audio is a nice-to-have: never break the game for it.
    }
  };

  const haptic = (style: ImpactStyle) => {
    Haptics.impact({ style }).catch(() => undefined);
  };

  return {
    step(progress) {
      const index = Math.min(PENTATONIC.length - 1, Math.floor(progress * PENTATONIC.length));
      tone(PENTATONIC[index] as number);
      haptic(ImpactStyle.Light);
    },
    fruit() {
      tone(12, 0, 0.12, 0.1);
      tone(19, 0.06, 0.16, 0.08);
      haptic(ImpactStyle.Medium);
    },
    win() {
      [0, 4, 7, 12, 16].forEach((semi, i) => tone(semi, i * 0.08, 0.25, 0.09));
      haptic(ImpactStyle.Heavy);
    },
  };
}
