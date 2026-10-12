import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeSession, createSession, questions as fetchQuestions, saveAnswers } from '../api/customize';
import { hotDestinations } from '../api/destinations';
import type { ApiError, Destination, QaRule, SaveAnswersPayload } from '../api/types';
import { QuestionField } from '../components/QuestionField';
import { toast } from '../components/Toast';
import { Loading } from '../components/Feedback';
import { savePendingSession, clearPendingSession } from '../lib/pendingSession';

const DEFAULT_QUESTIONS: QaRule[] = [
  { id: -1, questionKey: 'destinationIds', questionText: 'Where do you want to travel?', inputType: 'destination_search', options: null, isRequired: true, sortOrder: 1, isActive: true },
  { id: -2, questionKey: 'days', questionText: 'How many days are you planning for?', inputType: 'stepper', options: { min: 1, max: 30 }, isRequired: true, sortOrder: 2, isActive: true },
  { id: -3, questionKey: 'departDate', questionText: 'What are your departure and return dates?', inputType: 'date_range', options: null, isRequired: true, sortOrder: 3, isActive: true },
  { id: -4, questionKey: 'departCity', questionText: 'Which city are you departing from?', inputType: 'text', options: null, isRequired: true, sortOrder: 4, isActive: true },
  { id: -5, questionKey: 'hasBookedTransport', questionText: 'Have you already booked flights/train tickets?', inputType: 'chip_single', options: null, isRequired: true, sortOrder: 5, isActive: true },
  { id: -6, questionKey: 'budgetMin', questionText: 'What is your approximate budget for this trip?', inputType: 'slider', options: { min: 1000, max: 15000, step: 500 }, isRequired: true, sortOrder: 6, isActive: true },
  { id: -7, questionKey: 'travelerCount', questionText: 'How many travelers?', inputType: 'stepper', options: { min: 1, max: 20 }, isRequired: true, sortOrder: 7, isActive: true },
  { id: -8, questionKey: 'travelStyle', questionText: 'What travel style do you prefer?', inputType: 'chip_single', options: null, isRequired: false, sortOrder: 8, isActive: true },
];

type Answers = Omit<SaveAnswersPayload, 'destinations'>;

