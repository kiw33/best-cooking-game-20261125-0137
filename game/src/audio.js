// Synthesized sound effects (WebAudio, no audio files): short oscillator
// blips for picking things up, chopping, serving and failing. The context is
// created on the first user gesture, so the game stays silent until played.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx === null) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, seconds, type = 'sine', gain = 0.12, when = 0, slideTo = 0) {
    if (muted) return;
    const ac = ensure();
    if (ac === null) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    click() {
      tone(660, 0.07, 'square', 0.06);
    },
    pickup() {
      tone(520, 0.08, 'sine', 0.1, 0, 780);
    },
    place() {
      tone(300, 0.09, 'triangle', 0.1, 0, 210);
    },
    chop() {
      tone(180, 0.05, 'square', 0.09);
      tone(140, 0.05, 'square', 0.07, 0.07);
    },
    chopDone() {
      tone(520, 0.09, 'sine', 0.1);
      tone(780, 0.12, 'sine', 0.1, 0.08);
    },
    sizzle() {
      tone(1200, 0.25, 'sawtooth', 0.03, 0, 900);
    },
    cooked() {
      tone(880, 0.1, 'sine', 0.1);
      tone(1174, 0.14, 'sine', 0.1, 0.09);
    },
    burnt() {
      tone(220, 0.25, 'sawtooth', 0.1, 0, 110);
    },
    serve() {
      tone(880, 0.1, 'sine', 0.12);
      tone(1108, 0.1, 'sine', 0.12, 0.09);
      tone(1318, 0.18, 'sine', 0.12, 0.18);
    },
    fail() {
      tone(196, 0.22, 'sawtooth', 0.1, 0, 130);
    },
    tick() {
      tone(980, 0.05, 'square', 0.05);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, i * 0.12));
    },
  };
}
