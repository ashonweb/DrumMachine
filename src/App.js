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
    gain.gain.value = vol;
    src.connect(gain);
    if (rvb && _reverb) {
      const dry = _ctx.createGain(); dry.gain.value = 0.5; gain.connect(dry); dry.connect(_master);
      const wet = _ctx.createGain(); wet.gain.value = 0.7; gain.connect(wet); wet.connect(_reverb);
    } else {
      gain.connect(_master);
    }
    src.start();
  } catch (_e) {
    const a = new Audio(url); a.volume = vol; a.play().catch(() => {});
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE     = 'https://s3.amazonaws.com/freecodecamp/drums/';
const PAD_KEYS = ['Q','W','E','A','S','D','Z','X','C'];

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

const EMPTY_STEPS = () =>
  Object.fromEntries(PAD_KEYS.map(k => [k, Array(16).fill(false)]));

const PRESETS = [
  {
    name: 'Boom Bap',
    steps: {
      X: [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0],
      S: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      C: [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0],
      D: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    },
  },
  {
    name: '4 on Floor',
    steps: {
      X: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
      S: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
      C: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      D: [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1],
    },
  },
  {
    name: 'Breakbeat',
    steps: {
      X: [1,0,0,1,0,0,1,0,1,0,0,0,0,1,0,0],
      S: [0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0],
      C: [1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0],
      Z: [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
    },
  },
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [power,       setPower]       = useState(true);
  const [bankIdx,     setBankIdx]     = useState(0);
  const [volume,      setVolume]      = useState(0.8);
  const [display,     setDisplay]     = useState('');
  const [active,      setActive]      = useState(new Set());
  const [recording,   setRecording]   = useState(false);
  const [playing,     setPlaying]     = useState(false);
  const [hasPattern,  setHasPattern]  = useState(false);
  const [bpm,         setBpm]         = useState(120);
  const [reverb,      setReverb]      = useState(false);
  const [seqPlaying,  setSeqPlaying]  = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [steps,       setSteps]       = useState(EMPTY_STEPS);

  const powerRef     = useRef(true);
  const bankRef      = useRef(0);
  const volumeRef    = useRef(0.8);
  const reverbRef    = useRef(false);
  const recordingRef = useRef(false);
  const bpmRef       = useRef(120);
  const stepsRef     = useRef(steps);
  const recStartRef  = useRef(null);
  const patternRef   = useRef([]);
  const loopIdsRef   = useRef([]);
  const isLoopingRef = useRef(false);
  const seqTimerRef  = useRef(null);
  const tapTimesRef  = useRef([]);
  const tapResetRef  = useRef(null);

  useEffect(() => { powerRef.current     = power;    }, [power]);
  useEffect(() => { bankRef.current      = bankIdx;  }, [bankIdx]);
  useEffect(() => { volumeRef.current    = volume;   }, [volume]);
  useEffect(() => { reverbRef.current    = reverb;   }, [reverb]);
  useEffect(() => { recordingRef.current = recording;}, [recording]);
  useEffect(() => { bpmRef.current       = bpm;      }, [bpm]);
  useEffect(() => { stepsRef.current     = steps;    }, [steps]);

  // Pre-fetch sounds when bank changes
  useEffect(() => {
    BANKS[bankIdx].pads.forEach(p => fetchBuffer(p.url).catch(() => {}));
  }, [bankIdx]);

  const flashPad = useCallback((key) => {
    setActive(s => new Set(s).add(key));
    setTimeout(() => setActive(s => { const n = new Set(s); n.delete(key); return n; }), 200);
  }, []);

  const triggerPad = useCallback((key) => {
    if (!powerRef.current) return;
    const pad = BANKS[bankRef.current].pads.find(p => p.key === key);
    if (!pad) return;
    playAudio(pad.url, volumeRef.current, reverbRef.current);
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

  // Sequencer — recursive setTimeout so BPM changes take effect next step
  useEffect(() => {
    if (!seqPlaying) { setCurrentStep(-1); return; }
    let step = 0;
    function tick() {
      const ms = (60 / bpmRef.current / 4) * 1000; // eslint-disable-line react-hooks/exhaustive-deps
      setCurrentStep(step);
      Object.entries(stepsRef.current).forEach(([key, arr]) => { // eslint-disable-line react-hooks/exhaustive-deps
        if (arr[step]) triggerPad(key);
      });
      step = (step + 1) % 16;
      seqTimerRef.current = setTimeout(tick, ms);
    }
    seqTimerRef.current = setTimeout(tick, (60 / bpmRef.current / 4) * 1000); // eslint-disable-line react-hooks/exhaustive-deps
    return () => clearTimeout(seqTimerRef.current);
  }, [seqPlaying, triggerPad]);

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

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  function toggleStep(key, i) {
    setSteps(prev => ({ ...prev, [key]: prev[key].map((v, j) => j === i ? !v : v) }));
  }

  function applyPreset(preset) {
    const s = EMPTY_STEPS();
    Object.entries(preset.steps).forEach(([key, arr]) => { s[key] = arr.map(Boolean); });
    setSteps(s);
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
                {recording && <span className="disp-badge rec-badge">● REC</span>}
                {playing   && <span className="disp-badge play-badge">▶ LOOP</span>}
                {seqPlaying && <span className="disp-badge seq-badge">◉ {bpm} BPM</span>}
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
          <div className="seq-toprow">
            <span className="seq-label">SEQUENCER</span>
            <div className="seq-actions">
              {PRESETS.map(p => (
                <button key={p.name} className="preset-btn" disabled={!power} onClick={() => applyPreset(p)}>
                  {p.name}
                </button>
              ))}
              <button className="preset-btn clear-btn" onClick={() => setSteps(EMPTY_STEPS)}>Clear</button>
              <button className={`seq-play-btn${seqPlaying?' playing':''}`} disabled={!power}
                onClick={() => setSeqPlaying(p => !p)}>
                {seqPlaying ? '■ STOP' : '▶ START'}
              </button>
            </div>
          </div>

          {/* Beat numbers */}
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
            <div key={pad.key} className="seq-row">
              <div className="seq-row-label">
                <span className="sq-key">{pad.key}</span>
                <span className="sq-name">{pad.name}</span>
              </div>
              <div className="seq-grid">
                {Array(16).fill(0).map((_, i) => (
                  <button
                    key={i}
                    className={`step${steps[pad.key]?.[i]?' on':''}${currentStep===i&&seqPlaying?' now':''}${i%4===0?' beat-start':''}`}
                    onClick={() => toggleStep(pad.key, i)}
                    disabled={!power}
                  />
                ))}
              </div>
            </div>
          ))}
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
