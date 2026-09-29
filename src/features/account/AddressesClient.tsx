"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Star, Trash2, Pencil, MapPin } from "lucide-react";
import { cn , extractApiError } from "@/lib/utils";
import { addressesApi } from "@/services/api/addresses";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { AddressForm } from "./AddressForm";
import type { CustomerAddressResponse, CreateAddressRequest, UpdateAddressRequest } from "@/types/api";

export function AddressesClient() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [addresses, setAddresses] = useState<CustomerAddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddressResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerAddressResponse | null>(null);

  const load = useCallback(async () => {
    const result = await addressesApi.list();
    if (result.ok) setAddresses(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetch = async () => { await load(); };
    void fetch();
  }, [load]);

  async function handleSave(data: CreateAddressRequest | UpdateAddressRequest) {
    setMutating(true);
    if (editing) {
      const result = await addressesApi.update(editing.id, data as UpdateAddressRequest);
      if (result.ok) {
        setAddresses((prev) => prev.map((a) => a.id === editing.id ? result.data : a));
        toastSuccess("Address updated");
        setEditing(null);
        setFormOpen(false);
      } else {
        toastError("Could not update address", extractApiError(result.error, "Please try again."));
      }
    } else {
      const result = await addressesApi.create(data as CreateAddressRequest);
      if (result.ok) {
        setAddresses((prev) => [...prev, result.data]);
        toastSuccess("Address added");
        setFormOpen(false);
      } else {
        toastError("Could not add address", extractApiError(result.error, "Please try again."));
      }
    }
    setMutating(false);
  }

  async function handleSetDefault(id: string) {
    setMutating(true);
    const result = await addressesApi.setDefault(id);
    if (result.ok) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toastSuccess("Default address updated");
    } else {
      toastError("Could not set default address");
    }
    setMutating(false);
  }

  async function handleDelete(address: CustomerAddressResponse) {
    setMutating(true);
    const result = await addressesApi.delete(address.id);
    if (result.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== address.id));
      toastSuccess("Address removed");
    } else {
      toastError("Could not remove address", extractApiError(result.error, "Please try again."));
      await load(); // resync
    }
    setDeleteTarget(null);
    setMutating(false);
  }

  if (loading) return <AddressesSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-h3 font-bold text-foreground">Addresses</h1>
        <Button
          variant="outline"
          size="sm"
          iconLeft={<Plus className="size-3.5" />}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-4 text-center rounded-xl border border-border bg-surface">
          <MapPin className="size-8 text-foreground-muted" aria-hidden="true" />
          <div>
            <p className="text-body-sm font-medium text-foreground">No saved addresses</p>
            <p className="text-caption text-foreground-muted mt-1">Add an address to speed up checkout.</p>
          </div>
          <Button variant="outline" size="sm" iconLeft={<Plus className="size-3.5" />} onClick={() => { setEditing(null); setFormOpen(true); }}>
            Add Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={cn(
                "relative flex flex-col gap-2 p-4 rounded-xl border",
                addr.isDefault ? "border-foreground" : "border-border",
              )}
            >
              {addr.isDefault && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-caption font-semibold text-foreground">
                  <Star className="size-3 fill-foreground" aria-hidden="true" />
                  Default
                </span>
              )}
              <address className="not-italic text-body-sm text-foreground-muted leading-relaxed">
                <p className="font-semibold text-foreground">
                  {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || addr.label || "Address"}
                </p>
                {addr.company && <p>{addr.company}</p>}
                {addr.addressLine1 && <p>{addr.addressLine1}</p>}
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</p>
                {addr.countryCode && <p>{addr.countryCode}</p>}
                {addr.phone && <p>{addr.phone}</p>}
              </address>

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <button
                  onClick={() => { setEditing(addr); setFormOpen(true); }}
                  disabled={mutating}
                  className="flex items-center gap-1 text-caption text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
                  aria-label={`Edit address`}
                >
                  <Pencil className="size-3" /> Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={mutating}
                    className="flex items-center gap-1 text-caption text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
                  >
                    <Star className="size-3" /> Set default
                  </button>
                )}
                <button
                  onClick={() => setDeleteTarget(addr)}
                  disabled={mutating}
                  className="flex items-center gap-1 text-caption text-foreground-muted hover:text-danger transition-colors disabled:opacity-40 ml-auto"
                  aria-label="Delete address"
                >
                  <Trash2 className="size-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? "Edit Address" : "Add Address"}
        size="max-w-lg"
      >
        <AddressForm
          initial={editing ?? undefined}
          onSave={handleSave}
          saving={mutating}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Address"
        size="max-w-sm"
      >
        <p className="text-body-sm text-foreground-muted mb-6">
          Are you sure you want to remove this address? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" fullWidth onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            fullWidth
            loading={mutating}
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AddressesSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex justify-between mb-6">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
