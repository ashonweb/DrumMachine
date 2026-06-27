import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const BASE = 'https://s3.amazonaws.com/freecodecamp/drums/';

const BANKS = [
  {
    id: 'heater',
    name: 'Heater Kit',
    pads: [
      { key: 'Q', name: 'Heater 1',    url: BASE + 'Heater-1.mp3'         },
      { key: 'W', name: 'Heater 2',    url: BASE + 'Heater-2.mp3'         },
      { key: 'E', name: 'Heater 3',    url: BASE + 'Heater-3.mp3'         },
      { key: 'A', name: 'Heater 4',    url: BASE + 'Heater-4_1.mp3'       },
      { key: 'S', name: 'Clap',        url: BASE + 'Heater-6.mp3'         },
      { key: 'D', name: 'Open HH',     url: BASE + 'Dsc_Oh.mp3'           },
      { key: 'Z', name: 'Kick + HH',   url: BASE + 'Kick_n_Hat.mp3'       },
      { key: 'X', name: 'Kick',        url: BASE + 'RP4_KICK_1.mp3'       },
      { key: 'C', name: 'Closed HH',   url: BASE + 'Cev_H2.mp3'          },
    ],
  },
  {
    id: 'smooth',
    name: 'Smooth Piano',
    pads: [
      { key: 'Q', name: 'Chord 1',     url: BASE + 'Chord_1.mp3'          },
      { key: 'W', name: 'Chord 2',     url: BASE + 'Chord_2.mp3'          },
      { key: 'E', name: 'Chord 3',     url: BASE + 'Chord_3.mp3'          },
      { key: 'A', name: 'Give Light',  url: BASE + 'Give_us_a_light.mp3'  },
      { key: 'S', name: 'Dry Ohh',     url: BASE + 'Dry_Ohh.mp3'          },
      { key: 'D', name: 'Bld H1',      url: BASE + 'Bld_H1.mp3'          },
      { key: 'Z', name: 'Punchy Kick', url: BASE + 'punchy_kick_1.mp3'    },
      { key: 'X', name: 'Side Stick',  url: BASE + 'side_stick_1.mp3'     },
      { key: 'C', name: 'Snare',       url: BASE + 'Brk_Snr.mp3'         },
    ],
  },
];

