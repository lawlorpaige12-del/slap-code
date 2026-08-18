import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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

const stopWords = new Set([
  'the','a','an','and','or','of','to','in','for','on','with','is','are','be','this','that','these','those','as','at','by','from','it','its','itself','they','them','their','there','then','if','when','while','because','about','into','over','under','after','before','during','how','what','why','which','who','where','when','not','more','most','some','any','all','can','could','should','would','may','might','has','have','had','do','does','did','was','were','than','also','very','just','each','such','as','but','from','your','you','we','our','us','into'
]);

const pickTopicLabel = (topic: string, material: string) => {
  const value = normalizeText(topic || material || 'Study topic');
  return value.length > 70 ? `${value.slice(0, 67)}…` : value;
};

const extractSentences = (text: string) => {
  const rawText = normalizeText(text);
  if (!rawText) return [];
  return rawText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((entry) => normalizeText(entry).replace(/^[\-•\*\d.\s]+/, ''))
    .filter((entry) => entry.length > 18 && entry.length < 260)
    .map((entry) => entry.replace(/[\s]+$/, ''));
};

const dedupe = (items: string[]) => Array.from(new Set(items.map((item) => normalizeText(item)).filter(Boolean)));

const getMaterialSignals = (topic: string, material: string) => {
  const combined = normalizeText(`${topic} ${material}`);
  const sentences = extractSentences(combined);
  const terms = combined.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((word) => word.length > 3 && !stopWords.has(word));
  const termCounts = new Map<string, number>();

  terms.forEach((term) => {
    const next = termCounts.get(term) ?? 0;
    termCounts.set(term, next + 1);
  });

  const importantTerms = Array.from(termCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([term]) => term)
    .slice(0, 12);

  const concepts = dedupe([
    ...sentences.filter((sentence) => /is|are|means|refers|defines|includes|contains|involves|represents|occurs|results|creates|causes|requires|depends|involves|supports/i.test(sentence)).slice(0, 4),
    ...sentences.filter((sentence) => importantTerms.some((term) => sentence.toLowerCase().includes(term))).slice(0, 8),
    ...sentences.filter((sentence) => sentence.length > 60).slice(0, 4),
  ]).slice(0, 10);

  const definitions = dedupe(sentences.filter((sentence) => /means|is|are|refers|defines|called|known as|represents|includes|consists of/i.test(sentence)).slice(0, 6));
  const processes = dedupe(sentences.filter((sentence) => /first|next|then|finally|step|sequence|process|before|after|during|followed by|in order/i.test(sentence)).slice(0, 6));
  const relationships = dedupe(sentences.filter((sentence) => /because|therefore|causes|leads to|results in|depends on|differs from|compared to|while|whereas|affects|increases|decreases|influences/i.test(sentence)).slice(0, 6));
  const examples = dedupe(sentences.filter((sentence) => /example|such as|for example|when|if|illustrates|demonstrates/i.test(sentence)).slice(0, 6));
  const formulas = dedupe(sentences.filter((sentence) => /=|\+|\-|\*|\/|\^|\(|\)/.test(sentence) && /formula|equation|mass|velocity|force|speed|energy|pressure|volume|temperature|area|slope|rate|momentum/i.test(sentence)).slice(0, 6));

  return {
    concepts,
    definitions,
    processes,
    relationships,
    examples,
    formulas,
    importantTerms,
  };
};

const qualityCheckCard = (front: string, back: string) => {
  if (!front || !back) return false;
  if (front.length < 12 || back.length < 12) return false;
  if (front === back) return false;
  if (front.toLowerCase().includes('random') || back.toLowerCase().includes('random')) return false;
  return true;
};

const generateQuestionFromConcept = (concept: string, kind: 'definition' | 'comparison' | 'process' | 'cause' | 'application') => {
  const cleanConcept = concept.replace(/[.]+$/, '').trim();
  const shortLabel = cleanConcept.split(/\s+/).slice(0, 7).join(' ');

  switch (kind) {
    case 'definition':
      return {
        front: `What is the main idea behind ${shortLabel}?`,
        back: cleanConcept,
      };
    case 'comparison':
      return {
        front: `How does ${shortLabel} differ from a related idea in this topic?`,
        back: cleanConcept,
      };
    case 'process':
      return {
        front: `What is the correct sequence or process for ${shortLabel}?`,
        back: cleanConcept,
      };
    case 'cause':
      return {
        front: `Why does ${shortLabel} matter in this material?`,
        back: cleanConcept,
      };
    case 'application':
      return {
        front: `When would students use or apply ${shortLabel}?`,
        back: cleanConcept,
      };
    default:
      return {
        front: `What is the key concept represented by ${shortLabel}?`,
        back: cleanConcept,
      };
  }
};