export function Customize() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QaRule[] | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<'answering' | 'submitting'>('answering');

  useEffect(() => {
    const sourceNoteId = params.get('sourceNoteId');
    const destinationIdParam = params.get('destinationId');
    Promise.all([
      fetchQuestions().catch(() => []),
      createSession(sourceNoteId ? Number(sourceNoteId) : undefined).catch(() => null),
      hotDestinations(20).catch(() => []),
    ]).then(([qs, session, hot]) => {
      setQuestions(qs.length ? qs : DEFAULT_QUESTIONS);
      if (session) {
        setSessionId(session.id);
        setSessionToken(session.sessionToken);
        if (session.sessionToken) savePendingSession(session.id, session.sessionToken);
      }
      if (destinationIdParam) {
        const id = Number(destinationIdParam);
        const match = hot.find((d) => d.id === id);
        setDestinations([match ?? { id, name: `Destination #${id}`, type: 0 }]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getValue = (key: string) => (answers as Record<string, unknown>)[key];
  const setValue = (key: string, value: unknown) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const buildPayload = (current: Answers = answers): SaveAnswersPayload => ({
    destinations: destinations.map((d) => (d.id > 0 ? { id: d.id, name: d.name } : { name: d.name })),
    ...current,
  });

  const persist = (current: Answers = answers) => {
    if (!sessionId || destinations.length === 0) return;
    saveAnswers(sessionId, buildPayload(current), sessionToken).catch(() => {
      toast('Failed to save your answers, please check your network');
    });
  };

  const hasAnswer = (rule: QaRule, current: Answers = answers): boolean => {
    if (rule.questionKey === 'destinationIds') return destinations.length > 0;
    if (rule.inputType === 'date_range') return Boolean(current.departDate && current.returnDate);
    const value = (current as Record<string, unknown>)[rule.questionKey];
    return value !== undefined && value !== null && value !== '';
  };

  /** Steppers and sliders already show a value (see QuestionField); accepting it untouched counts as answering */
  const withShownDefault = (rule: QaRule, current: Answers): Answers => {
    const values = current as Record<string, unknown>;
    if (rule.inputType === 'slider' || rule.inputType === 'range_slider' || rule.questionKey === 'budgetMin') {
      return {
        ...current,
        budgetMin: current.budgetMin ?? Number(rule.options?.min ?? 1000),
        budgetMax: current.budgetMax ?? Number(rule.options?.max ?? 15000),
      };
    }
    if (rule.inputType === 'stepper' && values[rule.questionKey] == null) {
      return { ...current, [rule.questionKey]: Number(rule.options?.min ?? 1) };
    }
    return current;
  };

  const rules = questions ?? [];
  const current = rules[step];
  const isLast = step === rules.length - 1;

  const next = () => {
    if (!current) return;
    const filled = withShownDefault(current, answers);
    if (current.isRequired && !hasAnswer(current, filled)) {
      toast('This field is required, please fill it in first');
      return;
    }
    if (filled !== answers) setAnswers(filled);
    persist(filled);
    if (isLast) {
      handleComplete(filled);
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    persist();
    if (isLast) handleComplete();
    else setStep((s) => s + 1);
  };

  const handleComplete = (current: Answers = answers) => {
    if (destinations.length === 0) {
      toast('Please select a destination first');
      return;
    }
    setPhase('submitting');

    const work = sessionId
      ? saveAnswers(sessionId, buildPayload(current), sessionToken).then(() => completeSession(sessionId, sessionToken))
      : Promise.reject(new Error('Customize service is currently unavailable'));

    // complete() here just saves the Q&A to the database and pushes the generation task onto the queue,
    // returning almost immediately (status="generating"); the actual time-consuming generation happens
    // in an async backend job. The "generating" waiting experience is handled by the ItineraryResult page
    // polling for status, so there's no need (and it would be wrong) to fake "generating" with a delay/carousel copy here.
    work
      .then((result) => {
        clearPendingSession();
        navigate(`/itinerary/${result.planId}`);
      })
      .catch((e: ApiError) => {
        if (e.code === 40100) {
          toast('Please log in first, then come back to generate your itinerary');
          navigate('/login');
          return;
        }
        toast(e.message ?? 'Submission failed, please try again later');
        setPhase('answering');
      });
  };

  if (phase === 'submitting') {
    return (
      <div className="customize-success">
        <div className="ticket" style={{ width: 320 }}>
          <div className="ticket-title">Submitting your trip preferences…</div>
        </div>
      </div>
    );
  }

  if (!questions) return <Loading label="Loading questionnaire…" />;

  return (
    <div className="customize-layout">
      <aside className="customize-sidebar">
        <div className="ticket">
          <div className="ticket-title">My Trip Ticket</div>
          <small>Completed {step}/{rules.length}</small>
          {rules.map((rule, i) => {
            const filled = hasAnswer(rule);
            return (
              <div
                key={rule.id}
                className={`ticket-row ${filled ? '' : 'pending'}`}
                style={{ cursor: i <= step ? 'pointer' : 'default' }}
                onClick={() => i <= step && setStep(i)}
              >
                <span className="label">{rule.questionText.replace(/\?$/, '')}</span>
                <span className="value">
                  {describeAnswer(rule, destinations, answers)}
                  {filled && i <= step && <span className="ticket-edit">✎</span>}
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      <div>
        <div className="progress-dots">
          {rules.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`progress-dot ${i < step ? 'done' : i === step ? 'current' : ''}`}
              disabled={i > step}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {current && (
          <div className="question-panel">
            {!current.isRequired && (
              <button className="skip-link" onClick={skip}>
                Skip
              </button>
            )}
            <h2>{current.questionText}</h2>
            <QuestionField
              rule={current}
              getValue={getValue}
              setValue={setValue}
              destinations={destinations}
              setDestinations={setDestinations}
            />
            <div className="question-nav">
              <button className="btn ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                ← Back
              </button>
              <button className="btn" onClick={next}>
                {isLast ? 'Generate my itinerary' : 'Next →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function describeAnswer(rule: QaRule, destinations: Destination[], answers: Answers): string {
  if (rule.questionKey === 'destinationIds') {
    return destinations.length ? destinations.map((d) => d.name).join(', ') : 'TBD';
  }
  if (rule.inputType === 'date_range') {
    return answers.departDate && answers.returnDate ? `${answers.departDate} → ${answers.returnDate}` : 'TBD';
  }
  if (rule.inputType === 'slider' || rule.questionKey === 'budgetMin') {
    return answers.budgetMin != null && answers.budgetMax != null
      ? `¥${answers.budgetMin.toLocaleString('zh-CN')} – ¥${answers.budgetMax.toLocaleString('zh-CN')}`
      : 'TBD';
  }
  const value = (answers as Record<string, unknown>)[rule.questionKey];
  if (value === undefined || value === null || value === '') return 'TBD';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? `${value.length} selected` : 'TBD';
  return String(value);
}
