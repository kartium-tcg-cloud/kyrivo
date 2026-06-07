// src/app/contacts/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ContactType = "client" | "supplier";
type FilterType = "all" | ContactType;

interface Contact {
  id: string;
  company_id: string;
  created_at: string;
  type: ContactType;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  vat_number: string | null;
  notes: string | null;
}

interface ContactFormData {
  type: ContactType;
  name: string;
  email: string;
  phone: string;
  address: string;
  vat_number: string;
  notes: string;
}

const emptyForm = (type: ContactType): ContactFormData => ({
  type,
  name: "",
  email: "",
  phone: "",
  address: "",
  vat_number: "",
  notes: "",
});

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<ContactType>("client");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setErrorMessage("Utilisateur non connecté.");
          return;
        }

        const { data: membership, error: membershipError } = await supabase
          .from("memberships")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (membershipError) {
          throw membershipError;
        }

        if (!membership?.company_id) {
          setErrorMessage("Aucune société associée à ce compte.");
          return;
        }

        setCompanyId(membership.company_id);

        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .eq("company_id", membership.company_id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        setContacts((data ?? []) as Contact[]);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Erreur lors du chargement des contacts."
        );
      } finally {
        setLoading(false);
      }
    }

    loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return contacts.filter((contact) => {
      if (filterType !== "all" && contact.type !== filterType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        contact.name,
        contact.email ?? "",
        contact.phone ?? "",
        contact.vat_number ?? "",
        contact.address ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [contacts, filterType, search]);

  const stats = useMemo(() => {
    return {
      total: contacts.length,
      clients: contacts.filter((contact) => contact.type === "client").length,
      suppliers: contacts.filter((contact) => contact.type === "supplier").length,
    };
  }, [contacts]);

  function openAddForm(type: ContactType) {
    setFormType(type);
    setEditingContact(null);
    setAddMenuOpen(false);
    setFormOpen(true);
  }

  function openEditForm(contact: Contact) {
    setFormType(contact.type);
    setEditingContact(contact);
    setAddMenuOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingContact(null);
  }

  async function handleSubmit(formData: ContactFormData) {
    if (!companyId) {
      setErrorMessage("Société introuvable.");
      return;
    }

    const cleanedName = formData.name.trim();

    if (!cleanedName) {
      setErrorMessage("Le nom du contact est obligatoire.");
      return;
    }

    try {
      setErrorMessage(null);

      const supabase = createClient();

      const payload = {
        company_id: companyId,
        type: formData.type,
        name: cleanedName,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        vat_number: formData.vat_number.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (editingContact) {
        const { data, error } = await supabase
          .from("contacts")
          .update(payload)
          .eq("id", editingContact.id)
          .eq("company_id", companyId)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        setContacts((previousContacts) =>
          previousContacts.map((contact) =>
            contact.id === editingContact.id ? (data as Contact) : contact
          )
        );
      } else {
        const { data, error } = await supabase
          .from("contacts")
          .insert(payload)
          .select("*")
          .single();

        if (error) {
          throw error;
        }

        setContacts((previousContacts) => [data as Contact, ...previousContacts]);
      }

      closeForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement du contact."
      );
    }
  }

  async function handleDelete(contact: Contact) {
    const confirmed = window.confirm(
      `Supprimer définitivement "${contact.name}" ?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage(null);

      const supabase = createClient();

      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contact.id)
        .eq("company_id", contact.company_id);

      if (error) {
        throw error;
      }

      setContacts((previousContacts) =>
        previousContacts.filter((item) => item.id !== contact.id)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression du contact."
      );
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px]">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 rounded bg-neutral-800" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-xl bg-neutral-900/40" />
            <div className="h-24 rounded-xl bg-neutral-900/40" />
            <div className="h-24 rounded-xl bg-neutral-900/40" />
          </div>
          <div className="h-12 rounded-xl bg-neutral-900/40" />
          <div className="h-96 rounded-xl bg-neutral-900/40" />
        </div>
      </div>
    );
  }

  if (errorMessage && !companyId) {
    return (
      <div className="p-6 lg:p-8 max-w-[1440px]">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-sm text-red-400">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1440px] flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Contacts
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Gérez vos clients et fournisseurs pour vos ventes et achats.
          </p>
        </div>

        <AddButton
          isOpen={addMenuOpen}
          onToggle={() => setAddMenuOpen((value) => !value)}
          onClose={() => setAddMenuOpen(false)}
          onSelectClient={() => openAddForm("client")}
          onSelectSupplier={() => openAddForm("supplier")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats.total} icon={<UsersIcon />} />

        <StatCard
          label="Clients"
          value={stats.clients}
          icon={<UserIcon />}
          accent="amber"
        />

        <StatCard
          label="Fournisseurs"
          value={stats.suppliers}
          icon={<TruckIcon />}
          accent="blue"
        />
      </div>

      <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_240px]">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />

            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone, TVA…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="
                w-full rounded-lg border border-neutral-700/50
                bg-neutral-800/60 py-2 pl-9 pr-3 text-sm text-neutral-200
                placeholder:text-neutral-500
                transition-colors duration-200
                focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20
              "
            />
          </div>

          <div className="inline-flex rounded-lg border border-neutral-800 bg-neutral-900/60 p-1">
            <FilterButton
              label="Tous"
              active={filterType === "all"}
              onClick={() => setFilterType("all")}
            />
            <FilterButton
              label="Clients"
              active={filterType === "client"}
              onClick={() => setFilterType("client")}
            />
            <FilterButton
              label="Fourn."
              active={filterType === "supplier"}
              onClick={() => setFilterType("supplier")}
            />
          </div>
        </div>
      </div>

      {errorMessage && companyId && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5">
          <p className="text-xs text-red-400">{errorMessage}</p>

          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400/60 hover:text-red-400"
          >
            <CrossIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <ContactsTable
        contacts={filteredContacts}
        totalContacts={contacts.length}
        onEdit={openEditForm}
        onDelete={handleDelete}
        onCreateClient={() => openAddForm("client")}
        onCreateSupplier={() => openAddForm("supplier")}
      />

      {formOpen && (
        <ContactFormModal
          mode={editingContact ? "edit" : "create"}
          type={formType}
          initialData={editingContact}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
    </div>
  );
}

function AddButton({
  isOpen,
  onToggle,
  onClose,
  onSelectClient,
  onSelectSupplier,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectClient: () => void;
  onSelectSupplier: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="
          inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2
          text-sm font-semibold text-neutral-950 shadow-lg shadow-amber-500/10
          transition-all duration-200 hover:bg-amber-400 active:scale-[0.97]
        "
      >
        <PlusIcon className="h-4 w-4" />
        Ajouter un contact
        <ChevronIcon
          className={`h-3.5 w-3.5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Fermer le menu d'ajout"
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
          />

          <div
            className="
              absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl
              border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/40
            "
          >
            <div className="border-b border-neutral-800 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
                Type de contact
              </p>
            </div>

            <button
              type="button"
              onClick={onSelectClient}
              className="
                group flex w-full items-center gap-3 px-3 py-3 text-left
                transition-colors hover:bg-amber-500/5
              "
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
                <UserIcon />
              </span>

              <span className="flex-1">
                <span className="block text-sm font-medium text-white transition-colors group-hover:text-amber-400">
                  Ajouter un client
                </span>
                <span className="block text-[11px] text-neutral-500">
                  Pour vos ventes
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={onSelectSupplier}
              className="
                group flex w-full items-center gap-3 border-t border-neutral-800/60
                px-3 py-3 text-left transition-colors hover:bg-blue-500/5
              "
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-400">
                <TruckIcon />
              </span>

              <span className="flex-1">
                <span className="block text-sm font-medium text-white transition-colors group-hover:text-blue-400">
                  Ajouter un fournisseur
                </span>
                <span className="block text-[11px] text-neutral-500">
                  Pour vos achats
                </span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  accent?: "amber" | "blue";
}) {
  const styles =
    accent === "amber"
      ? {
          icon: "bg-amber-500/10 border-amber-500/25 text-amber-400",
          value: "text-amber-400",
        }
      : accent === "blue"
        ? {
            icon: "bg-blue-500/10 border-blue-500/25 text-blue-400",
            value: "text-blue-400",
          }
        : {
            icon: "bg-neutral-800/60 border-neutral-700 text-neutral-300",
            value: "text-white",
          };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-colors hover:border-neutral-700">
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${styles.icon}`}
      >
        {icon}
      </span>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${styles.value}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-150
        ${
          active
            ? "bg-amber-500/15 text-amber-400 shadow-sm"
            : "text-neutral-500 hover:text-neutral-300"
        }
      `}
    >
      {label}
    </button>
  );
}

