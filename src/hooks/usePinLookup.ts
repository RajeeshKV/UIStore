/**
 * usePinLookup — fetches Indian postal PIN code details.
 *
 * Triggers automatically when `pin` reaches exactly 6 digits.
 * Cancels stale requests when `pin` changes before the previous call resolves.
 * Deduplicates: does not re-fetch the same PIN twice.
 */

import { useState, useEffect, useRef } from "react";

export interface PinPostOffice {
  name: string;
  district: string;
  state: string;
  branchType: string;
  deliveryStatus: string;
}

export interface PinLookupResult {
  pin: string;
  state: string;
  district: string;
  postOffices: PinPostOffice[];
  /** True when the PIN has multiple distinct districts in its response */
  multipleDistricts: boolean;
}

type PinLookupStatus = "idle" | "loading" | "success" | "invalid" | "error";

interface UsePinLookupResult {
  status: PinLookupStatus;
  result: PinLookupResult | null;
  /** Human-readable error/info message for display below the PIN field */
  message: string | null;
}

// Raw shape from the API
interface RawPostOffice {
  Name: string;
  District: string;
  State: string;
  BranchType: string;
  DeliveryStatus: string;
}

interface RawPinResponse {
  Status: string;
  Message: string;
  PostOffice: RawPostOffice[] | null;
}

// Request-level dedup cache: pin → result
const resultCache = new Map<string, PinLookupResult>();

export function usePinLookup(pin: string): UsePinLookupResult {
  const [status, setStatus] = useState<PinLookupStatus>("idle");
  const [result, setResult] = useState<PinLookupResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Track the current in-flight request so we can ignore stale responses
  const currentPinRef = useRef<string>("");

  useEffect(() => {
    const trimmed = pin.replace(/\D/g, "");

    // Not a full 6-digit PIN — reset without fetching
    if (trimmed.length !== 6) {
      setStatus("idle");
      setResult(null);
      setMessage(null);
      currentPinRef.current = "";
      return;
    }

    // Cache hit — no network call needed
    if (resultCache.has(trimmed)) {
      const cached = resultCache.get(trimmed)!;
      setStatus("success");
      setResult(cached);
      setMessage(null);
      return;
    }

    currentPinRef.current = trimmed;
    setStatus("loading");
    setResult(null);
    setMessage(null);

    const controller = new AbortController();

    fetch(`https://api.postalpincode.in/pincode/${trimmed}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        // Ignore if a newer PIN has already taken over
        if (currentPinRef.current !== trimmed) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: RawPinResponse[] = await res.json();
        const first = data[0];

        if (!first || first.Status !== "Success" || !first.PostOffice?.length) {
          setStatus("invalid");
          setResult(null);
          setMessage("Invalid or unsupported PIN code.");
          return;
        }

        const offices: PinPostOffice[] = first.PostOffice.map((o) => ({
          name: o.Name.trim(),
          district: o.District.trim(),
          state: o.State.trim(),
          branchType: o.BranchType,
          deliveryStatus: o.DeliveryStatus,
        }));

        // Deduplicate post office names
        const seen = new Set<string>();
        const uniqueOffices = offices.filter((o) => {
          if (seen.has(o.name)) return false;
          seen.add(o.name);
          return true;
        });

        // Primary state from first office (all should agree for a valid PIN)
        const state = offices[0].state;

        // District: use first office's district; flag if multiple districts exist
        const districts = [...new Set(offices.map((o) => o.district))];
        const district = districts[0];
        const multipleDistricts = districts.length > 1;

        const lookup: PinLookupResult = {
          pin: trimmed,
          state,
          district,
          postOffices: uniqueOffices,
          multipleDistricts,
        };

        resultCache.set(trimmed, lookup);

        // Only apply if this PIN is still the active one
        if (currentPinRef.current === trimmed) {
          setStatus("success");
          setResult(lookup);
          setMessage(null);
        }
      })
      .catch((err) => {
        if (currentPinRef.current !== trimmed) return;
        // AbortError means a newer PIN cancelled this — not a real error
        if (err instanceof DOMException && err.name === "AbortError") return;

        setStatus("error");
        setResult(null);
        setMessage(
          "Unable to verify PIN code right now. You can continue entering the address manually.",
        );
      });

    return () => {
      controller.abort();
    };
  }, [pin]);

  return { status, result, message };
}
