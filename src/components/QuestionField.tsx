import { DestinationPicker } from './DestinationPicker';
import type { Destination, QaRule } from '../api/types';

type Choice = { value: string | number; label: string };

const FALLBACK_CHOICES: Record<string, Choice[]> = {
  hasBookedTransport: [
    { value: 'true', label: 'Already booked' },
    { value: 'false', label: 'Not booked yet' },
  ],
  travelStyle: [
    { value: 'checklist', label: 'Sightseeing' },
    { value: 'deep_experience', label: 'Deep experience' },
    { value: 'leisure', label: 'Leisure vacation' },
    { value: 'adventure', label: 'Outdoor adventure' },
  ],
  travelerComposition: [
    { value: 'couple', label: 'Couple' },
    { value: 'family_with_kids', label: 'Family with kids' },
    { value: 'elderly', label: 'With elderly parents' },
    { value: 'friends', label: 'Friends' },
    { value: 'solo', label: 'Solo' },
  ],
  pacePreference: [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'packed', label: 'Packed' },
  ],
  accommodationType: [
    { value: 'hotel', label: 'Hotel' },
    { value: 'homestay', label: 'Homestay' },
    { value: 'hostel', label: 'Hostel' },
  ],
};

function choicesFor(rule: QaRule): Choice[] {
  const configured = rule.options?.choices;
  if (Array.isArray(configured)) return configured as Choice[];
  return FALLBACK_CHOICES[rule.questionKey] ?? [];
}

type Props = {
  rule: QaRule;
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  destinations: Destination[];
  setDestinations: (list: Destination[]) => void;
};

export function QuestionField({ rule, getValue, setValue, destinations, setDestinations }: Props) {
  if (rule.questionKey === 'destinationIds') {
    return <DestinationPicker selected={destinations} onChange={setDestinations} multiple allowFreeText />;
  }

  if (rule.inputType === 'date_range' || rule.questionKey === 'departDate') {
    return (
      <div className="field question-input">
        <label>Departure date</label>
        <input
          type="date"
          value={(getValue('departDate') as string) ?? ''}
          onChange={(e) => setValue('departDate', e.target.value)}
        />
        <label>Return date</label>
        <input
          type="date"
          min={(getValue('departDate') as string) || undefined}
          value={(getValue('returnDate') as string) ?? ''}
          onChange={(e) => setValue('returnDate', e.target.value)}
        />
      </div>
    );
  }

  if (rule.inputType === 'slider' || rule.inputType === 'range_slider' || rule.questionKey === 'budgetMin') {
    const min = Number(rule.options?.min ?? 1000);
    const max = Number(rule.options?.max ?? 15000);
    const step = Number(rule.options?.step ?? 500);
    const lo = Number(getValue('budgetMin') ?? min);
    const hi = Number(getValue('budgetMax') ?? max);
    return (
      <div className="field question-input">
        <div className="range-readout">
          ¥{lo.toLocaleString('zh-CN')} – ¥{hi.toLocaleString('zh-CN')}
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => setValue('budgetMin', Math.min(Number(e.target.value), hi))}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => setValue('budgetMax', Math.max(Number(e.target.value), lo))}
        />
      </div>
    );
  }

  if (rule.inputType === 'stepper') {
    const min = Number(rule.options?.min ?? 1);
    const max = Number(rule.options?.max ?? (rule.questionKey === 'days' ? 30 : 20));
    const value = Number(getValue(rule.questionKey) ?? min);
    return (
      <div className="stepper">
        <button type="button" disabled={value <= min} onClick={() => setValue(rule.questionKey, value - 1)}>
          −
        </button>
        <span className="count">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => setValue(rule.questionKey, value + 1)}>
          +
        </button>
      </div>
    );
  }

  if (rule.inputType === 'chip_multi' && rule.questionKey === 'interestTagIds') {
    const options = choicesFor(rule);
    if (options.length === 0) {
      return <p className="question-hint">This question hasn't been configured with options yet — let's skip it for now.</p>;
    }
    const selected = (getValue('interestTagIds') as number[]) ?? [];
    const toggle = (v: number) =>
      setValue(
        'interestTagIds',
        selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v].slice(0, 5),
      );
    return (
      <div className="chip-row" style={{ justifyContent: 'center' }}>
        {options.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip ${selected.includes(Number(c.value)) ? 'active' : ''}`}
            onClick={() => toggle(Number(c.value))}
          >
            {c.label}
          </button>
        ))}
      </div>
    );
  }

  if (rule.inputType === 'chip_single' || FALLBACK_CHOICES[rule.questionKey]) {
    const options = choicesFor(rule);
    const current = String(getValue(rule.questionKey) ?? '');
    return (
      <div className="chip-row" style={{ justifyContent: 'center' }}>
        {options.map((c) => (
          <button
            key={c.value}
            type="button"
            className={`chip ${current === String(c.value) ? 'active' : ''}`}
            onClick={() => setValue(rule.questionKey, c.value === 'true' ? true : c.value === 'false' ? false : c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      className="question-input"
      value={(getValue(rule.questionKey) as string) ?? ''}
      onChange={(e) => setValue(rule.questionKey, e.target.value)}
      placeholder="Enter your answer…"
    />
  );
}