function ContactsTable({
  contacts,
  totalContacts,
  onEdit,
  onDelete,
  onCreateClient,
  onCreateSupplier,
}: {
  contacts: Contact[];
  totalContacts: number;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onCreateClient: () => void;
  onCreateSupplier: () => void;
}) {
  if (totalContacts === 0) {
    return (
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-16 text-center">
        <UsersIcon className="mx-auto mb-3 h-10 w-10 text-neutral-700" />

        <p className="mb-1 font-medium text-white">Aucun contact pour l'instant</p>

        <p className="mb-5 text-sm text-neutral-500">
          Commencez par ajouter votre premier client ou fournisseur.
        </p>

        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCreateClient}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400"
          >
            <UserIcon />
            Ajouter un client
          </button>

          <button
            type="button"
            onClick={onCreateSupplier}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 transition-colors hover:bg-blue-500/15"
          >
            <TruckIcon />
            Ajouter un fournisseur
          </button>
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800/60 bg-neutral-800/20 p-16 text-center">
        <SearchIcon className="mx-auto mb-3 h-10 w-10 text-neutral-700" />
        <p className="text-sm text-neutral-500">
          Aucun contact ne correspond à vos filtres.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-800/20">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700/50">
              <TableHead>Type</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>N° TVA</TableHead>
              <TableHead align="center">Actions</TableHead>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-800/40">
            {contacts.map((contact, index) => (
              <tr
                key={contact.id}
                className={`
                  group transition-colors duration-150 hover:bg-amber-500/[0.03]
                  ${index % 2 === 0 ? "bg-transparent" : "bg-neutral-800/10"}
                `}
              >
                <td className="px-4 py-3">
                  <ContactTypeBadge type={contact.type} />
                </td>

                <td className="max-w-[220px] truncate px-4 py-3 font-medium">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-white underline decoration-amber-400/30 underline-offset-2 hover:text-amber-400 hover:decoration-amber-400/60 transition-colors"
                  >
                    {contact.name}
                  </Link>
                </td>

                <td className="max-w-[220px] truncate px-4 py-3 text-neutral-400">
                  {contact.email || <span className="text-neutral-700">—</span>}
                </td>

                <td className="px-4 py-3 tabular-nums text-neutral-400">
                  {contact.phone || <span className="text-neutral-700">—</span>}
                </td>

                <td className="px-4 py-3 font-mono text-xs text-neutral-400">
                  {contact.vat_number || (
                    <span className="text-neutral-700">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-0.5 opacity-40 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onEdit(contact)}
                      className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-700/50 hover:text-blue-400"
                      title="Modifier"
                    >
                      <EditIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(contact)}
                      className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableHead({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "center";
}) {
  return (
    <th
      className={`px-4 py-3 text-${align} text-[11px] font-semibold uppercase tracking-wider text-neutral-500`}
    >
      {children}
    </th>
  );
}

function ContactTypeBadge({ type }: { type: ContactType }) {
  if (type === "client") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400 ring-1 ring-amber-500/25">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Client
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-400 ring-1 ring-blue-500/25">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
      Fournisseur
    </span>
  );
}

function ContactFormModal({
  mode,
  type,
  initialData,
  onSubmit,
  onClose,
}: {
  mode: "create" | "edit";
  type: ContactType;
  initialData: Contact | null;
  onSubmit: (data: ContactFormData) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ContactFormData>(() => {
    if (!initialData) {
      return emptyForm(type);
    }

    return {
      type: initialData.type,
      name: initialData.name,
      email: initialData.email ?? "",
      phone: initialData.phone ?? "",
      address: initialData.address ?? "",
      vat_number: initialData.vat_number ?? "",
      notes: initialData.notes ?? "",
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const isDirtyRef = useRef(false);
  const handleCloseRef = useRef<() => void>(() => {});

  const isClient = form.type === "client";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        handleCloseRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function handleClose() {
    if (showUnsavedModal) return;
    if (mode === "edit" && isDirtyRef.current) {
      setShowUnsavedModal(true);
      return;
    }
    onClose();
  }
  handleCloseRef.current = handleClose;

  function updateField<K extends keyof ContactFormData>(
    key: K,
    value: ContactFormData[K]
  ) {
    isDirtyRef.current = true;

    setForm((previousForm) => ({
      ...previousForm,
      [key]: value,
    }));

    if (errors[key]) {
      setErrors((previousErrors) => {
        const copy = { ...previousErrors };
        delete copy[key];
        return copy;
      });
    }
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = "Le nom est obligatoire.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    mode === "create"
      ? isClient
        ? "Ajouter un client"
        : "Ajouter un fournisseur"
      : isClient
        ? "Modifier le client"
        : "Modifier le fournisseur";

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        className="
          relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl
          border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/50
        "
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`h-0.5 w-full ${isClient ? "bg-amber-500" : "bg-blue-500"}`} />

        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`
                inline-flex h-9 w-9 items-center justify-center rounded-lg border
                ${
                  isClient
                    ? "border-amber-500/25 bg-amber-500/10 text-amber-400"
                    : "border-blue-500/25 bg-blue-500/10 text-blue-400"
                }
              `}
            >
              {isClient ? <UserIcon /> : <TruckIcon />}
            </span>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">
                {title}
              </h2>
              <p className="text-[11px] text-neutral-500">
                {isClient
                  ? "Utilisé pour vos ventes et factures."
                  : "Utilisé pour vos achats et fournisseurs."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          >
            <CrossIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <FormField label="Nom" required error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder={
                isClient
                  ? "Nom du client ou raison sociale"
                  : "Nom du fournisseur"
              }
              autoFocus
              className={inputClass(errors.name)}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="contact@exemple.com"
                className={inputClass()}
              />
            </FormField>

            <FormField label="Téléphone">
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+32 470 00 00 00"
                className={inputClass()}
              />
            </FormField>
          </div>

          <FormField label="Adresse">
            <textarea
              rows={2}
              value={form.address}
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Rue, code postal, ville, pays"
              className={`${inputClass()} resize-none`}
            />
          </FormField>

          <FormField label="Numéro de TVA">
            <input
              type="text"
              value={form.vat_number}
              onChange={(event) => updateField("vat_number", event.target.value)}
              placeholder="BE1234.567.890"
              className={`${inputClass()} font-mono`}
            />
          </FormField>

          <FormField label="Notes internes">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder={
                isClient
                  ? "Préférences, historique commercial, remarques internes…"
                  : "Conditions, contact privilégié, délais habituels…"
              }
              className={`${inputClass()} resize-none`}
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-neutral-800 bg-neutral-950 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="
              rounded-lg px-4 py-2 text-sm font-medium text-neutral-400
              transition-colors hover:bg-neutral-800/60 hover:text-neutral-200
              disabled:opacity-50
            "
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="
              inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2
              text-sm font-semibold text-neutral-950 shadow-lg shadow-amber-500/10
              transition-all duration-200 hover:bg-amber-400 active:scale-[0.97]
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {submitting ? (
              <>
                <SpinnerIcon className="h-3.5 w-3.5 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                {mode === "create" ? "Créer le contact" : "Enregistrer"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>

    {showUnsavedModal && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="p-6">
            <h2 className="text-base font-semibold text-white">
              Modifications non enregistrées
            </h2>

            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Voulez-vous sauvegarder les modifications ?
            </p>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  isDirtyRef.current = false;
                  onClose();
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Non
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUnsavedModal(false);
                  handleSubmit();
                }}
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                Oui
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function FormField({
  label,
  required = false,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>

      {children}

      {error && <p className="mt-1.5 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}

function inputClass(error?: string) {
  return `
    w-full rounded-lg px-3 py-2.5 text-sm
    bg-neutral-900/60 text-neutral-200
    border ${error ? "border-red-500/50" : "border-neutral-800"}
    placeholder:text-neutral-600
    transition-colors duration-150
    focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/15
  `;
}

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function UserIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function TruckIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H15m-9.75 0H3.375c-.621 0-1.125-.504-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-4.875c-.621 0-1.125.504-1.125 1.125v3.375m0 0h-3" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}