// Fully synthesized audio: retro SFX + looping chiptune music per level.
// Day themes are bright square-wave; night themes play the same melodies
// an octave lower, slower and softer (triangle wave).

const NOTE = {};
(() => {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 0; o < 8; o++)
    names.forEach((n, i) => {
      NOTE[n + o] = 440 * Math.pow(2, (o * 12 + i - 57) / 12);
    });
})();

// shift a note name by whole octaves, e.g. shift('A4', -1) -> 'A3'
function shift(name, oct) {
  if (!name) return name;
  const n = name.slice(0, -1);
  const o = parseInt(name.slice(-1), 10) + oct;
  return n + Math.max(0, Math.min(7, o));
}

// [note, beats] — null = rest. Original melodies.
const THEMES = [
  { // 0 - Sunny Plains: bouncy
    tempo: 2.6,
    mel: [['E5',1],['G5',1],['A5',1],['G5',1],['E5',1],['C5',2],[null,1],
          ['D5',1],['E5',1],['G5',2],['E5',1],[null,1],
          ['C5',1],['D5',1],['E5',1],['A4',2],[null,1],
          ['G4',1],['B4',1],['C5',2],[null,2]],
    bass: ['C2','G2'],
  },
  { // 1 - Rolling Hills: adventurous
    tempo: 2.5,
    mel: [['G5',1],['A5',1],['B5',2],['A5',1],['G5',1],['E5',2],[null,1],
          ['G5',1],['E5',1],['C5',2],['E5',1],[null,1],
          ['A5',1],['B5',1],['C6',2],['B5',1],['A5',1],
          ['G5',2],['E5',1],[null,1],['D5',2],[null,2]],
    bass: ['G2','D3'],
  },
  { // 2 - Dark Caves: eerie minor
    tempo: 2.1,
    mel: [['A4',1],['C5',1],['D5',1],['E5',2],[null,1],
          ['F5',1],['E5',1],['D5',2],['C5',1],[null,1],
          ['A4',1],['B4',1],['C5',2],['E5',1],[null,1],
          ['D5',1],['C5',1],['B4',2],['A4',2],[null,2]],
    bass: ['A2','E2'],
  },
  { // 3 - Sky Heights: dreamy, high
    tempo: 2.2,
    mel: [['E6',2],['B5',1],['G5',1],['A5',2],['B5',2],
          ['C6',2],['E6',1],['D6',1],['B5',2],[null,1],
          ['A5',1],['G5',1],['E5',2],['G5',1],[null,1],
          ['B5',2],['G5',2],['E5',2],[null,2]],
    bass: ['F2','C3'],
  },
  { // 4 - Lava Fortress: driving, tense
    tempo: 3.0,
    mel: [['D4',1],['A4',1],['D5',1],['F5',1],['E5',1],['A5',1],['G5',1],['F5',1],
          ['D5',1],['F5',1],['A5',2],['G5',1],['F5',1],['E5',1],
          ['C5',1],['D5',1],['E5',1],['F5',1],['G5',1],['A5',1],['B5',1],['C6',1],
          ['A5',2],['G5',1],['F5',1],['D5',2],[null,1]],
    bass: ['D2','A2'],
  },
];

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('pixelbros_mute') === '1';
    this.themeIdx = 0;
    this.night = false;
    this.playing = false;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
      this._startMusic();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    localStorage.setItem('pixelbros_mute', m ? '1' : '0');
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }
  toggleMute() { this.setMuted(!this.muted); }

  // ---- music ----
  setTheme(idx, night) {
    this.themeIdx = idx;
    this.night = night;
    this.noteIdx = 0;
    if (this.ctx) this.nextTime = this.ctx.currentTime + 0.08;
  }

  _startMusic() {
    this.nextTime = this.ctx.currentTime + 0.1;
    this.noteIdx = 0;
    this.beatCount = 0;
    setInterval(() => this._tick(), 30);
  }

  _tick() {
    if (!this.ctx || this.muted) return;
    const theme = THEMES[this.themeIdx] || THEMES[0];
    const beat = 1 / (theme.tempo * (this.night ? 0.72 : 1));
    while (this.nextTime < this.ctx.currentTime + 0.18) {
      const step = theme.mel[this.noteIdx % theme.mel.length];
      if (step[0]) {
        const name = this.night ? shift(step[0], -1) : step[0];
        this._tone(name, this.nextTime, step[1] * beat * 0.92,
          this.night ? 'triangle' : 'square', 0.10);
      }
      if (this.beatCount % 2 === 0) {
        const b = theme.bass[(this.beatCount / 2) % theme.bass.length];
        this._tone(this.night ? shift(b, -1) : b, this.nextTime,
          beat * 1.6, 'triangle', 0.14);
      }
      this.nextTime += step[1] * beat;
      this.noteIdx++;
      this.beatCount++;
    }
  }

  _tone(name, when, dur, wave, vol) {
    const f = NOTE[name];
    if (!f) return;
    const t = Math.max(when, this.ctx.currentTime);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _seq(notes, gap, wave, vol) {
    if (!this.ctx) return;
    let t = this.ctx.currentTime + 0.001;
    for (const n of notes) {
      this._tone(n, t, gap * 1.4, wave, vol);
      t += gap;
    }
  }

  _slide(f0, f1, dur, wave, vol) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  _noise(dur, vol) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g).connect(this.master);
    src.start(t);
  }

  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'jump':   this._slide(320, 640, 0.16, 'square', 0.09); break;
      case 'coin':   this._seq(['E5', 'B5'], 0.07, 'square', 0.09); break;
      case 'coin2':  this._seq(['E5', 'B5', 'E6'], 0.06, 'square', 0.09); break;
      case 'stomp':  this._noise(0.12, 0.18); this._slide(180, 60, 0.15, 'square', 0.10); break;
      case 'kick':   this._noise(0.08, 0.15); this._slide(260, 90, 0.12, 'square', 0.10); break;
      case 'bump':   this._slide(140, 90, 0.09, 'square', 0.12); break;
      case 'hurt':   this._slide(420, 120, 0.28, 'sawtooth', 0.10); break;
      case 'shield': this._seq(['C5', 'E5', 'G5'], 0.08, 'square', 0.09); break;
      case 'die':    this._seq(['B4','F4','D4','G3','C3'], 0.13, 'square', 0.10); break;
      case 'select': this._tone('E5', this.ctx.currentTime, 0.07, 'square', 0.08); break;
      case 'confirm':this._seq(['C5', 'G5'], 0.08, 'square', 0.09); break;
      case 'clear':  this._seq(['C5','E5','G5','C6','G5','C6'], 0.12, 'square', 0.10); break;
      case 'gameover':this._seq(['A4','F4','D4','A3'], 0.22, 'triangle', 0.12); break;
      case 'victory':this._seq(['C5','E5','G5','C6','E6','G6','C6','E6','G6'], 0.11, 'square', 0.10); break;
    }
  }
}

const audio = new AudioEngine();
export default audio;
