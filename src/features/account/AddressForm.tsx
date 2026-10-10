"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, CheckCircle2, LocateFixed, Pencil } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useIndianStates, matchStateName } from "@/hooks/useIndianStates";
import { usePinLookup } from "@/hooks/usePinLookup";
import type { CustomerAddressResponse, CreateAddressRequest } from "@/types/api";

interface AddressFormProps {
  initial?: CustomerAddressResponse;
  onSave: (data: CreateAddressRequest) => void;
  saving: boolean;
  onCancel: () => void;
  /** Pre-fill phone from verified profile number */
  defaultPhone?: string;
  /** Pre-fill name from profile */
  defaultFirstName?: string;
  defaultLastName?: string;
}

// ── PIN status pill ───────────────────────────────────────────────────────────

function PinStatusPill({
  status,
  message,
}: {
  status: "idle" | "loading" | "success" | "invalid" | "error";
  message: string | null;
}) {
  if (status === "loading") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        Checking PIN…
      </span>
    );
  }
  if (status === "success") {
    return (
      <span className="flex items-center gap-1 text-[11px] text-success font-medium">
        <CheckCircle2 className="size-3" aria-hidden="true" />
        Location found
      </span>
    );
  }
  if ((status === "invalid" || status === "error") && message) {
    return (
      <span className="flex items-center gap-1 text-[11px] text-danger">
        <AlertTriangle className="size-3" aria-hidden="true" />
        {message}
      </span>
    );
  }
  return null;
}

// ── Locked field display (with edit escape hatch) ─────────────────────────────

