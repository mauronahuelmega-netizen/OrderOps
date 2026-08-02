"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent
} from "react";
import {
  loadGooglePlacesLibrary,
  type GoogleAutocompleteSuggestion,
  type GooglePlacesLibrary
} from "@/lib/maps/google-maps-loader";
import styles from "./address-autocomplete.module.css";

const MINIMUM_QUERY_LENGTH = 3;
const QUERY_DEBOUNCE_MS = 250;
const MAX_SUGGESTIONS = 5;

type ProviderStatus = "idle" | "loading" | "ready" | "unavailable";

type AddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  inputId?: string;
};

function isEligibleQuery(value: string) {
  return value.trim().length >= MINIMUM_QUERY_LENGTH;
}

export default function AddressAutocomplete({
  value,
  onChange,
  disabled = false,
  inputId = "address"
}: AddressAutocompleteProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<GooglePlacesLibrary | null>(null);
  const sessionTokenRef = useRef<unknown>(null);
  const requestSequenceRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>("idle");
  const [suggestions, setSuggestions] = useState<GoogleAutocompleteSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const isOpen = suggestions.length > 0;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      requestSequenceRef.current += 1;
      sessionTokenRef.current = null;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function ensureProvider() {
    if (libraryRef.current) return libraryRef.current;
    if (!apiKey) {
      setProviderStatus("unavailable");
      return null;
    }

    setProviderStatus("loading");
    try {
      const library = await loadGooglePlacesLibrary(apiKey);
      libraryRef.current = library;
      setProviderStatus("ready");
      return library;
    } catch {
      setProviderStatus("unavailable");
      return null;
    }
  }

  async function fetchSuggestions(query: string) {
    const requestId = ++requestSequenceRef.current;
    const library = await ensureProvider();
    if (!library || requestId !== requestSequenceRef.current || !isEligibleQuery(query)) return;

    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new library.AutocompleteSessionToken();
    }

    try {
      const result = await library.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        language: "es",
        region: "AR",
        includedRegionCodes: ["ar"],
        sessionToken: sessionTokenRef.current
      });

      if (requestId !== requestSequenceRef.current) return;
      setSuggestions(
        result.suggestions
          .filter((suggestion) => Boolean(suggestion.placePrediction))
          .slice(0, MAX_SUGGESTIONS)
      );
      setActiveIndex(-1);
    } catch {
      if (requestId === requestSequenceRef.current) {
        setSuggestions([]);
        setActiveIndex(-1);
        setProviderStatus("unavailable");
      }
    }
  }

  function scheduleSuggestions(query: string) {
    requestSequenceRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!isEligibleQuery(query)) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(() => void fetchSuggestions(query), QUERY_DEBOUNCE_MS);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value;
    onChange(nextValue);
    scheduleSuggestions(nextValue);
  }

  function handleFocus() {
    void ensureProvider();
    if (isEligibleQuery(value)) scheduleSuggestions(value);
  }

  async function selectSuggestion(suggestion: GoogleAutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;

    requestSequenceRef.current += 1;
    setSuggestions([]);
    setActiveIndex(-1);

    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress"] });
      if (place.formattedAddress) onChange(place.formattedAddress);
    } catch {
      setProviderStatus("unavailable");
    } finally {
      sessionTokenRef.current = null;
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, suggestions.length - 1));
      return;
    }
    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    }
  }

  const activeOptionId =
    activeIndex >= 0 && suggestions[activeIndex]
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <div ref={rootRef} className={`ui-field ${styles.field}`}>
      <label className="ui-label" htmlFor={inputId}>
        Dirección
      </label>
      <input
        ref={inputRef}
        id={inputId}
        name="address"
        type="text"
        className={`ui-input ${styles.input}`}
        autoComplete="street-address"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={activeOptionId}
      />

      {isOpen ? (
        <ul id={listboxId} className={styles.listbox} role="listbox" aria-label="Sugerencias de dirección">
          {suggestions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            const isActive = index === activeIndex;

            return (
              <li key={`${prediction.text.toString()}-${index}`} role="presentation">
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={[styles.option, isActive ? styles.optionActive : ""]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  {prediction.text.toString()}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {providerStatus === "loading" ? (
        <p className={styles.status} role="status">Cargando sugerencias...</p>
      ) : null}
      {providerStatus === "unavailable" ? (
        <p className={styles.status} role="status">
          No pudimos cargar las sugerencias. Podés escribir la dirección manualmente.
        </p>
      ) : null}
    </div>
  );
}
