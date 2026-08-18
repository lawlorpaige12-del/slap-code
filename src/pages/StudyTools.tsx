import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

type ToolKey = 'flashcards' | 'summary' | 'quiz' | 'studyguide';

type Flashcard = {
  id: string;
  front: string;
  back: string;
};

type SummarySection = {
  title: string;
  items: string[];
};

type SummaryResult = {
  overview: string;
  sections: SummarySection[];
};

type QuizType = 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';

type QuizQuestion = {
  id: string;
  type: QuizType;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type StudyGuide = {
  subject: string;
  course: string;
  unit: string;
  overview: string;
  sections: SummarySection[];
  formulaSheet?: {
    title: string;
    formulas: Array<{ formula: string; meaning: string }>;
  };
};

const STORAGE_KEY = 'slap-study-tools-output';

const toolCards = [
  {
    id: 'flashcards' as ToolKey,
    title: 'Flashcard Generator',
    description: 'Generate interactive flashcards from study material.',
  },
  {
    id: 'summary' as ToolKey,
    title: 'Note Summarizer',
    description: 'Turn notes and study material into organized summaries.',
  },
  {
    id: 'quiz' as ToolKey,
    title: 'Quiz & Practice Question Generator',
    description: 'Generate and complete interactive quizzes and practice questions.',
  },
  {
    id: 'studyguide' as ToolKey,
    title: 'Study Guides',
    description: 'Generate comprehensive study guides with contextual formula sheets when applicable.',
  },
];

const normalizeText = (value: string) => value.replace(/\s+/g, ' ').trim();

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const shuffleArray = <T,>(items: T[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickTopicLabel = (topic: string, material: string) => {
  const value = normalizeText(topic || material || 'Study topic');
  return value.length > 70 ? `${value.slice(0, 67)}…` : value;
};

const extractFacts = (topic: string, material: string) => {
  const source = `${topic} ${material}`.replace(/\s+/g, ' ').trim();
  const sentences = source
    .split(/(?<=[.!?])\s+|\n+/)
    .map((entry) => normalizeText(entry).replace(/^[\-•\*\d.\s]+/, ''))
    .filter((entry) => entry.length > 24 && entry.length < 220)
    .map((entry) => entry.replace(/[\s]+$/, ''));

  if (sentences.length === 0) {
    const fallbackTopic = normalizeText(topic || 'study guide');
    return [
      `${fallbackTopic} focuses on the key ideas students need to recall and apply.` ,
      `Students should connect the main concept to concrete examples and practice questions.`,
      `Reviewing definitions, relationships, and common mistakes helps improve retention.`,
    ];
  }

  const uniqueFacts = Array.from(new Set(sentences));
  return uniqueFacts.slice(0, 12);
};

const buildFlashcards = (topic: string, material: string): Flashcard[] => {
  const facts = extractFacts(topic, material);

  return facts.slice(0, 6).map((fact, index) => {
    const cleanFact = fact.replace(/[.]+$/, '');
    const words = cleanFact.split(' ');
    const keyPhrase = words.slice(0, Math.min(words.length, 7)).join(' ');
    const question = /is|are|means|refers|defines|includes|contains|involves/i.test(cleanFact)
      ? `What does ${keyPhrase} mean?`
      : /because|causes|results|requires|depends|happens|occurs|influences|leads|affects/i.test(cleanFact)
        ? `Why does ${keyPhrase} matter?`
        : `What is the key idea behind ${keyPhrase}?`;

    return {
      id: createId(`flash-${index}`),
      front: question,
      back: cleanFact,
    };
  });
};

const buildSummary = (topic: string, material: string): SummaryResult => {
  const facts = extractFacts(topic, material);
  const topicName = pickTopicLabel(topic, material);
  const mainConcepts = facts.slice(0, 3);
  const definitions = facts.filter((fact) => /is|are|means|refers|defines|called|known/i.test(fact)).slice(0, 3);
  const keyFacts = facts.slice(3, 6);
  const relationships = facts
    .filter((fact) => /because|results|causes|affects|influences|depends|connects|relates/i.test(fact))
    .slice(0, 2);
  const examples = facts.filter((fact) => /example|such as|for example|when|if/i.test(fact)).slice(0, 2);

  return {
    overview: `This summary for ${topicName} focuses on the key ideas, definitions, and relationships students are most likely to need in class or during review.`,
    sections: [
      { title: 'Main concepts', items: mainConcepts.length ? mainConcepts : ['The topic centers on the most important idea students should understand and apply.'] },
      { title: 'Important definitions', items: definitions.length ? definitions : ['Definitions should be memorized alongside examples so students can apply them accurately.'] },
      { title: 'Key facts', items: keyFacts.length ? keyFacts : ['Key facts should be reviewed repeatedly and connected to the central concept.'] },
      { title: 'Relationships between concepts', items: relationships.length ? relationships : ['The main idea is strengthened when students see how it connects to related terms, steps, or consequences.'] },
      { title: 'Examples to remember', items: examples.length ? examples : ['Use one or two concrete examples to connect abstract ideas to a real situation.'] },
    ],
  };
};

const buildQuizQuestions = (
  topic: string,
  material: string,
  count: number,
  difficulty: string,
  type: QuizType
): QuizQuestion[] => {
  const facts = extractFacts(topic, material);
  const sourceFacts = facts.length ? facts : [`${topic || 'This subject'} has several core ideas worth reviewing.`];

  const questions: QuizQuestion[] = [];

  for (let index = 0; index < Math.max(1, count); index += 1) {
    const fact = sourceFacts[index % sourceFacts.length];
    const questionType = type === 'mixed'
      ? (index % 3 === 0 ? 'multiple-choice' : index % 3 === 1 ? 'true-false' : 'short-answer')
      : type;

    if (questionType === 'multiple-choice') {
      const distractors = shuffleArray(
        sourceFacts.filter((entry) => entry !== fact).slice(0, 3).length
          ? sourceFacts.filter((entry) => entry !== fact).slice(0, 3)
          : [
              `The topic is primarily about making random guesses without reviewing the material.`,
              `The main idea is unrelated to the course concept and should be ignored.`,
              `The most likely answer is simply to copy the notes word for word without thinking.`,
            ]
      );

      const options = shuffleArray([fact, ...distractors.slice(0, 3)]);
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'multiple-choice',
        prompt: `Which statement best reflects the most important idea in ${pickTopicLabel(topic, material)} at ${difficulty.toLowerCase()} difficulty?`,
        options,
        correctAnswer: fact,
        explanation: `${fact} is the best answer because it directly captures the central concept and matches the evidence in the study material.`,
      });
    } else if (questionType === 'true-false') {
      const isTrue = index % 2 === 0;
      const statement = isTrue ? fact : `The main idea in ${pickTopicLabel(topic, material)} is unrelated to the evidence and examples students reviewed.`;
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'true-false',
        prompt: `True or False: ${statement}`,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: isTrue
          ? `${fact} is true and it supports the central concept students should understand.`
          : `This statement is false because the evidence points to a clear relationship between the topic and the supporting material.`,
      });
    } else {
      const prompt = `In your own words, explain the main idea behind ${pickTopicLabel(topic, material)} and how it connects to the material you studied.`;
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'short-answer',
        prompt,
        correctAnswer: fact,
        explanation: `A strong answer should explain the central idea and connect it to the example or evidence in the notes.`,
      });
    }
  }

  return questions;
};

