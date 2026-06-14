import React, { useEffect, useRef, useState } from 'react';

function displayTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function Pomodoro() {
  const [studyMinutes, setStudyMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(studyMinutes * 60);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setSecondsLeft((mode === 'study' ? studyMinutes : breakMinutes) * 60);
  }, [studyMinutes, breakMinutes, mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            // switch modes
            const nextMode = mode === 'study' ? 'break' : 'study';
            setMode(nextMode);
            return (nextMode === 'study' ? studyMinutes : breakMinutes) * 60;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, mode, studyMinutes, breakMinutes]);

  const handleStartPause = () => setRunning((r) => !r);
  const handleReset = () => {
    setRunning(false);
    setMode('study');
    setSecondsLeft(studyMinutes * 60);
  };

  return (
    <section className="section-grid" aria-label="Pomodoro timer">
      <div className="card">
        <h1 className="page-title">Pomodoro Timer</h1>
        <p>Customize your study and break durations while the ecosystem responds with gentle animations.</p>
      </div>

      <div className="card">
        <h2>Timer Settings</h2>
        <div className="timer-panel">
          <label>
            Study (minutes)
            <input type="number" min={1} value={studyMinutes} onChange={(e) => setStudyMinutes(Number(e.target.value) || 1)} />
          </label>
          <label>
            Break (minutes)
            <input type="number" min={1} value={breakMinutes} onChange={(e) => setBreakMinutes(Number(e.target.value) || 1)} />
          </label>
          <div className="timer-display">
            <div className={`timer-mode ${mode}`}>{mode === 'study' ? 'Study' : 'Break'}</div>
            <div className="timer-count">{displayTime(secondsLeft)}</div>
            <div className="timer-controls">
              <button className="submit-button" type="button" onClick={handleStartPause}>{running ? 'Pause' : 'Start'}</button>
              <button className="submit-button" type="button" onClick={handleReset}>Reset</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Break Mode</h2>
        <div className="preview-panel">When break time begins, the ecosystem visual gently changes to help you relax.</div>
      </div>
    </section>
  );
}

export default Pomodoro;
