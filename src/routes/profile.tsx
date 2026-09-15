import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Mail, Phone, Shield, Bell, CreditCard, LogOut, Check, Pencil, Camera, Trash2, Settings as SettingsIcon } from "lucide-react";
import { RequireAuth } from "@/auth/RequireAuth";
import { useAuth } from "@/auth/AuthProvider";
import { useAvatar } from "@/auth/useAvatar";


export const Route = createFileRoute("/profile")({
  component: ProfileRoute,
  head: () => ({
    meta: [
      { title: "Your profile — PayPal" },
      { name: "description", content: "View and edit your PayPal profile, contact details and account settings." },
      { property: "og:title", content: "Your profile — PayPal" },
      { property: "og:description", content: "View and edit your PayPal profile, contact details and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ProfileRoute() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}

const NAME_KEY = "pp:profile:name";
const PHONE_KEY = "pp:profile:phone";

function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const { url: avatarUrl, uploading, error: avatarError, upload, remove } = useAvatar();
  const fileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    setName(localStorage.getItem(NAME_KEY) ?? "");
    setPhone(localStorage.getItem(PHONE_KEY) ?? "");
  }, []);

  const save = () => {
    localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(PHONE_KEY, phone.trim());
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const email = user?.email ?? "";
  const displayName = name.trim() || email.split("@")[0] || "Your account";
  const initials = displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--pp-bg)]">
      <header className="flex items-center gap-3 px-4 pt-6 pb-3">
        <Link to="/" aria-label="Back" className="text-[var(--pp-blue-dark)] -ml-1">
          <ChevronLeft size={26} strokeWidth={2.25} />
        </Link>
        <h1 className="text-[20px] font-semibold text-[var(--pp-text)]">Profile</h1>
        <button
          onClick={() => (editing ? save() : setEditing(true))}
          className="ml-auto flex items-center gap-1 text-[15px] font-semibold text-[var(--pp-link)]"
        >
          {editing ? <Check size={18} /> : <Pencil size={16} />}
          {editing ? "Save" : "Edit"}
        </button>
      </header>

      <main className="flex-1 px-4 pb-10">
        <section className="rounded-2xl bg-white border border-[color:var(--border)] p-5 flex flex-col items-center">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your profile photo"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-[var(--pp-blue-dark)] flex items-center justify-center text-white text-[26px] font-bold">
                {initials || "PP"}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[var(--pp-blue-dark)] text-white flex items-center justify-center border-2 border-white disabled:opacity-60"
            >
              <Camera size={15} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void upload(f);
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="mt-3 text-[14px] font-semibold text-[var(--pp-link)] disabled:opacity-60"
          >
            {uploading ? "Uploading…" : avatarUrl ? "Change photo" : "Add photo"}
          </button>
          {avatarUrl && !uploading && (
            <button
              type="button"
              onClick={() => void remove()}
              className="mt-1 flex items-center gap-1 text-[13px] text-[var(--pp-text-muted)]"
            >
              <Trash2 size={13} /> Remove photo
            </button>
          )}
          {avatarError && (
            <p className="mt-2 text-[13px] font-semibold text-[var(--pp-notify)]">{avatarError}</p>
          )}

          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="mt-4 w-full h-11 rounded-md border border-[color:var(--border)] px-3 text-center text-[17px] text-[var(--pp-text)] outline-none focus:border-[var(--pp-blue)]"
            />
          ) : (
            <p className="mt-4 text-[20px] font-semibold text-[var(--pp-text)]">{displayName}</p>
          )}
          <p className="mt-1 text-[14px] text-[var(--pp-text-muted)] break-all text-center">{email}</p>
          {saved && <p className="mt-2 text-[13px] font-semibold text-[var(--pp-success)]">Profile saved</p>}
        </section>

        <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--pp-text-muted)]">
          Contact info
        </h2>
        <section className="rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
          <Row icon={<Mail size={20} />} label="Email" value={email} />
          {editing ? (
            <div className="flex items-center gap-4 px-4 py-3">
              <span className="text-[var(--pp-blue-dark)]"><Phone size={20} /></span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Add phone number"
                inputMode="tel"
                className="flex-1 h-10 rounded-md border border-[color:var(--border)] px-3 text-[15px] text-[var(--pp-text)] outline-none focus:border-[var(--pp-blue)]"
              />
            </div>
          ) : (
            <Row icon={<Phone size={20} />} label="Phone" value={phone || "Not added"} />
          )}
        </section>

        <h2 className="mt-6 mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-[var(--pp-text-muted)]">
          Account
        </h2>
        <section className="rounded-2xl bg-white border border-[color:var(--border)] divide-y divide-[color:var(--border)] overflow-hidden">
          <LinkRow icon={<SettingsIcon size={20} />} label="Account settings" to="/settings" />
          <LinkRow icon={<CreditCard size={20} />} label="Wallet" to="/wallet" />
          <LinkRow icon={<Shield size={20} />} label="Security check" to="/security-check" />
          <LinkRow icon={<Bell size={20} />} label="Notifications" to="/deals" />
        </section>

        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/auth" });
          }}
          className="mt-6 w-full rounded-full border border-[color:var(--border)] bg-white py-3.5 text-[16px] font-semibold text-[var(--pp-link)] flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </main>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <span className="text-[var(--pp-blue-dark)]">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] text-[var(--pp-text-muted)]">{label}</span>
        <span className="block text-[15px] text-[var(--pp-text)] break-all">{value}</span>
      </span>
    </div>
  );
}

function LinkRow({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-4 px-4 py-3.5">
      <span className="text-[var(--pp-blue-dark)]">{icon}</span>
      <span className="flex-1 text-[15px] font-medium text-[var(--pp-text)]">{label}</span>
      <ChevronRight size={18} className="text-[var(--pp-text-muted)]" />
    </Link>
  );
}