const isShortAnswerCorrect = (question: QuizQuestion, answer: string) => {
  const candidate = normalizeText(answer || '').toLowerCase();
  if (!candidate) return false;
  const correct = normalizeText(question.correctAnswer || '').toLowerCase();
  const tokens = correct.split(/\s+/).filter((word) => word.length > 3);
  if (!tokens.length) return false;
  return tokens.some((token) => candidate.includes(token));
};

const buildStudyGuide = (subject: string, course: string, unit: string, material: string): StudyGuide => {
  const resolvedSubject = normalizeText(subject || 'Study subject');
  const resolvedCourse = normalizeText(course || 'Course');
  const resolvedUnit = normalizeText(unit || 'Core topics');
  const facts = extractFacts(resolvedSubject, material);
  const includeFormulaSheet = /(physics|chemistry|biology|math|algebra|geometry|calculus|statistics|engineering|economics|astronomy|mechanics|thermodynamics)/i.test(
    `${resolvedSubject} ${resolvedCourse} ${material}`
  );

  const formulaSheet = includeFormulaSheet
    ? {
        title: 'Formula Sheet',
        formulas: [
          ...(resolvedSubject.toLowerCase().includes('physics')
            ? [
                { formula: 'v = d / t', meaning: 'Average velocity equals distance divided by time.' },
                { formula: 'F = ma', meaning: 'Net force equals mass times acceleration.' },
                { formula: 'E = mc²', meaning: 'Energy equals mass times the speed of light squared.' },
              ]
            : []),
          ...(resolvedSubject.toLowerCase().includes('chemistry')
            ? [
                { formula: 'pH = -log[H+]', meaning: 'pH is the negative logarithm of hydrogen ion concentration.' },
                { formula: 'PV = nRT', meaning: 'Pressure times volume equals moles times the gas constant times temperature.' },
              ]
            : []),
          ...(resolvedSubject.toLowerCase().includes('math') || resolvedSubject.toLowerCase().includes('algebra') || resolvedSubject.toLowerCase().includes('geometry')
            ? [
                { formula: 'm = (y2 - y1) / (x2 - x1)', meaning: 'Slope equals the change in y divided by the change in x.' },
                { formula: 'A = lw', meaning: 'Area of a rectangle equals length times width.' },
              ]
            : []),
          ...(resolvedSubject.toLowerCase().includes('biology')
            ? [
                { formula: 'p + q = 1', meaning: 'In a simple population model, the frequency of dominant and recessive traits sums to one.' },
              ]
            : []),
        ],
      }
    : undefined;

  const sections: SummarySection[] = [
    {
      title: 'Key concepts',
      items: facts.slice(0, 3).length ? facts.slice(0, 3) : ['Focus on the central idea, the supporting evidence, and the key vocabulary.'],
    },
    {
      title: 'Important definitions',
      items: facts.filter((fact) => /is|are|means|refers|defines|called/i.test(fact)).slice(0, 3).length
        ? facts.filter((fact) => /is|are|means|refers|defines|called/i.test(fact)).slice(0, 3)
        : ['Memorize the definition in your own words and connect it to a concrete example.'],
    },
    {
      title: 'Important facts',
      items: facts.slice(2, 5).length ? facts.slice(2, 5) : ['Use the notes to identify the evidence and details that support the larger concept.'],
    },
    {
      title: 'Common mistakes',
      items: [
        'Do not memorize isolated details without understanding how they connect to the main idea.',
        'Check that your answer uses the correct vocabulary and units or steps for the task.',
      ],
    },
    {
      title: 'Key relationships',
      items: [
        'Connect the concept to examples, prerequisites, and outcomes so the idea becomes easier to remember.',
        'Review how the concept changes across a problem, diagram, or experiment.'
      ],
    },
  ];

  if (formulaSheet) {
    sections.push({
      title: 'Formula Sheet',
      items: formulaSheet.formulas.map((entry) => `${entry.formula} — ${entry.meaning}`),
    });
  }

  return {
    subject: resolvedSubject,
    course: resolvedCourse,
    unit: resolvedUnit,
    overview: `This guide for ${resolvedSubject} in ${resolvedCourse} highlights the most useful ideas, vocabulary, and relationships for ${resolvedUnit}.`,
    sections,
    formulaSheet,
  };
};