const buildFlashcards = (topic: string, material: string): Flashcard[] => {
  const signals = getMaterialSignals(topic, material);
  const candidates = dedupe([
    ...signals.definitions,
    ...signals.concepts,
    ...signals.relationships,
    ...signals.processes,
    ...signals.examples,
  ]);

  const deck: Flashcard[] = [];
  const types: Array<'definition' | 'comparison' | 'process' | 'cause' | 'application'> = ['definition', 'cause', 'comparison', 'process', 'application'];

  for (let index = 0; index < candidates.length && deck.length < 6; index += 1) {
    const candidate = candidates[index];
    const kind = types[index % types.length];
    const generated = generateQuestionFromConcept(candidate, kind);
    const front = generated.front;
    const back = normalizeText(generated.back || candidate);

    if (!qualityCheckCard(front, back)) continue;

    const duplicateFront = deck.some((card) => card.front === front || card.back === back);
    if (!duplicateFront) {
      deck.push({
        id: createId(`flash-${index}`),
        front,
        back,
      });
    }
  }

  if (deck.length === 0) {
    const fallback = normalizeText(topic || 'Key concept') || 'Key concept';
    return [
      {
        id: createId('flash-fallback-1'),
        front: `What is the main idea behind ${fallback}?`,
        back: 'The most important concept is the central idea students should understand, connect to examples, and be able to explain clearly.',
      },
      {
        id: createId('flash-fallback-2'),
        front: `Why does ${fallback} matter for understanding the larger topic?`,
        back: 'It matters because it connects the details in the notes to the broader concept and helps students explain the material accurately.',
      },
    ];
  }

  return deck;
};

const buildSummary = (topic: string, material: string): SummaryResult => {
  const signals = getMaterialSignals(topic, material);
  const depth = material.length > 2000 ? 6 : material.length > 1000 ? 5 : material.length > 500 ? 4 : 3;

  const sections: SummarySection[] = [
    {
      title: 'Main concepts',
      items: signals.concepts.slice(0, Math.max(2, depth - 1)),
    },
    {
      title: 'Key terms and definitions',
      items: signals.definitions.slice(0, Math.max(2, depth - 1)),
    },
  ];

  if (signals.processes.length) {
    sections.push({ title: 'Important processes', items: signals.processes.slice(0, Math.max(2, depth - 2)) });
  }

  if (signals.relationships.length) {
    sections.push({ title: 'Relationships and cause/effect', items: signals.relationships.slice(0, Math.max(2, depth - 2)) });
  }

  if (signals.examples.length) {
    sections.push({ title: 'Examples', items: signals.examples.slice(0, Math.max(2, depth - 2)) });
  }

  if (signals.formulas.length) {
    sections.push({ title: 'Formulas and equations', items: signals.formulas.slice(0, Math.max(2, depth - 2)) });
  }

  const overviewText = normalizeText(`${topic || 'This topic'} ${material}`) || 'This summary reflects the most important ideas in the study material.';

  return {
    overview: `This summary focuses on the major ideas, definitions, and relationships in ${pickTopicLabel(topic, material)}. It is organized to help you review what matters most rather than simply restating the notes verbatim.`,
    sections: sections.length ? sections : [{ title: 'Main ideas', items: [overviewText] }],
  };
};

