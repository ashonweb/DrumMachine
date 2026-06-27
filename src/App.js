import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// ── Web Audio engine (module-level singleton) ─────────────────────────────────
let _ctx = null, _analyser = null, _master = null, _reverb = null;
const _cache = new Map();

function setupAudio() {
  _ctx      = new (window.AudioContext || window.webkitAudioContext)();
  _analyser = _ctx.createAnalyser();
  _analyser.fftSize = 1024;
  _master   = _ctx.createGain();
  _master.connect(_analyser);
  _analyser.connect(_ctx.destination);

  const len  = _ctx.sampleRate * 2.5;
  const ibuf = _ctx.createBuffer(2, len, _ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ibuf.getChannelData(c);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  _reverb        = _ctx.createConvolver();
  _reverb.buffer = ibuf;
  _reverb.connect(_master);
}

async function fetchBuffer(url) {
  if (_cache.has(url)) return _cache.get(url);
  if (!_ctx) setupAudio();
  const resp = await fetch(url);
  const arr  = await resp.arrayBuffer();
  const dec  = await _ctx.decodeAudioData(arr);
  _cache.set(url, dec);
  return dec;
}

async function playAudio(url, vol, rvb) {
  try {
    if (!_ctx) setupAudio();
    if (_ctx.state === 'suspended') await _ctx.resume();
    const buf  = await fetchBuffer(url);
    const src  = _ctx.createBufferSource();
    src.buffer = buf;
    const gain = _ctx.createGain();
    gain.gain.value = Math.max(0, Math.min(2, vol));
    src.connect(gain);
    if (rvb && _reverb) {
      const dry = _ctx.createGain(); dry.gain.value = 0.5; gain.connect(dry); dry.connect(_master);
      const wet = _ctx.createGain(); wet.gain.value = 0.7; gain.connect(wet); wet.connect(_reverb);
    } else {
      gain.connect(_master);
    }
    src.start();
  } catch (_e) {
    const a = new Audio(url); a.volume = Math.min(1, vol); a.play().catch(() => {});
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE     = 'https://s3.amazonaws.com/freecodecamp/drums/';
const PAD_KEYS = ['Q','W','E','A','S','D','Z','X','C'];

// Step velocity: 0=off, 1=ghost, 2=normal, 3=accent
const STEP_VOL = [0, 0.38, 1.0, 1.32];

const BANKS = [
  {
    id: 'heater', name: 'Heater Kit',
    pads: [
      { key:'Q', name:'Heater 1',    url: BASE+'Heater-1.mp3'       },
      { key:'W', name:'Heater 2',    url: BASE+'Heater-2.mp3'       },
      { key:'E', name:'Heater 3',    url: BASE+'Heater-3.mp3'       },
      { key:'A', name:'Heater 4',    url: BASE+'Heater-4_1.mp3'     },
      { key:'S', name:'Clap',        url: BASE+'Heater-6.mp3'       },
      { key:'D', name:'Open HH',     url: BASE+'Dsc_Oh.mp3'         },
      { key:'Z', name:'Kick + HH',   url: BASE+'Kick_n_Hat.mp3'     },
      { key:'X', name:'Kick',        url: BASE+'RP4_KICK_1.mp3'     },
      { key:'C', name:'Closed HH',   url: BASE+'Cev_H2.mp3'        },
    ],
  },
  {
    id: 'smooth', name: 'Smooth Piano',
    pads: [
      { key:'Q', name:'Chord 1',     url: BASE+'Chord_1.mp3'        },
      { key:'W', name:'Chord 2',     url: BASE+'Chord_2.mp3'        },
      { key:'E', name:'Chord 3',     url: BASE+'Chord_3.mp3'        },
      { key:'A', name:'Give Light',  url: BASE+'Give_us_a_light.mp3'},
      { key:'S', name:'Dry Ohh',     url: BASE+'Dry_Ohh.mp3'        },
      { key:'D', name:'Bld H1',      url: BASE+'Bld_H1.mp3'        },
      { key:'Z', name:'Punchy Kick', url: BASE+'punchy_kick_1.mp3'  },
      { key:'X', name:'Side Stick',  url: BASE+'side_stick_1.mp3'   },
      { key:'C', name:'Snare',       url: BASE+'Brk_Snr.mp3'       },
    ],
  },
];

// Steps are now 0|1|2|3 per cell (off/ghost/normal/accent)
const EMPTY_STEPS = () => Object.fromEntries(PAD_KEYS.map(k => [k, Array(16).fill(0)]));
const EMPTY_MUTED = () => Object.fromEntries(PAD_KEYS.map(k => [k, false]));

const PRESETS = [
  {
    name: 'Boom Bap',
    steps: {
      X: [2,0,0,0,0,0,0,0,2,0,0,3,0,0,0,0],
      S: [0,0,0,0,3,0,0,0,0,0,0,0,3,0,1,0],
      C: [2,0,1,0,2,0,1,2,2,0,1,0,2,0,1,0],
      D: [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2],
      Z: [2,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0],
    },
  },
  {
    name: '4 on Floor',
    steps: {
      X: [3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0],
      S: [0,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0],
      C: [2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1],
      D: [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,2],
    },
  },
  {
    name: 'Breakbeat',
    steps: {
      X: [3,0,0,1,0,0,2,0,3,0,0,0,0,2,0,0],
      S: [0,0,2,0,0,0,0,3,0,1,0,0,0,0,2,0],
      C: [2,0,1,2,0,2,1,0,2,0,2,1,0,2,1,0],
      Z: [0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0],
    },
  },
];

// ── URL share encoding ────────────────────────────────────────────────────────
// Binary-packed: 3 header bytes + 9 pads × 4 bytes (2 bits per step) = 39 bytes → ~52 char base64
function encodePattern(steps, bpm, bankIdx, swing) {
  const bytes = [
    Math.min(255, Math.max(0, bpm - 40)),
    bankIdx & 0xff,
    Math.min(70, Math.max(0, swing)),
  ];
  PAD_KEYS.forEach(k => {
    const row = steps[k] || Array(16).fill(0);
    for (let i = 0; i < 16; i += 4)
      bytes.push((row[i]&3) | ((row[i+1]&3)<<2) | ((row[i+2]&3)<<4) | ((row[i+3]&3)<<6));
  });
  return btoa(bytes.map(b => String.fromCharCode(b)).join('')).replace(/=/g, '');
}

function decodePattern(str) {
  try {
    const padded = str + '='.repeat((4 - str.length % 4) % 4);
    const bytes = atob(padded).split('').map(c => c.charCodeAt(0));
    if (bytes.length < 3 + PAD_KEYS.length * 4) return null;
    let idx = 0;
    const bpm     = (bytes[idx++] || 0) + 40;
    const bankIdx = bytes[idx++] || 0;
    const swing   = bytes[idx++] || 0;
    const steps   = {};
    PAD_KEYS.forEach(k => {
      steps[k] = [];
      for (let i = 0; i < 4; i++) {
        const b = bytes[idx++] || 0;
        steps[k].push(b&3, (b>>2)&3, (b>>4)&3, (b>>6)&3);
      }
    });
    return { bpm, bankIdx: BANKS[bankIdx] ? bankIdx : 0, swing, steps };
  } catch { return null; }
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  // Machine
  const [power,       setPower]       = useState(true);
  // Sound
  const [bankIdx,     setBankIdx]     = useState(0);
  const [volume,      setVolume]      = useState(0.8);
  const [reverb,      setReverb]      = useState(false);
  // Display
  const [display,     setDisplay]     = useState('');
  const [active,      setActive]      = useState(new Set());
  // Jam loop
  const [recording,   setRecording]   = useState(false);
  const [playing,     setPlaying]     = useState(false);
  const [hasPattern,  setHasPattern]  = useState(false);
  // Sequencer
  const [bpm,         setBpm]         = useState(120);
  const [swing,       setSwing]       = useState(0);
  const [seqPlaying,  setSeqPlaying]  = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps,       setSteps]       = useState(EMPTY_STEPS);
  const [muted,       setMuted]       = useState(EMPTY_MUTED);
  const [slot,        setSlot]        = useState('A');
  // UI
  const [shareCopied, setShareCopied] = useState(false);

  // Refs (read by effects/timers without deps)
  const powerRef        = useRef(true);
  const bankRef         = useRef(0);
  const volumeRef       = useRef(0.8);
  const reverbRef       = useRef(false);
  const recordingRef    = useRef(false);
  const bpmRef          = useRef(120);
  const swingRef        = useRef(0);
  const stepsRef        = useRef(steps);
  const mutedRef        = useRef(EMPTY_MUTED());
  const recStartRef     = useRef(null);
  const patternRef      = useRef([]);
  const loopIdsRef      = useRef([]);
  const isLoopingRef    = useRef(false);
  const seqTimerRef     = useRef(null);
  const tapTimesRef     = useRef([]);
  const tapResetRef     = useRef(null);
  const slotsRef        = useRef({ A: EMPTY_STEPS(), B: EMPTY_STEPS() });
  const shareCopyTimer  = useRef(null);
  const slotRef         = useRef('A');

  // Keep refs in sync with state
  useEffect(() => { powerRef.current     = power;    }, [power]);
  useEffect(() => { bankRef.current      = bankIdx;  }, [bankIdx]);
  useEffect(() => { volumeRef.current    = volume;   }, [volume]);
  useEffect(() => { reverbRef.current    = reverb;   }, [reverb]);
  useEffect(() => { recordingRef.current = recording;}, [recording]);
  useEffect(() => { bpmRef.current       = bpm;      }, [bpm]);
  useEffect(() => { swingRef.current     = swing;    }, [swing]);
  useEffect(() => { stepsRef.current     = steps;    }, [steps]);
  useEffect(() => { mutedRef.current     = muted;    }, [muted]);
  useEffect(() => { slotRef.current      = slot;     }, [slot]);

  // Pre-fetch sounds when bank changes
  useEffect(() => {
    BANKS[bankIdx].pads.forEach(p => fetchBuffer(p.url).catch(() => {}));
  }, [bankIdx]);

  // Load shared pattern from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('p');
    if (p) {
      const data = decodePattern(p);
      if (data) {
        stepsRef.current     = data.steps;
        slotsRef.current.A   = data.steps;
        setSteps(data.steps);
        setBpm(data.bpm);
        setBankIdx(data.bankIdx);
        setSwing(data.swing);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flashPad = useCallback((key) => {
    setActive(s => new Set(s).add(key));
    setTimeout(() => setActive(s => { const n = new Set(s); n.delete(key); return n; }), 200);
  }, []);

  const triggerPad = useCallback((key, volMult = 1) => {
    if (!powerRef.current) return;
    const pad = BANKS[bankRef.current].pads.find(p => p.key === key);
    if (!pad) return;
    playAudio(pad.url, volumeRef.current * volMult, reverbRef.current);
    setDisplay(pad.name);
    flashPad(key);
    if (recordingRef.current && recStartRef.current !== null)
      patternRef.current.push({ key, t: Date.now() - recStartRef.current });
  }, [flashPad]);

  // Keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.repeat) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && PAD_KEYS.includes(k)) triggerPad(k);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerPad]);

  // Sequencer — recursive setTimeout with swing timing and velocity
  useEffect(() => {
    if (!seqPlaying) { setCurrentStep(-1); return; }
    let step = 0;
    function tick() {
      const ms = (60 / bpmRef.current / 4) * 1000;
      const sw = swingRef.current / 100;
      // Even steps get stretched, odd steps get compressed → swing feel
      // Total per pair stays 2×ms regardless of swing amount
      const nextMs = step % 2 === 0 ? ms * (1 + sw) : ms * (1 - sw);
      setCurrentStep(step);
      Object.entries(stepsRef.current).forEach(([key, arr]) => {
        const val = arr[step];
        if (val > 0 && !mutedRef.current[key]) triggerPad(key, STEP_VOL[val]);
      });
      step = (step + 1) % 16;
      seqTimerRef.current = setTimeout(tick, nextMs);
    }
    seqTimerRef.current = setTimeout(tick, (60 / bpmRef.current / 4) * 1000);
    return () => clearTimeout(seqTimerRef.current);
  }, [seqPlaying, triggerPad]); // eslint-disable-line react-hooks/exhaustive-deps

  // Jam loop playback
  const stopLoop = useCallback(() => {
    isLoopingRef.current = false;
    loopIdsRef.current.forEach(clearTimeout);
    loopIdsRef.current = [];
    setPlaying(false);
    setDisplay('');
  }, []);

  const scheduleLoop = useCallback(() => {
    const pat = patternRef.current;
    if (!pat.length) return;
    const dur = pat[pat.length - 1].t + 500;
    pat.forEach(({ key, t }) => {
      const id = setTimeout(() => { if (isLoopingRef.current) triggerPad(key); }, t);
      loopIdsRef.current.push(id);
    });
    const id = setTimeout(() => { if (isLoopingRef.current) scheduleLoop(); }, dur);
    loopIdsRef.current.push(id);
  }, [triggerPad]);

  const startLoop = useCallback(() => {
    if (!patternRef.current.length) return;
    isLoopingRef.current = true;
    setPlaying(true);
    setDisplay('Looping…');
    scheduleLoop();
  }, [scheduleLoop]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handlePower() {
    const next = !power;
    setPower(next);
    if (!next) {
      stopLoop(); setRecording(false); setDisplay('');
      setSeqPlaying(false); clearTimeout(seqTimerRef.current);
    }
  }

  function handleBankSwitch(i) {
    setBankIdx(i); setDisplay(BANKS[i].name);
    stopLoop(); setHasPattern(false); patternRef.current = [];
  }

  function handleRecToggle() {
    if (recording) {
      setRecording(false);
      const n = patternRef.current.length;
      setHasPattern(n > 0);
      setDisplay(n > 0 ? `${n} hits saved` : 'Nothing recorded');
    } else {
      patternRef.current = []; recStartRef.current = Date.now();
      setRecording(true); setDisplay('Recording…');
    }
  }

  function handleTap() {
    const now = Date.now();
    tapTimesRef.current.push(now);
    clearTimeout(tapResetRef.current);
    tapResetRef.current = setTimeout(() => { tapTimesRef.current = []; }, 2000);
    if (tapTimesRef.current.length >= 2) {
      const taps = tapTimesRef.current.slice(-8);
      const intervals = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = intervals.reduce((a, b) => a + b) / intervals.length;
      const nb = Math.round(60000 / avg);
      if (nb >= 40 && nb <= 220) setBpm(nb);
    }
  }

  // Cycle: off(0) → normal(2) → accent(3) → ghost(1) → off(0)
  function toggleStep(key, i) {
    setSteps(prev => {
      const cur  = prev[key][i];
      const next = cur === 0 ? 2 : cur === 2 ? 3 : cur === 3 ? 1 : 0;
      return { ...prev, [key]: prev[key].map((v, j) => j === i ? next : v) };
    });
  }

  function toggleMute(key) {
    setMuted(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Save current to slotsRef, load new slot
  function switchSlot(newSlot) {
    if (newSlot === slot) return;
    slotsRef.current[slotRef.current] = stepsRef.current;
    setSlot(newSlot);
    const newSteps = slotsRef.current[newSlot];
    stepsRef.current = newSteps;
    setSteps(newSteps);
  }

  function applyPreset(preset) {
    const s = EMPTY_STEPS();
    Object.entries(preset.steps).forEach(([key, arr]) => { s[key] = arr.slice(); });
    stepsRef.current = s;
    slotsRef.current[slotRef.current] = s;
    setSteps(s);
  }

  function clearSteps() {
    const s = EMPTY_STEPS();
    stepsRef.current = s;
    slotsRef.current[slotRef.current] = s;
    setSteps(s);
  }

  function randomize() {
    const kickKeys  = ['X', 'Z'];
    const snareKeys = ['S', 'E'];
    const hatKeys   = ['C', 'D'];
    const s = EMPTY_STEPS();
    PAD_KEYS.forEach(k => {
      const isKick  = kickKeys.includes(k);
      const isSnare = snareKeys.includes(k);
      const isHat   = hatKeys.includes(k);
      s[k] = Array(16).fill(0).map((_, i) => {
        let p;
        if      (isKick)  p = (i % 4 === 0) ? 0.65 : 0.1;
        else if (isSnare) p = (i === 4 || i === 12) ? 0.8 : 0.07;
        else if (isHat)   p = 0.4;
        else              p = 0.12;
        if (Math.random() >= p) return 0;
        const r = Math.random();
        return r < 0.12 ? 3 : r < 0.28 ? 1 : 2; // accent / ghost / normal
      });
    });
    stepsRef.current = s;
    slotsRef.current[slotRef.current] = s;
    setSteps(s);
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?p=${encodePattern(steps, bpm, bankIdx, swing)}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        setShareCopied(true);
        clearTimeout(shareCopyTimer.current);
        shareCopyTimer.current = setTimeout(() => setShareCopied(false), 2500);
      })
      .catch(() => window.prompt('Copy link:', url));
  }

  const bank = BANKS[bankIdx];

  return (
    <div className={`app${power ? '' : ' off'}`}>
      <div className="bg-grid" aria-hidden="true" />
      <div className="shell">

        {/* ── Top bar ── */}
        <div className="topbar">
          <div className="brand">
            <span className="brand-led" />
            <span className="brand-name">BEAT MAKER</span>
            <span className="brand-model">BM-01</span>
          </div>
          <button className={`pwr-btn${power ? ' on' : ''}`} onClick={handlePower} aria-label="Power">
            <PowerSVG />
          </button>
        </div>

        {/* ── Machine body ── */}
        <div className="machine-body">

          {/* Pads */}
          <div className="pad-section">
            <div className="pad-grid">
              {bank.pads.map(pad => (
                <button
                  key={pad.key}
                  className={`pad${active.has(pad.key) ? ' lit' : ''}${recording ? ' rec-mode' : ''}`}
                  onPointerDown={() => triggerPad(pad.key)}
                  disabled={!power}
                >
                  <span className="pad-key">{pad.key}</span>
                  <span className="pad-name">{pad.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="ctrl-panel">

            {/* Waveform display */}
            <div className="display">
              <Waveform />
              <div className="disp-overlay">
                {recording  && <span className="disp-badge rec-badge">● REC</span>}
                {playing    && <span className="disp-badge play-badge">▶ LOOP</span>}
                {seqPlaying && (
                  <span className="disp-badge seq-badge">
                    ◉ {bpm} BPM{swing > 0 ? ` · ${swing}% sw` : ''}
                  </span>
                )}
                {!recording && !playing && !seqPlaying && display && (
                  <span className="disp-text">{display}</span>
                )}
              </div>
            </div>

            {/* Volume */}
            <div className="ctrl-group">
              <div className="ctrl-head">
                <span className="ctrl-label">VOLUME</span>
                <span className="ctrl-val">{Math.round(volume * 100)}</span>
              </div>
              <div className="slider-track">
                <div className="slider-fill" style={{ width: `${volume * 100}%` }} />
                <input type="range" min="0" max="1" step="0.01" className="vol-range"
                  value={volume} disabled={!power}
                  onChange={e => { const v = +e.target.value; setVolume(v); setDisplay(`Volume ${Math.round(v*100)}%`); }} />
              </div>
            </div>

            {/* Bank */}
            <div className="ctrl-group">
              <span className="ctrl-label">SOUND BANK</span>
              <div className="bank-row">
                {BANKS.map((b, i) => (
                  <button key={b.id} className={`bank-btn${bankIdx===i?' sel':''}`}
                    disabled={!power} onClick={() => handleBankSwitch(i)}>{b.name}</button>
                ))}
              </div>
            </div>

            {/* BPM */}
            <div className="ctrl-group">
              <div className="ctrl-head">
                <span className="ctrl-label">BPM</span>
                <span className="ctrl-val">{bpm}</span>
              </div>
              <div className="bpm-row">
                <div className="slider-track" style={{ flex:1 }}>
                  <div className="slider-fill" style={{ width:`${((bpm-60)/140)*100}%` }} />
                  <input type="range" min="60" max="200" step="1" className="vol-range"
                    value={bpm} disabled={!power} onChange={e => setBpm(+e.target.value)} />
                </div>
                <button className="tap-btn" disabled={!power} onClick={handleTap}>TAP</button>
              </div>
            </div>

            {/* Reverb */}
            <div className="ctrl-group">
              <span className="ctrl-label">EFFECTS</span>
              <button className={`fx-btn${reverb?' on':''}`} disabled={!power}
                onClick={() => setReverb(r => !r)}>
                {reverb ? '◈' : '◇'} REVERB
              </button>
            </div>

            {/* Jam loop */}
            <div className="ctrl-group">
              <span className="ctrl-label">JAM LOOP</span>
              <div className="loop-row">
                <button
                  className={`loop-btn rec-btn${recording?' active':''}${hasPattern&&!recording?' has':''}`}
                  disabled={!power||playing} onClick={handleRecToggle}>
                  {recording ? '■' : '●'} {recording ? 'STOP' : 'REC'}
                </button>
                <button
                  className={`loop-btn play-btn${playing?' active':''}`}
                  disabled={!power||!hasPattern||recording}
                  onClick={() => playing ? stopLoop() : startLoop()}>
                  {playing ? '■' : '▶'} {playing ? 'STOP' : 'PLAY'}
                </button>
                {hasPattern && !playing && !recording && (
                  <button className="loop-clear"
                    onClick={() => { patternRef.current=[]; setHasPattern(false); setDisplay('Cleared'); }}>✕</button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── Sequencer ── */}
        <div className="seq-section">

          {/* Header row 1: label + swing */}
          <div className="seq-hdr1">
            <span className="seq-label">SEQUENCER</span>
            <div className="swing-group">
              <span className="ctrl-label">SWING</span>
              <div className="slider-track swing-slider">
                <div className="slider-fill" style={{ width:`${(swing/70)*100}%` }} />
                <input type="range" min="0" max="70" step="1" className="vol-range"
                  value={swing} disabled={!power}
                  onChange={e => setSwing(+e.target.value)} />
              </div>
              <span className="ctrl-val swing-val">{swing > 0 ? `${swing}%` : 'off'}</span>
            </div>
          </div>

          {/* Header row 2: slots + actions */}
          <div className="seq-hdr2">
            <div className="slot-group">
              <button className={`slot-btn${slot==='A'?' sel':''}`} disabled={!power} onClick={() => switchSlot('A')}>A</button>
              <button className={`slot-btn${slot==='B'?' sel':''}`} disabled={!power} onClick={() => switchSlot('B')}>B</button>
            </div>
            <div className="seq-sep" />
            {PRESETS.map(p => (
              <button key={p.name} className="preset-btn" disabled={!power} onClick={() => applyPreset(p)}>
                {p.name}
              </button>
            ))}
            <button className="preset-btn clear-btn" disabled={!power} onClick={clearSteps}>Clear</button>
            <button className="preset-btn rand-btn"  disabled={!power} onClick={randomize}>Random</button>
            <button className={`share-btn${shareCopied?' copied':''}`} onClick={handleShare}>
              {shareCopied ? '✓ Copied' : '↗ Share'}
            </button>
            <button className={`seq-play-btn${seqPlaying?' playing':''}`} disabled={!power}
              onClick={() => setSeqPlaying(p => !p)}>
              {seqPlaying ? '■ STOP' : '▶ START'}
            </button>
          </div>

          {/* Beat number labels */}
          <div className="seq-nums-row">
            <div className="seq-row-label" />
            <div className="seq-grid">
              {Array(16).fill(0).map((_, i) => (
                <span key={i} className={`step-num${i%4===0?' beat':''}${currentStep===i&&seqPlaying?' now':''}`}>
                  {i%4===0 ? i/4+1 : '·'}
                </span>
              ))}
            </div>
          </div>

          {/* Step rows */}
          {bank.pads.map(pad => (
            <div key={pad.key} className={`seq-row${muted[pad.key] ? ' row-muted' : ''}`}>
              <div className="seq-row-label">
                <button
                  className={`mute-btn${muted[pad.key] ? ' muted' : ''}`}
                  onClick={() => toggleMute(pad.key)}
                  title={muted[pad.key] ? 'Unmute' : 'Mute'}
                >M</button>
                <span className="sq-key">{pad.key}</span>
                <span className="sq-name">{pad.name}</span>
              </div>
              <div className="seq-grid">
                {Array(16).fill(0).map((_, i) => {
                  const val = steps[pad.key]?.[i] ?? 0;
                  return (
                    <button
                      key={i}
                      className={[
                        'step',
                        val === 1 ? 'ghost'  : '',
                        val === 2 ? 'on'     : '',
                        val === 3 ? 'accent' : '',
                        currentStep === i && seqPlaying ? 'now' : '',
                        i % 4 === 0 ? 'beat-start' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => toggleStep(pad.key, i)}
                      disabled={!power}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Velocity legend */}
          <div className="vel-legend">
            <span className="vel-dot ghost-dot" />ghost
            <span className="vel-dot on-dot" />normal
            <span className="vel-dot accent-dot" />accent
            <span className="vel-hint">· click to cycle</span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Waveform canvas ───────────────────────────────────────────────────────────
function Waveform() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    function draw() {
      raf = requestAnimationFrame(draw);
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      if (!_analyser) {
        ctx.strokeStyle = 'rgba(245,158,11,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke();
        return;
      }

      const bufLen = _analyser.frequencyBinCount;
      const data   = new Uint8Array(bufLen);
      _analyser.getByteTimeDomainData(data);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth   = 1.5;
      ctx.shadowColor = 'rgba(245,158,11,0.55)';
      ctx.shadowBlur  = 5;
      ctx.beginPath();
      const sw = W / bufLen;
      for (let i = 0; i < bufLen; i++) {
        const y = (data[i] / 128) * (H / 2);
        i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i * sw, y);
      }
      ctx.stroke();
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} className="waveform-canvas" width="300" height="50" />;
}

function PowerSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}
