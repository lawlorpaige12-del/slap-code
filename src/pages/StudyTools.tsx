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
        <h1 className="page-title">Study Tools Coming Soon.</h1>
        <p>We are building helpful study tools. Check back soon — exciting features are on the way.</p>
      </div>

      <div className="card tool-grid">
        {tools.map((tool) => (
          <article key={tool} className="card tool-card">
            <strong>{tool}</strong>
            <p>Coming soon — we&apos;ll surface this tool here once ready.</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default StudyTools;