export default function App() {
  const [power, setPower]           = useState(true);
  const [bankIdx, setBankIdx]       = useState(0);
  const [volume, setVolume]         = useState(0.8);
  const [display, setDisplay]       = useState('');
  const [active, setActive]         = useState(new Set());
  const [recording, setRecording]   = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [hasPattern, setHasPattern] = useState(false);

  const powerRef      = useRef(true);
  const bankRef       = useRef(0);
  const volumeRef     = useRef(0.8);
  const recordingRef  = useRef(false);
  const recStartRef   = useRef(null);
  const patternRef    = useRef([]);
  const timeoutsRef   = useRef([]);
  const isPlayingRef  = useRef(false);

  useEffect(() => { powerRef.current     = power;    }, [power]);
  useEffect(() => { bankRef.current      = bankIdx;  }, [bankIdx]);
  useEffect(() => { volumeRef.current    = volume;   }, [volume]);
  useEffect(() => { recordingRef.current = recording;}, [recording]);

  const flashPad = useCallback((key) => {
    setActive(s => new Set(s).add(key));
    setTimeout(() => setActive(s => { const n = new Set(s); n.delete(key); return n; }), 200);
  }, []);

  const triggerPad = useCallback((key) => {
    if (!powerRef.current) return;
    const pad = BANKS[bankRef.current].pads.find(p => p.key === key);
    if (!pad) return;
    const a = new Audio(pad.url);
    a.volume = volumeRef.current;
    a.play().catch(() => {});
    setDisplay(pad.name);
    flashPad(key);
    if (recordingRef.current && recStartRef.current !== null) {
      patternRef.current.push({ key, t: Date.now() - recStartRef.current });
    }
  }, [flashPad]);

  useEffect(() => {
    function onKey(e) {
      if (e.repeat) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && 'QWEASDZXC'.includes(k)) triggerPad(k);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [triggerPad]);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setPlaying(false);
    setDisplay('');
  }, []);

  const scheduleLoop = useCallback(() => {
    const pat = patternRef.current;
    if (!pat.length) return;
    const duration = pat[pat.length - 1].t + 500;
    pat.forEach(({ key, t }) => {
      const id = setTimeout(() => { if (isPlayingRef.current) triggerPad(key); }, t);
      timeoutsRef.current.push(id);
    });
    const id = setTimeout(() => { if (isPlayingRef.current) scheduleLoop(); }, duration);
    timeoutsRef.current.push(id);
  }, [triggerPad]);

  const startPlayback = useCallback(() => {
    if (!patternRef.current.length) return;
    isPlayingRef.current = true;
    setPlaying(true);
    setDisplay('Looping…');
    scheduleLoop();
  }, [scheduleLoop]);

  function handlePower() {
    const next = !power;
    setPower(next);
    if (!next) { stopPlayback(); setRecording(false); setDisplay(''); }
  }

  function handleBankSwitch(i) {
    setBankIdx(i);
    setDisplay(BANKS[i].name);
    stopPlayback();
    setHasPattern(false);
    patternRef.current = [];
  }

  function handleRecToggle() {
    if (recording) {
      setRecording(false);
      const n = patternRef.current.length;
      setHasPattern(n > 0);
      setDisplay(n > 0 ? `${n} hits saved` : 'Nothing recorded');
    } else {
      patternRef.current = [];
      recStartRef.current = Date.now();
      setRecording(true);
      setDisplay('Recording…');
    }
  }

  function handleClearPattern() {
    patternRef.current = [];
    setHasPattern(false);
    setDisplay('Pattern cleared');
  }

  const bank = BANKS[bankIdx];

  return (
    <div className={`app${power ? '' : ' off'}`}>
      {/* Background grid lines */}
      <div className="bg-grid" aria-hidden="true" />

      <div className="shell">
        {/* Top bar */}
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

        <div className="machine-body">
          {/* ── Left: pad grid ── */}
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

          {/* ── Right: controls ── */}
          <div className="ctrl-panel">
            {/* Display */}
            <div className="display">
              <div className="display-scanlines" aria-hidden="true" />
              <span className="display-text">
                {display || (power ? ' ' : 'POWER OFF')}
              </span>
              {recording && <span className="display-rec">● REC</span>}
              {playing   && <span className="display-play">▶ LOOP</span>}
            </div>

            {/* Volume */}
            <div className="ctrl-group">
              <div className="ctrl-head">
                <span className="ctrl-label">VOLUME</span>
                <span className="ctrl-val">{Math.round(volume * 100)}</span>
              </div>
              <div className="slider-track">
                <div
                  className="slider-fill"
                  style={{ width: `${volume * 100}%` }}
                />
                <input
                  type="range" min="0" max="1" step="0.01"
                  className="vol-range"
                  value={volume}
                  disabled={!power}
                  onChange={e => {
                    const v = +e.target.value;
                    setVolume(v);
                    setDisplay(`Volume ${Math.round(v * 100)}%`);
                  }}
                />
              </div>
            </div>

            {/* Bank */}
            <div className="ctrl-group">
              <span className="ctrl-label">SOUND BANK</span>
              <div className="bank-row">
                {BANKS.map((b, i) => (
                  <button
                    key={b.id}
                    className={`bank-btn${bankIdx === i ? ' sel' : ''}`}
                    disabled={!power}
                    onClick={() => handleBankSwitch(i)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Loop */}
            <div className="ctrl-group">
              <span className="ctrl-label">LOOP</span>
              <div className="loop-row">
                <button
                  className={`loop-btn rec-btn${recording ? ' active' : ''}${hasPattern && !recording ? ' has' : ''}`}
                  disabled={!power || playing}
                  onClick={handleRecToggle}
                >
                  <span className="loop-icon">{recording ? '■' : '●'}</span>
                  {recording ? 'STOP' : 'REC'}
                </button>
                <button
                  className={`loop-btn play-btn${playing ? ' active' : ''}`}
                  disabled={!power || !hasPattern || recording}
                  onClick={() => playing ? stopPlayback() : startPlayback()}
                >
                  <span className="loop-icon">{playing ? '■' : '▶'}</span>
                  {playing ? 'STOP' : 'PLAY'}
                </button>
                {hasPattern && !playing && !recording && (
                  <button className="loop-clear" onClick={handleClearPattern} aria-label="Clear pattern">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Keys hint */}
            <div className="keys-hint">
              {['Q','W','E','A','S','D','Z','X','C'].map(k => (
                <span key={k} className={`hint-key${active.has(k) ? ' lit' : ''}`}>{k}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PowerSVG() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}
