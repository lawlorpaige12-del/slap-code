function Pomodoro() {
  return (
    <section className="section-grid" aria-label="Pomodoro timer">
      <div className="card">
        <h1 className="page-title">Pomodoro Timer</h1>
        <p>Customize your study and break durations while the ecosystem responds with gentle animations.</p>
      </div>

      <div className="card">
        <h2>Timer Settings</h2>
        <div className="preview-panel">Default study: 25 min, break: 5 min. Customize both values to fit your workflow.</div>
      </div>

      <div className="card">
        <h2>Break Mode</h2>
        <div className="preview-panel">When break time begins, rain nurtures the ecosystem and provides a calm recharge.</div>
      </div>
    </section>
  );
}

export default Pomodoro;
