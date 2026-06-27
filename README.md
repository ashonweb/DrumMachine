# Beat Maker BM-01

A 16-pad MPC-style drum machine built with React 18 and the Web Audio API. Features a full 16-step sequencer, step velocity, swing, pattern slots, waveform visualizer, reverb, jam loop recording, and shareable pattern URLs.

---

## Features

### Pads
- **4×4 grid (16 pads)** — MPC layout mapped to keyboard keys `1234 / QWER / ASDF / ZXCV`
- **Two sound banks** — 808 Kit (full percussion) and Groove Kit (melodic + drums)
- **Keyboard playable** — every pad triggers on the corresponding key press
- **Zero-latency playback** — all sounds are decoded and cached via the Web Audio API on bank load

### Sequencer
- **16-step grid per pad** — program patterns visually
- **Step velocity** — each click cycles through 4 states:
  - Off → Ghost (38% vol, dim amber) → Normal (100%, amber) → Accent (132%, bright) → Off
- **Mute per row** — `[M]` button silences a pad without clearing its pattern
- **Swing** — 0–70% slider delays every other 16th note for shuffle/groove feel; total bar length stays constant at any swing value
- **Pattern slots A / B** — two independent 16×16 grids, switch while the sequencer is running
- **BPM control** — slider (60–200) plus tap tempo (up to 8 taps averaged)
- **6 presets** — Boom Bap, 4 on Floor, Breakbeat, Trap, Funk, Latin
- **Randomize** — generates a musically-biased fill (kicks on beats, snare on 2&4, varied hat density, ghost/accent mix)
- **Share URL** — encodes the full pattern (steps + velocities + BPM + bank + swing) into a compact base64 URL; paste and open to restore the exact session

### Effects & Recording
- **Reverb** — algorithmic convolution reverb (2.5 s impulse response generated at startup via Web Audio API)
- **Waveform visualizer** — live time-domain canvas display from `AnalyserNode`
- **Jam loop** — record a freeform live performance, then loop it back continuously; independent of the step sequencer

---

## Keyboard Layout

```
┌────┬────┬────┬────┐
│ 1  │ 2  │ 3  │ 4  │   Kick · Punchy Kick · Kick+HH · Snare
├────┼────┼────┼────┤
│ Q  │ W  │ E  │ R  │   Side Stick · Clap · Open HH · Closed HH
├────┼────┼────┼────┤
│ A  │ S  │ D  │ F  │   Heater tones 1–4
├────┼────┼────┼────┤
│ Z  │ X  │ C  │ V  │   Chord layers / melodic hits
└────┴────┴────┴────┘
```

---

## Quick Start

### Prerequisites
- Node.js 16+
- npm 8+

### Install & run

```bash
git clone https://github.com/ashonweb/DrumMachine.git
cd DrumMachine
npm install
npm start
```

Opens at `http://localhost:3000`.

### Production build

```bash
npm run build
```

Output goes to `build/`. Deploy to any static host (Vercel, Netlify, Surge, etc.).

---

## How to Use

### Playing pads
Press any mapped key or click a pad. The waveform display updates with the sound name and the live audio waveform reacts.

### Step sequencer
1. Click any step cell to toggle it — keep clicking to cycle through ghost → normal → accent → off
2. Hit **▶ START** to begin playback at the current BPM
3. Adjust **SWING** to add shuffle; the playhead timing shifts but BPM stays accurate
4. Use **[M]** on any row to mute/unmute that instrument while the pattern plays
5. Click **A** or **B** to switch between two independent pattern slots

### Presets & editing
- Click a preset name to load it into the current slot
- **Random** fills the grid with a biased pattern based on typical drum roles
- **Clear** empties all steps in the current slot

### Sharing
Click **↗ Share** to copy a URL to the clipboard. Anyone who opens the link will see the exact same pattern, BPM, bank, and swing setting loaded automatically.

### Jam loop
1. Hit **● REC** and play the pads live
2. Hit **■ STOP** to save the recording
3. Hit **▶ PLAY** to loop it back continuously
4. Hit **✕** to discard the recording

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 18 — functional components, hooks only |
| Audio engine | Web Audio API (`AudioContext`, `AnalyserNode`, `GainNode`, `ConvolverNode`, `BufferSourceNode`) |
| Build | Create React App 5 + craco (ESM compatibility) |
| Sounds | FreeCodeCamp S3 sample library |

---

## Architecture Notes

### Audio engine
A module-level `AudioContext` singleton is created once on the first user gesture and reused for the lifetime of the app. All audio files are fetched and decoded into `AudioBuffer` objects on bank load, stored in a `Map` cache — subsequent plays reuse the decoded buffer for zero latency.

Reverb is a stereo `ConvolverNode` whose impulse response is generated algorithmically at startup (exponentially decaying noise, 2.5 s). Wet/dry `GainNode`s handle the blend when reverb is enabled.

### Sequencer timing
The sequencer uses recursive `setTimeout` rather than `setInterval`. Each tick reads BPM and swing from refs (not state), so any change takes effect on the next step without restarting the effect. Swing is implemented by alternating step durations:

```
even step duration = T × (1 + swing)
odd  step duration = T × (1 − swing)
```

Each adjacent pair always sums to `2T`, keeping the bar length and BPM accurate at any swing value.

### Share URL encoding
Patterns are binary-packed:

```
byte 0    BPM − 40  (range 40–295 BPM)
byte 1    bankIdx
byte 2    swing (0–70)
bytes 3…  16 pads × 4 bytes each
           2 bits per step × 16 steps = 32 bits = 4 bytes per pad
           packed as: (s0 & 3) | (s1 & 3)<<2 | (s2 & 3)<<4 | (s3 & 3)<<6
```

Total: 3 + 64 = **67 bytes** → base64 → ~92 chars. Loaded via `URLSearchParams` on mount; the `?p=` param is stripped from the address bar after loading.

---

## Project Structure

```
src/
  App.js      — audio engine, all state, sequencer, complete UI
  App.css     — dark theme, amber palette, 4×4 pad grid, sequencer styles
  index.js    — React 18 createRoot entry point
  index.css   — body reset and background
public/
  index.html  — page title "Beat Maker", theme-color #0c0b09
craco.config.js — empty craco config (resolves CRA 5 + ESM dependency issue)
```

---

## License

MIT