function LockedField({
  label,
  value,
  onUnlock,
}: {
  label: string;
  value: string;
  onUnlock: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      <div className="flex items-center gap-2 h-11 px-3 rounded-md border border-border bg-muted text-[14px] text-foreground">
        <span className="flex-1 truncate">{value || "—"}</span>
        <button
          type="button"
          onClick={onUnlock}
          className="shrink-0 flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
          aria-label={`Edit ${label}`}
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      <span className="text-[11px] text-foreground-muted">Auto-filled from PIN</span>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function AddressForm({
  initial,
  onSave,
  saving,
  onCancel,
  defaultPhone,
  defaultFirstName,
  defaultLastName,
}: AddressFormProps) {
  // ── Data hooks ──────────────────────────────────────────────────────────────
  const { states, loading: statesLoading, error: statesError } = useIndianStates();

  const stateOptions: ComboboxOption[] = states.map((s) => ({
    value: s.name_en,
    label: s.name_en,
  }));

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    label: initial?.label ?? "",
    firstName: initial?.firstName ?? defaultFirstName ?? "",
    lastName: initial?.lastName ?? defaultLastName ?? "",
    company: initial?.company ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    postalCode: initial?.postalCode ?? "",
    state: initial?.state ?? "",
    district: "",
    city: initial?.city ?? "",
    countryCode: initial?.countryCode ?? "IN",
    phone: initial?.phone ?? defaultPhone ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Post office options built from PIN lookup
  const [postOfficeOptions, setPostOfficeOptions] = useState<ComboboxOption[]>([]);
  // Multiple-district options
  const [districtOptions, setDistrictOptions] = useState<ComboboxOption[]>([]);
  // Flag: was the current state/district auto-populated from PIN?
  const [pinPopulated, setPinPopulated] = useState(false);
  // Override locks: user clicked "Edit" to manually change auto-filled field
  const [stateUnlocked, setStateUnlocked] = useState(false);
  const [districtUnlocked, setDistrictUnlocked] = useState(false);

  // ── Geolocation state ──────────────────────────────────────────────────────
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // ── PIN lookup ──────────────────────────────────────────────────────────────
  const { status: pinStatus, result: pinResult, message: pinMessage } = usePinLookup(
    form.postalCode,
  );

  // Apply PIN lookup results when they arrive
  useEffect(() => {
    if (pinStatus === "success" && pinResult) {
      const matchedState = matchStateName(pinResult.state, states);
      const resolvedState = matchedState ? matchedState.name_en : pinResult.state;

      const offices: ComboboxOption[] = pinResult.postOffices.map((o) => ({
        value: o.name,
        label: o.name,
      }));
      setPostOfficeOptions(offices);

      if (pinResult.multipleDistricts) {
        const uniqueDistricts = [
          ...new Set(pinResult.postOffices.map((o) => o.district)),
        ];
        setDistrictOptions(uniqueDistricts.map((d) => ({ value: d, label: d })));
      } else {
        setDistrictOptions([]);
      }

      setForm((f) => ({
        ...f,
        state: resolvedState,
        district: pinResult.district,
        city: offices.length === 1 ? offices[0].value : f.city,
      }));
      setPinPopulated(true);
      // Reset unlock flags when a new PIN is resolved
      setStateUnlocked(false);
      setDistrictUnlocked(false);

      setErrors((e) => {
        const next = { ...e };
        delete next.state;
        delete next.postalCode;
        return next;
      });
    }

    if (pinStatus === "idle" && pinPopulated) {
      setPostOfficeOptions([]);
      setDistrictOptions([]);
      setPinPopulated(false);
      setStateUnlocked(false);
      setDistrictUnlocked(false);
      setForm((f) => ({ ...f, district: "", city: "" }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinStatus, pinResult, states]);

  // ── Geolocation handler ────────────────────────────────────────────────────
  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Reverse geocode using a free API
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } },
          );
          if (!res.ok) throw new Error("Geocoding failed");
          const data = await res.json();
          const addr = data.address ?? {};

          // Extract PIN code — try postcode first
          const pin = (addr.postcode ?? "").replace(/\D/g, "").slice(0, 6);

          setForm((f) => ({
            ...f,
            postalCode: pin || f.postalCode,
            // Fill address line 1 if empty
            addressLine1: f.addressLine1 || [addr.road, addr.suburb, addr.neighbourhood].filter(Boolean).join(", ") || f.addressLine1,
          }));

          if (!pin) {
            setGeoError("Could not detect PIN code. Please enter it manually.");
          }
        } catch {
          setGeoError("Could not fetch location details. Please enter PIN manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location permission denied. Please enter PIN manually.");
        } else {
          setGeoError("Could not get location. Please enter PIN manually.");
        }
      },
      { timeout: 10000 },
    );
  }

  // ── Field helpers ───────────────────────────────────────────────────────────
  const set = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value })),
    [],
  );

  function handlePostalCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, postalCode: raw }));
    if (pinPopulated) {
      setPostOfficeOptions([]);
      setDistrictOptions([]);
      setPinPopulated(false);
      setStateUnlocked(false);
      setDistrictUnlocked(false);
      setForm((f) => ({ ...f, postalCode: raw, district: "", city: "" }));
    }
  }

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.addressLine1.trim()) e.addressLine1 = "Address is required.";
    if (!form.city.trim()) e.city = "City / Post Office is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!form.postalCode.trim()) e.postalCode = "PIN code is required.";
    else if (form.postalCode.length !== 6) e.postalCode = "PIN code must be exactly 6 digits.";
    if (!form.countryCode.trim()) e.countryCode = "Country code is required.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSave({
      label: form.label || undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      company: form.company || undefined,
      addressLine1: form.addressLine1,
      addressLine2: form.addressLine2 || undefined,
      city: form.city,
      state: form.state,
      postalCode: form.postalCode,
      countryCode: form.countryCode,
      phone: form.phone || undefined,
      isDefault: form.isDefault,
    });
  }

  // State field is locked when PIN was resolved and user hasn't clicked "Edit"
  const stateLocked = pinPopulated && !stateUnlocked && pinStatus === "success";
  // District locked when single-district PIN resolved and user hasn't clicked "Edit"
  const districtLocked = pinPopulated && !districtUnlocked && pinStatus === "success" && districtOptions.length <= 1;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>

      {statesError && (
        <div className="flex items-start gap-2 rounded-md bg-warning/10 border border-warning/30 px-3 py-2">
          <AlertTriangle className="size-3.5 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-[12px] text-warning leading-snug">{statesError}</p>
        </div>
      )}

      {/* ── Name ──────────────────────────────────────────────────────────── */}
      <Input
        label="Label (e.g. Home, Work)"
        value={form.label}
        onChange={set("label")}
        placeholder="Optional"
        autoComplete="off"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First Name"
          value={form.firstName}
          onChange={set("firstName")}
          autoComplete="given-name"
        />
        <Input
          label="Last Name"
          value={form.lastName}
          onChange={set("lastName")}
          autoComplete="family-name"
        />
      </div>

      <Input
        label="Company (optional)"
        value={form.company}
        onChange={set("company")}
        autoComplete="organization"
      />

      {/* ── Address lines ─────────────────────────────────────────────────── */}
      <Input
        label="Address Line 1"
        required
        value={form.addressLine1}
        onChange={set("addressLine1")}
        error={errors.addressLine1}
        autoComplete="address-line1"
      />
      <Input
        label="Address Line 2 (optional)"
        value={form.addressLine2}
        onChange={set("addressLine2")}
        autoComplete="address-line2"
      />

      {/* ── PIN code + geolocation ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="addr-pincode" className="text-[13px] font-semibold text-foreground">
            PIN Code <span className="ml-1 text-danger" aria-hidden="true">*</span>
          </label>
          {/* Geolocation button */}
          <button
            type="button"
            onClick={handleGeolocate}
            disabled={geoLoading}
            className="flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground disabled:opacity-50 transition-colors"
            aria-label="Auto-fill from location"
          >
            {geoLoading
              ? <Loader2 className="size-3 animate-spin" aria-hidden="true" />
              : <LocateFixed className="size-3" aria-hidden="true" />}
            {geoLoading ? "Detecting…" : "Use my location"}
          </button>
        </div>

        <div className="relative flex items-center">
          <input
            id="addr-pincode"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={form.postalCode}
            onChange={handlePostalCodeChange}
            placeholder="6-digit PIN"
            aria-describedby={errors.postalCode ? "addr-pincode-err" : undefined}
            aria-invalid={!!errors.postalCode}
            autoComplete="postal-code"
            className={cn(
              "w-full rounded-md border border-border bg-surface-container",
              "h-11 px-3 pr-10 text-[14px] text-foreground",
              "placeholder:text-foreground-muted",
              "transition-colors duration-150",
              "focus:outline-none focus:bg-surface-elevated focus:border-primary/40 focus:ring-1 focus:ring-primary/10",
              errors.postalCode && "border-danger focus:border-danger focus:ring-danger/10",
            )}
          />
          {pinStatus === "loading" && (
            <Loader2 className="absolute right-3 size-4 text-foreground-muted animate-spin pointer-events-none" aria-hidden="true" />
          )}
        </div>

        <PinStatusPill status={pinStatus} message={pinMessage} />
        {geoError && (
          <span className="flex items-center gap-1 text-[11px] text-warning">
            <AlertTriangle className="size-3" aria-hidden="true" />{geoError}
          </span>
        )}
        {errors.postalCode && (
          <p id="addr-pincode-err" className="text-[12px] text-danger" role="alert">{errors.postalCode}</p>
        )}
      </div>

      {/* ── State ─────────────────────────────────────────────────────────── */}
      {stateLocked ? (
        <LockedField
          label="State *"
          value={form.state}
          onUnlock={() => setStateUnlocked(true)}
        />
      ) : (
        <Combobox
          id="addr-state"
          label="State"
          required
          options={stateOptions}
          value={form.state}
          onChange={(v) => setForm((f) => ({ ...f, state: v }))}
          placeholder="Search state…"
          loading={statesLoading}
          error={errors.state}
          autoComplete="address-level1"
          clearable={false}
        />
      )}

      {/* ── District ─────────────────────────────────────────────────────── */}
      {districtLocked ? (
        <LockedField
          label="District"
          value={form.district}
          onUnlock={() => setDistrictUnlocked(true)}
        />
      ) : districtOptions.length > 1 ? (
        <Combobox
          id="addr-district"
          label="District"
          options={districtOptions}
          value={form.district}
          onChange={(v) => setForm((f) => ({ ...f, district: v }))}
          placeholder="Select district…"
          hint="Multiple districts found for this PIN. Please select yours."
        />
      ) : (
        <Input
          label="District"
          value={form.district}
          onChange={set("district")}
          placeholder="Auto-filled from PIN"
          autoComplete="address-level2"
        />
      )}

      {/* ── City / Post Office ────────────────────────────────────────────── */}
      {postOfficeOptions.length > 1 ? (
        <Combobox
          id="addr-city"
          label="City / Post Office"
          required
          options={postOfficeOptions}
          value={form.city}
          onChange={(v) => setForm((f) => ({ ...f, city: v }))}
          placeholder="Select post office…"
          error={errors.city}
          hint="Multiple post offices found — select the closest one."
        />
      ) : (
        <Input
          label="City / Post Office"
          required
          value={form.city}
          onChange={set("city")}
          placeholder="e.g. Bangalore GPO"
          error={errors.city}
          hint={postOfficeOptions.length === 1 ? "Auto-filled from PIN — you can change this." : undefined}
          autoComplete="address-level2"
        />
      )}

      {/* ── Phone ─────────────────────────────────────────────────────────── */}
      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={set("phone")}
        autoComplete="tel"
        hint={defaultPhone && !initial ? "Pre-filled from your verified profile number." : undefined}
      />

      {/* ── Country ──────────────────────────────────────────────────────── */}
      <Input
        label="Country Code"
        required
        value={form.countryCode}
        onChange={set("countryCode")}
        error={errors.countryCode}
        placeholder="IN"
        autoComplete="country"
      />

      {/* ── Default ──────────────────────────────────────────────────────── */}
      <label className="flex items-center gap-2 cursor-pointer text-body-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="h-4 w-4 accent-foreground"
        />
        Set as default address
      </label>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" fullWidth loading={saving}>
          {initial ? "Save Changes" : "Add Address"}
        </Button>
      </div>
    </form>
  );
}
