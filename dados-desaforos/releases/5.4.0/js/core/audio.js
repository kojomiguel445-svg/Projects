/* Áudio sintetizado (WebAudio): efeitos e uma trilha ambiente suave. Nada de arquivos externos. */
(() => {
  const A = {};
  let ctx = null, master, sfxBus, musicBus, musicTimer = 0, musicOn = false;

  const ensure = () => {
    if (ctx) return ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = ctx.createGain(); master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.connect(master);
    const rev = ctx.createConvolver();
    const len = ctx.sampleRate * 2.2, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    rev.buffer = buf;
    const wet = ctx.createGain(); wet.gain.value = 0.35;
    musicBus.connect(rev); rev.connect(wet); wet.connect(master);
    A.apply();
    return ctx;
  };
  A.unlock = () => { const c = ensure(); if (c && c.state === 'suspended') c.resume(); };
  // app minimizado: silencia de verdade (o WebView continua tocando em segundo plano)
  A.suspend = () => { if (ctx && ctx.state === 'running') ctx.suspend(); };
  A.resume = () => { if (ctx && ctx.state === 'suspended') ctx.resume(); };
  A.apply = () => {
    if (!ctx) return;
    const s = (E.state && E.state.settings) || { master: 0.7, music: 0.5, sfx: 0.8 };
    master.gain.value = s.master;
    sfxBus.gain.value = s.sfx;
    musicBus.gain.value = s.music * 0.5;
  };

  const tone = (freq, dur, { type = 'sine', vol = 0.2, attack = 0.005, at = 0, bus, slide } = {}) => {
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  };
  const noise = (dur, { vol = 0.2, at = 0, freq = 1800, q = 1 } = {}) => {
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t);
  };

  A.sfx = (name, n = 1) => {
    if (!ensure()) return;
    switch (name) {
      case 'click': tone(880, 0.06, { type: 'triangle', vol: 0.08 }); break;
      case 'open': tone(520, 0.12, { type: 'triangle', vol: 0.08 }); tone(780, 0.16, { type: 'triangle', vol: 0.06, at: 0.05 }); break;
      case 'dice': for (let i = 0; i < Math.min(6, 3 + n); i++) noise(0.05, { vol: 0.35, at: i * 0.07 + Math.random() * 0.03, freq: 2200 + Math.random() * 1500, q: 4 }); break;
      case 'hit': case 'success': tone(660, 0.12, { type: 'triangle', vol: 0.12 }); tone(990, 0.18, { type: 'triangle', vol: 0.1, at: 0.06 }); break;
      case 'crit': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.35, { type: 'triangle', vol: 0.12, at: i * 0.06 })); break;
      case 'miss': case 'fail': tone(300, 0.2, { type: 'sine', vol: 0.12, slide: 180 }); break;
      case 'heal': [660, 880, 1320].forEach((f, i) => tone(f, 0.4, { vol: 0.08, at: i * 0.08 })); break;
      case 'slash': noise(0.15, { vol: 0.4, freq: 3500, q: 0.8 }); break;
      case 'impact': tone(120, 0.18, { type: 'square', vol: 0.12, slide: 50 }); noise(0.1, { vol: 0.3, freq: 600 }); break;
      case 'spell': tone(440, 0.5, { type: 'sine', vol: 0.1, slide: 1320 }); noise(0.3, { vol: 0.1, freq: 5000, q: 2 }); break;
      case 'chest': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.09, at: i * 0.07 })); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.7, { type: 'triangle', vol: 0.1, at: i * 0.09 })); break;
      case 'wish': tone(200, 1.6, { type: 'sine', vol: 0.12, slide: 1200 }); noise(1.2, { vol: 0.08, freq: 6000, q: 0.5 }); break;
      case 'star3': tone(880, 0.6, { type: 'sine', vol: 0.1 }); break;
      case 'star4': [784, 988, 1175].forEach((f, i) => tone(f, 0.8, { type: 'sine', vol: 0.09, at: i * 0.08 })); break;
      case 'star5': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 1.4, { type: 'sine', vol: 0.09, at: i * 0.09 })); break;
      case 'aggro': tone(220, 0.15, { type: 'square', vol: 0.06 }); tone(330, 0.15, { type: 'square', vol: 0.06, at: 0.1 }); break;
      case 'step': noise(0.04, { vol: 0.05, freq: 500 }); break;
      default: break;
    }
  };

  // trilha ambiente generativa (pentatônica)
  const SCALES = { calma: [261.6, 293.7, 329.6, 392, 440, 523.3], noite: [220, 261.6, 293.7, 329.6, 392, 440], batalha: [196, 233.1, 261.6, 293.7, 349.2, 392] };
  A.music = (mood = 'calma') => {
    if (!ensure()) return;
    A.stopMusic();
    musicOn = true;
    const sc = SCALES[mood] || SCALES.calma;
    const beat = mood === 'batalha' ? 0.32 : 0.62;
    let step = 0;
    const play = () => {
      if (!musicOn) return;
      const root = sc[0] / 2;
      if (step % 8 === 0) { tone(root, beat * 8, { type: 'sine', vol: 0.06, attack: 0.6, bus: musicBus }); tone(root * 1.5, beat * 8, { type: 'sine', vol: 0.04, attack: 0.8, bus: musicBus }); }
      if (Math.random() < (mood === 'batalha' ? 0.8 : 0.55)) tone(sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.3 ? 2 : 1), beat * 2.5, { type: 'triangle', vol: 0.035, attack: 0.02, bus: musicBus });
      if (mood === 'batalha' && step % 2 === 0) noise(0.06, { vol: 0.05, freq: 120, q: 1 });
      step++;
      musicTimer = setTimeout(play, beat * 1000);
    };
    play();
  };
  A.stopMusic = () => { musicOn = false; clearTimeout(musicTimer); };

  ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, A.unlock, { once: false, passive: true }));
  E.Audio = A;
})();
