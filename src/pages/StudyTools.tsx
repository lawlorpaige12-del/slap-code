function StudyTools() {
  const tools = [
    'AI Tutor',
    'Flashcard Generator',
    'Quiz Generator',
    'Note Summarizer',
    'Practice Question Creator',
    'Formula Sheet Generator',
    'Study Guides',
    'Focus Music',
    'Assignment Breakdown Tool',
  ];

  return (
    <section className="section-grid" aria-label="Study tools hub">
      <div className="card">
        <h1 className="page-title">Study Tools</h1>
        <p>Today&apos;s productivity tools are ready to help you learn more efficiently.</p>
      </div>

      <div className="card tool-grid">
        {tools.map((tool) => (
          <article key={tool} className="card tool-card">
            <strong>{tool}</strong>
            <p>Tap to explore the next productivity tool.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default StudyTools;
