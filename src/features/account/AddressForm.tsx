"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CustomerAddressResponse, CreateAddressRequest } from "@/types/api";

interface AddressFormProps {
  initial?: CustomerAddressResponse;
  onSave: (data: CreateAddressRequest) => void;
  saving: boolean;
  onCancel: () => void;
}

export function AddressForm({ initial, onSave, saving, onCancel }: AddressFormProps) {
  const [form, setForm] = useState({
    label: initial?.label ?? "",
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    company: initial?.company ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    postalCode: initial?.postalCode ?? "",
    countryCode: initial?.countryCode ?? "IN",
    phone: initial?.phone ?? "",
    isDefault: initial?.isDefault ?? false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.addressLine1.trim()) e.addressLine1 = "Address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!form.postalCode.trim()) e.postalCode = "Postal code is required.";
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

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Input label="Label (e.g. Home, Work)" value={form.label} onChange={set("label")} placeholder="Optional" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="First Name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
        <Input label="Last Name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
      </div>

      <Input label="Company (optional)" value={form.company} onChange={set("company")} autoComplete="organization" />

      <Input label="Address Line 1" required value={form.addressLine1} onChange={set("addressLine1")} error={errors.addressLine1} autoComplete="address-line1" />
      <Input label="Address Line 2 (optional)" value={form.addressLine2} onChange={set("addressLine2")} autoComplete="address-line2" />

      <div className="grid grid-cols-2 gap-3">
        <Input label="City" required value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
        <Input label="State" required value={form.state} onChange={set("state")} error={errors.state} autoComplete="address-level1" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Postal Code" required value={form.postalCode} onChange={set("postalCode")} error={errors.postalCode} autoComplete="postal-code" />
        <Input label="Country Code" required value={form.countryCode} onChange={set("countryCode")} error={errors.countryCode} placeholder="IN" autoComplete="country" />
      </div>

      <Input label="Phone" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" />

      <label className="flex items-center gap-2 cursor-pointer text-body-sm text-foreground">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
          className="h-4 w-4 accent-foreground"
        />
        Set as default address
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" fullWidth onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" fullWidth loading={saving}>
          {initial ? "Save Changes" : "Add Address"}
        </Button>
      </div>
    </form>
  );
}
