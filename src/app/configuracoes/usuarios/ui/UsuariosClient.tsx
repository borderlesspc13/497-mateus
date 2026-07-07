"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  changeUsuarioPermissions,
  changeUsuarioRole,
  createUsuario,
} from "@/actions/usuarios";
import { DataListPanel } from "@/components/ui/DataListPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  dataTableClass,
  formControlClass,
  panelClass,
  primaryActionClass,
  secondaryActionClass,
  tableCellClass,
  tableHeadCellClass,
  tableRowClass,
  tableWrapClass,
} from "@/components/ui/list-panel-classes";
import type { AppModule } from "@/lib/auth/modules";
import { USER_ROLES, roleLabel, type UserRole } from "@/lib/auth/roles";
import type { UsuarioRow } from "@/lib/types/domain";
import {
  defaultPermissionsForRole,
  ModulePermissionsEditor,
} from "./ModulePermissionsEditor";

type UsuariosClientProps = {
  initialItems: UsuarioRow[];
  currentUserId: string;
};

type CreateForm = {
  nome: string;
  email: string;
  password: string;
  role: UserRole;
  permissions: AppModule[];
};

const EMPTY_FORM: CreateForm = {
  nome: "",
  email: "",
  password: "",
  role: "vendedor",
  permissions: defaultPermissionsForRole("vendedor"),
};