function StudyTools() {
  const { awardXp } = useAuth();
  const [selectedTool, setSelectedTool] = useState<ToolKey>('flashcards');
  const [flashTopic, setFlashTopic] = useState('');
  const [flashMaterial, setFlashMaterial] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [flashError, setFlashError] = useState('');

  const [summaryTopic, setSummaryTopic] = useState('');
  const [summaryMaterial, setSummaryMaterial] = useState('');
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState('');

  const [quizTopic, setQuizTopic] = useState('');
  const [quizMaterial, setQuizMaterial] = useState('');
  const [quizCount, setQuizCount] = useState(4);
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizType, setQuizType] = useState<QuizType>('mixed');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizError, setQuizError] = useState('');

  const [guideSubject, setGuideSubject] = useState('');
  const [guideCourse, setGuideCourse] = useState('');
  const [guideUnit, setGuideUnit] = useState('');
  const [guideMaterial, setGuideMaterial] = useState('');
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [guideError, setGuideError] = useState('');

  const [savedOutput, setSavedOutput] = useState({
    flashcards: [] as Flashcard[],
    summary: null as SummaryResult | null,
    quiz: [] as QuizQuestion[],
    guide: null as StudyGuide | null,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as typeof savedOutput;
      setSavedOutput(parsed || savedOutput);
    } catch (error) {
      console.warn('Saved study outputs could not be loaded.', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedOutput));
    } catch (error) {
      console.warn('Saved study outputs could not be persisted.', error);
    }
  }, [savedOutput]);

  const saveDeck = () => {
    if (!flashcards.length) return;
    setSavedOutput((prev) => ({ ...prev, flashcards }));
  };

  const saveSummaryOutput = () => {
    if (!summary) return;
    setSavedOutput((prev) => ({ ...prev, summary }));
  };

  const saveQuizOutput = () => {
    if (!quizQuestions.length) return;
    setSavedOutput((prev) => ({ ...prev, quiz: quizQuestions }));
  };

  const saveGuideOutput = () => {
    if (!guide) return;
    setSavedOutput((prev) => ({ ...prev, guide }));
  };

  const handleGenerateFlashcards = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(flashTopic) && !normalizeText(flashMaterial)) {
      setFlashError('Add a topic or paste notes before generating flashcards.');
      return;
    }

    const deck = buildFlashcards(flashTopic, flashMaterial);
    setFlashcards(deck);
    setFlashIndex(0);
    setFlashFlipped(false);
    setFlashError('');
    awardXp(25);
    setSavedOutput((prev) => ({ ...prev, flashcards: deck }));
  };

  const handleGenerateSummary = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(summaryTopic) && !normalizeText(summaryMaterial)) {
      setSummaryError('Add a topic or paste notes before generating a summary.');
      return;
    }

    const result = buildSummary(summaryTopic, summaryMaterial);
    setSummary(result);
    setSummaryError('');
    setSavedOutput((prev) => ({ ...prev, summary: result }));
  };

  const handleGenerateQuiz = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(quizTopic) && !normalizeText(quizMaterial)) {
      setQuizError('Add a subject or notes before generating a quiz.');
      return;
    }

    const generated = buildQuizQuestions(quizTopic, quizMaterial, quizCount, quizDifficulty, quizType);
    setQuizQuestions(generated);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError('');
    awardXp(35);
    setSavedOutput((prev) => ({ ...prev, quiz: generated }));
  };

  const handleGenerateGuide = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(guideSubject) && !normalizeText(guideMaterial)) {
      setGuideError('Select a subject or describe what you want to study before creating a guide.');
      return;
    }

    const generated = buildStudyGuide(guideSubject, guideCourse, guideUnit, guideMaterial);
    setGuide(generated);
    setGuideError('');
    awardXp(30);
    setSavedOutput((prev) => ({ ...prev, guide: generated }));
  };

  const handleSubmitQuiz = () => {
    const answeredItems = Object.keys(quizAnswers).length;
    if (!answeredItems) {
      setQuizError('Answer at least one question before submitting the quiz.');
      return;
    }

    setQuizSubmitted(true);
    awardXp(40);
    setQuizError('');
  };

  const handleGenerateAnotherQuiz = () => {
    const generated = buildQuizQuestions(quizTopic, quizMaterial, quizCount, quizDifficulty, quizType);
    setQuizQuestions(generated);
    setQuizIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizError('');
    setSavedOutput((prev) => ({ ...prev, quiz: generated }));
  };

  const currentFlashcard = flashcards[flashIndex];
  const currentQuestion = quizQuestions[quizIndex];
  const quizScore = quizQuestions.length
    ? quizQuestions.reduce((score, question) => {
        const answer = quizAnswers[question.id] ?? '';
        const isCorrect = question.type === 'short-answer'
          ? isShortAnswerCorrect(question, answer)
          : answer === question.correctAnswer;
        return score + (isCorrect ? 1 : 0);
      }, 0)
    : 0;

  const incorrectQuestions = quizQuestions.filter((question) => {
    const answer = quizAnswers[question.id] ?? '';
    if (question.type === 'short-answer') {
      return !isShortAnswerCorrect(question, answer);
    }
    return answer !== question.correctAnswer;
  });

  const renderToolCard = (tool: (typeof toolCards)[number]) => (
    <button
      key={tool.id}
      type="button"
      className={`tool-card ${selectedTool === tool.id ? 'tool-card-active' : ''}`}
      onClick={() => setSelectedTool(tool.id)}
      aria-pressed={selectedTool === tool.id}
    >
      <strong>{tool.title}</strong>
      <span>{tool.description}</span>
    </button>
  );

  return (
    <section className="section-grid" aria-label="Study tools hub">
      <div className="card">
        <h1 className="page-title">Study Tools</h1>
        <p>Choose a study activity and create useful, exam-ready material in a few minutes.</p>
      </div>

      <div className="card">
        <div className="tool-grid" role="list" aria-label="Available study tools">
          {toolCards.map(renderToolCard)}
        </div>
      </div>

      <div className="card tool-panel">
        {selectedTool === 'flashcards' && (
          <div className="tool-content">
            <h2>Flashcard Generator</h2>
            <form className="tool-form" onSubmit={handleGenerateFlashcards}>
              <label>
                Topic
                <input value={flashTopic} onChange={(event) => setFlashTopic(event.target.value)} placeholder="Cell respiration, AP Biology, etc." />
              </label>
              <label>
                Study material or notes
                <textarea value={flashMaterial} onChange={(event) => setFlashMaterial(event.target.value)} placeholder="Paste class notes, textbook concepts, or your review material here." />
              </label>
              <div className="tool-actions">
                <button type="submit" className="primary-button">Generate flashcards</button>
                {flashcards.length > 0 && (
                  <button type="button" className="secondary-button" onClick={saveDeck}>Save deck</button>
                )}
                {flashcards.length > 0 && (
                  <button type="button" className="secondary-button" onClick={() => { setFlashcards([]); setFlashIndex(0); setFlashFlipped(false); }}>Delete deck</button>
                )}
              </div>
            </form>

            {flashError && <p className="error-text">{flashError}</p>}

            {flashcards.length > 0 && currentFlashcard ? (
              <div className="deck-panel" aria-live="polite">
                <div className="deck-header">
                  <span>Card {flashIndex + 1} / {flashcards.length}</span>
                  <button type="button" className="secondary-button" onClick={() => setFlashFlipped((prev) => !prev)}>
                    {flashFlipped ? 'Show front' : 'Flip card'}
                  </button>
                </div>

                <div className="flashcard" tabIndex={0} role="button" aria-label="Flashcard" onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setFlashFlipped((prev) => !prev);
                  }
                }} onClick={() => setFlashFlipped((prev) => !prev)}>
                  <strong>{flashFlipped ? 'Answer' : 'Question'}</strong>
                  <p>{flashFlipped ? currentFlashcard.back : currentFlashcard.front}</p>
                </div>

                <div className="tool-actions">
                  <button type="button" className="secondary-button" disabled={flashIndex === 0} onClick={() => setFlashIndex((prev) => Math.max(prev - 1, 0))}>Previous</button>
                  <button type="button" className="secondary-button" disabled={flashIndex >= flashcards.length - 1} onClick={() => setFlashIndex((prev) => Math.min(prev + 1, flashcards.length - 1))}>Next</button>
                  <button type="button" className="secondary-button" onClick={() => { setFlashIndex(0); setFlashFlipped(false); }}>Restart</button>
                  <button type="button" className="secondary-button" onClick={() => {
                    const deck = buildFlashcards(flashTopic || 'review', flashMaterial);
                    setFlashcards(deck);
                    setFlashIndex(0);
                    setFlashFlipped(false);
                  }}>Generate new deck</button>
                </div>
              </div>
            ) : (
              <div className="empty-state">Create a deck to start reviewing key concepts.</div>
            )}

            {savedOutput.flashcards.length > 0 && (
              <div className="saved-output">
                <h3>Saved flashcard deck</h3>
                <p>{savedOutput.flashcards.length} cards stored in this browser session.</p>
              </div>
            )}
          </div>
        )}

        {selectedTool === 'summary' && (
          <div className="tool-content">
            <h2>Note Summarizer</h2>
            <form className="tool-form" onSubmit={handleGenerateSummary}>
              <label>
                Topic
                <input value={summaryTopic} onChange={(event) => setSummaryTopic(event.target.value)} placeholder="Cell cycle, Civil War, etc." />
              </label>
              <label>
                Notes or study material
                <textarea value={summaryMaterial} onChange={(event) => setSummaryMaterial(event.target.value)} placeholder="Paste lecture notes, chapter sections, or review material here." />
              </label>
              <div className="tool-actions">
                <button type="submit" className="primary-button">Generate summary</button>
                {summary && (
                  <button type="button" className="secondary-button" onClick={saveSummaryOutput}>Save summary</button>
                )}
              </div>
            </form>

            {summaryError && <p className="error-text">{summaryError}</p>}

            {summary ? (
              <div className="summary-panel" aria-live="polite">
                <p className="summary-overview">{summary.overview}</p>
                {summary.sections.map((section) => (
                  <div key={section.title} className="summary-section">
                    <h3>{section.title}</h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={`${section.title}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button type="button" className="secondary-button" onClick={() => setSummary(buildSummary(summaryTopic, summaryMaterial))}>Generate another summary</button>
              </div>
            ) : (
              <div className="empty-state">Generate a study summary to organize key ideas and definitions.</div>
            )}

            {savedOutput.summary && (
              <div className="saved-output">
                <h3>Saved summary</h3>
                <p>{savedOutput.summary.overview}</p>
              </div>
            )}
          </div>
        )}

        {selectedTool === 'quiz' && (
          <div className="tool-content">
            <h2>Quiz &amp; Practice Question Generator</h2>
            <form className="tool-form" onSubmit={handleGenerateQuiz}>
              <label>
                Subject or topic
                <input value={quizTopic} onChange={(event) => setQuizTopic(event.target.value)} placeholder="World History, Biology, Algebra II" />
              </label>
              <label>
                Study material or notes
                <textarea value={quizMaterial} onChange={(event) => setQuizMaterial(event.target.value)} placeholder="Paste notes, practice material, or your unit summary." />
              </label>
              <div className="input-row two-up">
                <label>
                  Number of questions
                  <input type="number" min="1" max="10" value={quizCount} onChange={(event) => setQuizCount(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} />
                </label>
                <label>
                  Difficulty
                  <select value={quizDifficulty} onChange={(event) => setQuizDifficulty(event.target.value)}>
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>
              </div>
              <label>
                Question type
                <select value={quizType} onChange={(event) => setQuizType(event.target.value as QuizType)}>
                  <option value="multiple-choice">Multiple choice</option>
                  <option value="true-false">True/false</option>
                  <option value="short-answer">Short answer</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <div className="tool-actions">
                <button type="submit" className="primary-button">Generate quiz</button>
                {quizQuestions.length > 0 && (
                  <button type="button" className="secondary-button" onClick={saveQuizOutput}>Save quiz</button>
                )}
              </div>
            </form>

            {quizError && <p className="error-text">{quizError}</p>}

            {quizQuestions.length > 0 && currentQuestion ? (
              <div className="quiz-panel" aria-live="polite">
                <div className="deck-header">
                  <span>Question {quizIndex + 1} / {quizQuestions.length}</span>
                  {quizSubmitted && <strong>Score: {quizScore} / {quizQuestions.length}</strong>}
                </div>

                <h3>{currentQuestion.prompt}</h3>

                {currentQuestion.type === 'short-answer' ? (
                  <label>
                    Your response
                    <textarea
                      value={quizAnswers[currentQuestion.id] ?? ''}
                      onChange={(event) =>
                        setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: event.target.value }))
                      }
                      placeholder="Write your answer here."
                    />
                  </label>
                ) : (
                  <div className="option-list" role="list">
                    {currentQuestion.options?.map((option) => {
                      const isSelected = (quizAnswers[currentQuestion.id] ?? '') === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          className={`option-button ${isSelected ? 'option-selected' : ''}`}
                          onClick={() => setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }))}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {quizSubmitted && (
                  <div className="quiz-feedback">
                    <p>
                      {currentQuestion.type === 'short-answer'
                        ? isShortAnswerCorrect(currentQuestion, quizAnswers[currentQuestion.id] ?? '')
                          ? 'Your answer includes key ideas from the correct response.'
                          : `Expected idea: ${currentQuestion.correctAnswer}`
                        : (quizAnswers[currentQuestion.id] ?? '') === currentQuestion.correctAnswer
                          ? 'Correct.'
                          : `Correct answer: ${currentQuestion.correctAnswer}`}
                    </p>
                    <p>{currentQuestion.explanation}</p>
                  </div>
                )}

                <div className="tool-actions">
                  <button type="button" className="secondary-button" disabled={quizIndex === 0} onClick={() => setQuizIndex((prev) => Math.max(prev - 1, 0))}>Previous</button>
                  <button type="button" className="secondary-button" disabled={quizIndex >= quizQuestions.length - 1} onClick={() => setQuizIndex((prev) => Math.min(prev + 1, quizQuestions.length - 1))}>Next</button>
                  <button type="button" className="secondary-button" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizIndex(0); }}>Restart quiz</button>
                  <button type="button" className="primary-button" onClick={handleSubmitQuiz}>Submit quiz</button>
                </div>

                {quizSubmitted && incorrectQuestions.length > 0 && (
                  <div className="incorrect-review">
                    <h3>Review incorrect answers</h3>
                    <ul>
                      {incorrectQuestions.map((question) => (
                        <li key={question.id}>
                          <strong>{question.prompt}</strong>
                          <p>Correct answer: {question.correctAnswer}</p>
                          <p>{question.explanation}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {quizSubmitted && quizQuestions.length > 0 && (
                  <button type="button" className="secondary-button" onClick={handleGenerateAnotherQuiz}>Generate another quiz</button>
                )}
              </div>
            ) : (
              <div className="empty-state">Generate a quiz to practice your understanding and review explanations.</div>
            )}

            {savedOutput.quiz.length > 0 && (
              <div className="saved-output">
                <h3>Saved quiz</h3>
                <p>{savedOutput.quiz.length} questions saved in this browser session.</p>
              </div>
            )}
          </div>
        )}

        {selectedTool === 'studyguide' && (
          <div className="tool-content">
            <h2>Study Guides</h2>
            <form className="tool-form" onSubmit={handleGenerateGuide}>
              <label>
                Subject
                <input value={guideSubject} onChange={(event) => setGuideSubject(event.target.value)} placeholder="AP Physics, English Literature, AP Chemistry" />
              </label>
              <div className="input-row two-up">
                <label>
                  Course
                  <input value={guideCourse} onChange={(event) => setGuideCourse(event.target.value)} placeholder="AP Biology" />
                </label>
                <label>
                  Unit or topic
                  <input value={guideUnit} onChange={(event) => setGuideUnit(event.target.value)} placeholder="Cell transport" />
                </label>
              </div>
              <label>
                Material to study
                <textarea value={guideMaterial} onChange={(event) => setGuideMaterial(event.target.value)} placeholder="Paste chapter notes, key concepts, reading summaries, or formulas." />
              </label>
              <div className="tool-actions">
                <button type="submit" className="primary-button">Generate study guide</button>
                {guide && (
                  <button type="button" className="secondary-button" onClick={saveGuideOutput}>Save guide</button>
                )}
              </div>
            </form>

            {guideError && <p className="error-text">{guideError}</p>}

            {guide ? (
              <div className="guide-panel" aria-live="polite">
                <h3>{guide.subject} — {guide.course}</h3>
                <p className="summary-overview">{guide.overview}</p>
                {guide.sections.map((section) => (
                  <div key={section.title} className="summary-section">
                    <h4>{section.title}</h4>
                    <ul>
                      {section.items.map((item) => (
                        <li key={`${section.title}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {guide.formulaSheet && (
                  <div className="formula-sheet">
                    <h4>{guide.formulaSheet.title}</h4>
                    <div className="formula-grid">
                      {guide.formulaSheet.formulas.map((formula) => (
                        <div key={formula.formula} className="formula-card">
                          <strong>{formula.formula}</strong>
                          <span>{formula.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button type="button" className="secondary-button" onClick={() => setGuide(buildStudyGuide(guideSubject, guideCourse, guideUnit, guideMaterial))}>Generate another guide</button>
              </div>
            ) : (
              <div className="empty-state">Create a structured study guide with the concepts, vocabulary, and formulas your course needs.</div>
            )}

            {savedOutput.guide && (
              <div className="saved-output">
                <h3>Saved guide</h3>
                <p>{savedOutput.guide.subject} • {savedOutput.guide.course}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default StudyTools;
