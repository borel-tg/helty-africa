import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const DEMO_ACCOUNTS = [
  ["superadmin@helty.africa", "roles.super_admin"],
  ["admin@helty.africa", "roles.admin"],
  ["lead@helty.africa", "roles.lead"],
  ["learner@helty.africa", "roles.learner"],
];

export function DemoAccountsPanel({ onSelect }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
      >
        {t("auth.demoMode")}
        <ChevronDown
          size={16}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-primary-100 pt-3 space-y-1">
          {DEMO_ACCOUNTS.map(([email, roleKey]) => (
            <button
              key={email}
              type="button"
              onClick={() => onSelect(email, "demo1234")}
              className="block w-full text-left text-xs text-primary-700 hover:underline py-0.5"
            >
              {t(roleKey)}: {email}
            </button>
          ))}
          <p className="text-[10px] text-text-secondary mt-2">
            {t("auth.demoPassword")}
          </p>
        </div>
      )}
    </div>
  );
}