export default function UsuariosClient({ initialItems, currentUserId }: UsuariosClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);
  const [permissionsEditingId, setPermissionsEditingId] = useState<string | null>(null);
  const [permissionsDraft, setPermissionsDraft] = useState<AppModule[]>([]);
  const [permissionsSavingId, setPermissionsSavingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = `${item.email} ${item.displayName ?? ""} ${roleLabel(item.role)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const row = await createUsuario({
        nome: form.nome,
        email: form.email,
        password: form.password,
        role: form.role,
        permissions: form.permissions,
      });
      setItems((prev) => [...prev, row].sort((a, b) => a.email.localeCompare(b.email, "pt-BR")));
      setForm(EMPTY_FORM);
      setShowForm(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar usuário.");
    } finally {
      setSaving(false);
    }
  }

  async function onRoleChange(uid: string, role: UserRole) {
    setError(null);
    setRoleUpdatingId(uid);
    try {
      const row = await changeUsuarioRole(uid, role);
      setItems((prev) => prev.map((item) => (item.id === uid ? row : item)));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao alterar perfil.");
    } finally {
      setRoleUpdatingId(null);
    }
  }

  function openPermissionsEditor(item: UsuarioRow) {
    setPermissionsEditingId(item.id);
    setPermissionsDraft(item.permissions as AppModule[]);
  }

  async function savePermissions(uid: string) {
    setError(null);
    setPermissionsSavingId(uid);
    try {
      const row = await changeUsuarioPermissions(uid, permissionsDraft);
      setItems((prev) => prev.map((item) => (item.id === uid ? row : item)));
      setPermissionsEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar módulos.");
    } finally {
      setPermissionsSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <form onSubmit={(e) => void onCreate(e)} className={`${panelClass()} p-6`}>
          <div className="text-sm font-medium text-zinc-900">Novo usuário</div>
          <p className="mt-1 text-xs text-zinc-500">
            A conta será criada no Firebase Auth com o e-mail e senha informados.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Nome <span className="text-red-600">*</span>
              </div>
              <input
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className={formControlClass()}
                placeholder="Nome completo"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                E-mail <span className="text-red-600">*</span>
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={formControlClass()}
                placeholder="usuario@empresa.com"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Senha inicial <span className="text-red-600">*</span>
              </div>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className={formControlClass()}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">
                Perfil base <span className="text-red-600">*</span>
              </div>
              <select
                value={form.role}
                onChange={(e) => {
                  const role = e.target.value as UserRole;
                  setForm((p) => ({
                    ...p,
                    role,
                    permissions: defaultPermissionsForRole(role),
                  }));
                }}
                className={formControlClass()}
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 border-t border-zinc-100 pt-4">
            <p className="text-sm font-medium text-zinc-900">Módulos permitidos</p>
            <p className="mt-1 text-xs text-zinc-500">
              Defina quais áreas do sistema este usuário poderá acessar.
            </p>
            <div className="mt-4">
              <ModulePermissionsEditor
                value={form.permissions}
                onChange={(permissions) => setForm((p) => ({ ...p, permissions }))}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={primaryActionClass()}>
              {saving ? "Criando..." : "Criar usuário"}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className={secondaryActionClass()}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <DataListPanel
        toolbar={
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou perfil..."
              className={formControlClass("lg")}
            />
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className={primaryActionClass()}
            >
              {showForm ? "Fechar formulário" : "Novo usuário"}
            </button>
          </>
        }
        error={
          error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhum usuário cadastrado" : "Nenhum resultado encontrado"}
            description={
              items.length === 0
                ? "Crie o primeiro usuário para liberar acessos à equipe."
                : "Ajuste o termo de busca."
            }
            action={
              items.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className={primaryActionClass()}
                >
                  Novo usuário
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className={tableWrapClass()}>
            <table className={dataTableClass()}>
              <thead>
                <tr>
                  <th className={tableHeadCellClass()}>Nome</th>
                  <th className={tableHeadCellClass()}>E-mail</th>
                  <th className={tableHeadCellClass()}>Perfil</th>
                  <th className={tableHeadCellClass()}>Módulos</th>
                  <th className={tableHeadCellClass()}>Cadastrado em</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, index) => (
                  <Fragment key={item.id}>
                    <tr className={tableRowClass(index)}>
                      <td className={`${tableCellClass()} font-medium text-zinc-900`}>
                        {item.displayName ?? "—"}
                        {item.id === currentUserId ? (
                          <span className="ml-2 text-xs font-normal text-zinc-500">(você)</span>
                        ) : null}
                      </td>
                      <td className={tableCellClass()}>{item.email}</td>
                      <td className={tableCellClass()}>
                        <select
                          value={item.role}
                          disabled={roleUpdatingId === item.id}
                          onChange={(e) =>
                            void onRoleChange(item.id, e.target.value as UserRole)
                          }
                          className={formControlClass("sm")}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={tableCellClass()}>
                        <button
                          type="button"
                          className="text-sm font-semibold text-sky-700 hover:text-sky-800"
                          onClick={() => openPermissionsEditor(item)}
                        >
                          {item.permissions.length} módulo(s)
                        </button>
                      </td>
                      <td className={`${tableCellClass()} whitespace-nowrap`}>
                        {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                    {permissionsEditingId === item.id ? (
                      <tr key={`${item.id}-permissions`} className="bg-zinc-50/80">
                        <td colSpan={5} className={`${tableCellClass()} py-5`}>
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-zinc-900">
                                  Módulos de {item.displayName ?? item.email}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  O menu lateral e as rotas respeitam apenas os módulos marcados.
                                </p>
                              </div>
                              <button
                                type="button"
                                className={secondaryActionClass()}
                                onClick={() =>
                                  setPermissionsDraft(defaultPermissionsForRole(item.role))
                                }
                              >
                                Usar padrão do perfil
                              </button>
                            </div>
                            <ModulePermissionsEditor
                              value={permissionsDraft}
                              onChange={setPermissionsDraft}
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className={primaryActionClass()}
                                disabled={permissionsSavingId === item.id}
                                onClick={() => void savePermissions(item.id)}
                              >
                                {permissionsSavingId === item.id
                                  ? "Salvando..."
                                  : "Salvar módulos"}
                              </button>
                              <button
                                type="button"
                                className={secondaryActionClass()}
                                onClick={() => setPermissionsEditingId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataListPanel>
    </div>
  );
}
