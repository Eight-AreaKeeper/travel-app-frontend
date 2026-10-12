import { useEffect, useRef, useState } from 'react';
import { hotDestinations, searchDestinations } from '../api/destinations';
import type { Destination } from '../api/types';

type Props = {
  selected: Destination[];
  onChange: (list: Destination[]) => void;
  multiple?: boolean;
  placeholder?: string;
  /** When enabled, typed text that isn't found in the suggestion list can still be added by pressing Enter (a free-text destination, id=0 means it doesn't match the local database).
   * Disabled by default, so it doesn't affect the existing "pick from local database only" behavior in the travel notes/guides module. */
  allowFreeText?: boolean;
};

export function DestinationPicker({
  selected,
  onChange,
  multiple = true,
  placeholder = 'Search destinations…',
  allowFreeText = false,
}: Props) {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<Destination[]>([]);
  const [hot, setHot] = useState<Destination[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    hotDestinations(8).then(setHot).catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!keyword.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchDestinations(keyword.trim()).then(setSuggestions).catch(() => setSuggestions([]));
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [keyword]);

  const pick = (d: Destination) => {
    if (selected.some((x) => x.id === d.id)) return;
    onChange(multiple ? [...selected, d] : [d]);
    setKeyword('');
    setSuggestions([]);
  };

  const remove = (id: number, name: string) =>
    onChange(selected.filter((x) => !(x.id === id && x.name === name)));

  const addFreeText = () => {
    const text = keyword.trim();
    if (!text) return;
    const exactMatch = options.find((d) => d.name === text);
    if (exactMatch) {
      pick(exactMatch);
      return;
    }
    if (selected.some((x) => x.name === text)) {
      setKeyword('');
      return;
    }
    // id=0 marks a "free-text destination not found in the local database, entered directly by the user"; the backend handles it by name and doesn't require a matching destinations record
    const custom: Destination = { id: 0, name: text, type: 0 };
    onChange(multiple ? [...selected, custom] : [custom]);
    setKeyword('');
    setSuggestions([]);
  };

  const options = suggestions.length ? suggestions : hot;

  return (
    <div className="field question-input">
      {selected.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 8 }}>
          {selected.map((d) => (
            <button key={`${d.id}-${d.name}`} type="button" className="chip active" onClick={() => remove(d.id, d.name)}>
              {d.name} ×
            </button>
          ))}
        </div>
      )}
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => {
          if (allowFreeText && e.key === 'Enter') {
            e.preventDefault();
            addFreeText();
          }
        }}
        onBlur={allowFreeText ? addFreeText : undefined}
        placeholder={placeholder}
      />
      {allowFreeText && (
        <small style={{ color: 'var(--slate)', display: 'block', marginTop: 4 }}>
          Can't find where you want to go? Just type it in — pressing Enter or clicking "Next" will add it automatically
        </small>
      )}
      {options.length > 0 && (
        <div className="chip-row" style={{ marginTop: 8 }}>
          {options
            .filter((d) => !selected.some((x) => x.id === d.id))
            .map((d) => (
              <button key={d.id} type="button" className="chip" onClick={() => pick(d)}>
                #{d.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
