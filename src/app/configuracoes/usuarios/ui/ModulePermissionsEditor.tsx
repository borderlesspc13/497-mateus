"use client";

import {
  DEFAULT_PERMISSIONS_BY_ROLE,
  MODULE_GROUPS,
  MODULE_LABELS,
  type AppModule,
} from "@/lib/auth/modules";
import type { UserRole } from "@/lib/auth/roles";

type ModulePermissionsEditorProps = {
  value: AppModule[];
  onChange: (permissions: AppModule[]) => void;
  disabled?: boolean;
};

export function defaultPermissionsForRole(role: UserRole): AppModule[] {
  return [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
}

export function ModulePermissionsEditor({
  value,
  onChange,
  disabled = false,
}: ModulePermissionsEditorProps) {
  function toggle(module: AppModule) {
    if (disabled) return;
    if (value.includes(module)) {
      onChange(value.filter((item) => item !== module));
      return;
    }
    onChange([...value, module]);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-600">
        {value.length} módulo(s) habilitado(s)
      </p>

      {MODULE_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.modules.map((module) => {
              const active = value.includes(module);
              return (
                <label
                  key={module}
                  className={[
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : "border-zinc-200 bg-white text-zinc-600",
                    disabled ? "cursor-not-allowed opacity-60" : "hover:border-zinc-300",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-zinc-300"
                    checked={active}
                    disabled={disabled}
                    onChange={() => toggle(module)}
                  />
                  {MODULE_LABELS[module]}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