const buildQuizQuestions = (
  topic: string,
  material: string,
  count: number,
  difficulty: string,
  type: QuizType
): QuizQuestion[] => {
  const signals = getMaterialSignals(topic, material);
  const conceptPool = dedupe([
    ...signals.definitions,
    ...signals.concepts,
    ...signals.relationships,
    ...signals.processes,
    ...signals.examples,
  ]);

  const basePool = conceptPool.length ? conceptPool : [
    `${topic || 'This topic'} includes the core ideas students need to know for the unit.`,
    `The strongest answers connect the main concept to evidence, examples, and accurate reasoning.`,
    `Students should be able to explain the idea in a clear, specific way.`,
  ];

  const questionCount = Math.min(10, Math.max(1, count));
  const questions: QuizQuestion[] = [];

  for (let index = 0; index < questionCount; index += 1) {
    const concept = basePool[index % basePool.length];
    const questionType = type === 'mixed'
      ? (index % 3 === 0 ? 'multiple-choice' : index % 3 === 1 ? 'true-false' : 'short-answer')
      : type;

    if (questionType === 'multiple-choice') {
      const distractors = shuffleArray(
        basePool.filter((entry) => entry !== concept)
      ).slice(0, 3);

      const options = shuffleArray([concept, ...distractors.slice(0, 3)]);
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'multiple-choice',
        prompt: `Which statement best explains the central idea in ${pickTopicLabel(topic, material)} at ${difficulty.toLowerCase()} difficulty?`,
        options,
        correctAnswer: concept,
        explanation: `${concept} is correct because it reflects the key idea or supporting evidence from the material and is the most accurate explanation of the concept.`,
      });
    } else if (questionType === 'true-false') {
      const isTrue = index % 2 === 0;
      const statement = isTrue
        ? concept
        : `The most important idea in ${pickTopicLabel(topic, material)} is not supported by the evidence or examples from the notes.`;
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'true-false',
        prompt: `True or False: ${statement}`,
        options: ['True', 'False'],
        correctAnswer: isTrue ? 'True' : 'False',
        explanation: isTrue
          ? `${concept} is accurate because it reflects a real idea, definition, or relationship from the study material.`
          : `This statement is false because the material supports a specific concept or relationship that matters to the topic.`,
      });
    } else {
      questions.push({
        id: createId(`quiz-${index}`),
        type: 'short-answer',
        prompt: `In your own words, explain the main idea behind ${pickTopicLabel(topic, material)} and connect it to the notes you reviewed.`,
        correctAnswer: concept,
        explanation: `A strong answer should explain the concept clearly and connect it to a relevant example, definition, or relationship from the material.`,
      });
    }
  }

  return questions;
};

const isShortAnswerCorrect = (question: QuizQuestion, answer: string) => {
  const candidate = normalizeText(answer || '').toLowerCase();
  if (!candidate) return false;
  const correct = normalizeText(question.correctAnswer || '').toLowerCase();
  const tokens = correct.split(/\s+/).filter((word) => word.length > 3 && !stopWords.has(word));
  if (!tokens.length) return false;
  return tokens.some((token) => candidate.includes(token));
};

const buildStudyGuide = (course: string, unit: string, material: string): StudyGuide => {
  const resolvedCourse = normalizeText(course || 'Course');
  const resolvedUnit = normalizeText(unit || 'Core topic');
  const signals = getMaterialSignals(resolvedCourse, material);
  const includeFormulaSheet = signals.formulas.length > 0 || /(physics|chemistry|biology|math|algebra|geometry|calculus|statistics|economics|engineering|astronomy|mechanics)/i.test(`${resolvedCourse} ${resolvedUnit} ${material}`);

  const formulaSheet = includeFormulaSheet
    ? {
        title: 'Formula Sheet',
        formulas: signals.formulas.length
          ? signals.formulas.map((item) => ({
              formula: item.split('—')[0]?.trim() || item.slice(0, 35),
              meaning: item.split('—')[1]?.trim() || 'A key relationship from the study material.',
            }))
          : [
              { formula: 'Concept = key idea + evidence', meaning: 'Use the central idea together with supporting details to explain the material clearly.' },
            ],
      }
    : undefined;

  const sections: SummarySection[] = [
    {
      title: 'Key concepts',
      items: signals.concepts.slice(0, 4) || ['Focus on the main idea and the evidence that explains it.'],
    },
    {
      title: 'Important definitions',
      items: signals.definitions.slice(0, 4) || ['Write each definition in your own words and connect it to a concrete example.'],
    },
  ];

  if (signals.processes.length) {
    sections.push({ title: 'Important processes', items: signals.processes.slice(0, 3) });
  }

  sections.push({
    title: 'Common mistakes',
    items: [
      'Do not memorize isolated facts without understanding how they fit into the larger concept.',
      'Check whether your answer uses the correct vocabulary, units, and reasoning path.',
    ],
  });

  if (signals.relationships.length) {
    sections.push({ title: 'Key relationships', items: signals.relationships.slice(0, 3) });
  }

  if (formulaSheet) {
    sections.push({ title: 'Formula Sheet', items: formulaSheet.formulas.map((entry) => `${entry.formula} — ${entry.meaning}`) });
  }

  return {
    subject: resolvedCourse,
    course: resolvedCourse,
    unit: resolvedUnit,
    overview: `This guide for ${resolvedCourse} focuses on the biggest ideas, definitions, and relationships tied to ${resolvedUnit}.`,
    sections,
    formulaSheet,
  };
};

