/**
 * useIndianStates — fetches the list of Indian States/UTs from the
 * Open Admin Data India API. Cached in module scope so the network request
 * only happens once per page load, even when the hook is mounted multiple times.
 */

import { useState, useEffect } from "react";

export interface IndianState {
  id: string;
  name_en: string;
  name_local: string;
  slug: string;
}

interface StatesApiResponse {
  entities: IndianState[];
}

// Module-level cache — shared across all hook instances
let cachedStates: IndianState[] | null = null;
let fetchPromise: Promise<IndianState[]> | null = null;

async function loadStates(): Promise<IndianState[]> {
  if (cachedStates) return cachedStates;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("https://api.openadmindata.org/api/v1/in/state.json")
    .then(async (res) => {
      if (!res.ok) throw new Error(`States API returned ${res.status}`);
      const data: StatesApiResponse = await res.json();
      const sorted = (data.entities ?? []).sort((a, b) =>
        a.name_en.localeCompare(b.name_en),
      );
      cachedStates = sorted;
      return sorted;
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/** Match a state name string (e.g. from the PIN API) against the loaded list.
 *  Tries exact match first, then case-insensitive, then prefix. */
export function matchStateName(
  pinStateName: string,
  states: IndianState[],
): IndianState | undefined {
  const needle = pinStateName.trim().toLowerCase();
  return (
    states.find((s) => s.name_en.toLowerCase() === needle) ??
    states.find((s) => s.name_en.toLowerCase().startsWith(needle)) ??
    states.find((s) => needle.startsWith(s.name_en.toLowerCase()))
  );
}

interface UseIndianStatesResult {
  states: IndianState[];
  loading: boolean;
  error: string | null;
}

export function useIndianStates(): UseIndianStatesResult {
  const [states, setStates] = useState<IndianState[]>(cachedStates ?? []);
  const [loading, setLoading] = useState(!cachedStates);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedStates) {
      setStates(cachedStates);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    loadStates()
      .then((result) => {
        if (!cancelled) {
          setStates(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load state list. You can still type your state manually.");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { states, loading, error };
}