function StudyTools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const toolFromUrl = searchParams.get('tool');
  const courseFromUrl = searchParams.get('course');
  const [selectedTool, setSelectedTool] = useState<ToolKey>(toolFromUrl === 'summary' || toolFromUrl === 'quiz' || toolFromUrl === 'studyguide' || toolFromUrl === 'flashcards' ? toolFromUrl : 'flashcards');
  const [flashTopic, setFlashTopic] = useState(courseFromUrl || '');
  const [flashMaterial, setFlashMaterial] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);
  const [flashError, setFlashError] = useState('');

  const [summaryTopic, setSummaryTopic] = useState(courseFromUrl || '');
  const [summaryMaterial, setSummaryMaterial] = useState('');
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [summaryError, setSummaryError] = useState('');

  const [quizTopic, setQuizTopic] = useState(courseFromUrl || '');
  const [quizMaterial, setQuizMaterial] = useState('');
  const [quizCount, setQuizCount] = useState(4);
  const [quizDifficulty, setQuizDifficulty] = useState('Medium');
  const [quizType, setQuizType] = useState<QuizType>('mixed');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizError, setQuizError] = useState('');

  const [guideCourse, setGuideCourse] = useState(courseFromUrl || '');
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
    const tool = toolFromUrl === 'summary' || toolFromUrl === 'quiz' || toolFromUrl === 'studyguide' || toolFromUrl === 'flashcards' ? toolFromUrl : 'flashcards';
    setSelectedTool(tool);

    const course = courseFromUrl || '';
    if (course) {
      setFlashTopic(course);
      setSummaryTopic(course);
      setQuizTopic(course);
      setGuideCourse(course);
    }
  }, [toolFromUrl, courseFromUrl]);

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
    setSavedOutput((prev) => ({ ...prev, quiz: generated }));
  };

  const handleGenerateGuide = (event: React.FormEvent) => {
    event.preventDefault();
    if (!normalizeText(guideCourse) && !normalizeText(guideMaterial)) {
      setGuideError('Add the course and material before creating a study guide.');
      return;
    }

    const generated = buildStudyGuide(guideCourse, guideUnit, guideMaterial);
    setGuide(generated);
    setGuideError('');
    setSavedOutput((prev) => ({ ...prev, guide: generated }));
  };

  const handleSubmitQuiz = () => {
    const answeredItems = Object.keys(quizAnswers).length;
    if (!answeredItems) {
      setQuizError('Answer at least one question before submitting the quiz.');
      return;
    }

    setQuizSubmitted(true);
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
      onClick={() => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('tool', tool.id);
        setSearchParams(nextParams);
        setSelectedTool(tool.id);
      }}
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
                Course
                <input value={guideCourse} onChange={(event) => setGuideCourse(event.target.value)} placeholder="AP Biology, English Literature, AP Physics" />
              </label>
              <div className="input-row two-up">
                <label>
                  Topic or unit
                  <input value={guideUnit} onChange={(event) => setGuideUnit(event.target.value)} placeholder="Cell transport" />
                </label>
                <label>
                  Material to study
                  <textarea value={guideMaterial} onChange={(event) => setGuideMaterial(event.target.value)} placeholder="Paste chapter notes, key concepts, reading summaries, or formulas." />
                </label>
              </div>
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

                <button type="button" className="secondary-button" onClick={() => setGuide(buildStudyGuide(guideCourse, guideUnit, guideMaterial))}>Generate another guide</button>
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
