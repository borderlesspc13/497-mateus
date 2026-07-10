"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Link2 } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ReactNode,
} from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formControlClass, panelClass } from "@/components/ui/list-panel-classes";
import {
  mapDistribuicaoToPayload,
  type DistribuicaoComissaoPayload,
} from "@/lib/planos/distribuicao-comissao-mappers";
import {
  distribuicaoComissaoSchema,
  distribuirPercentualIgualmente,
  formatPercentualInput,
  parsePercentualInput,
  TOLERANCIA_SOMA_PERCENTUAL,
  type DistribuicaoComissaoFormValues,
} from "@/lib/planos/distribuicao-comissao-schema";
import { formatMoneyPtBrFromCentavos } from "@/lib/validators/currency";
import { calcularComissaoTotalCentavos } from "@/utils/financeiro";

export type DistribuicaoComissaoFormHandle = {
  validate: () => Promise<DistribuicaoComissaoPayload | null>;
  getValues: () => DistribuicaoComissaoFormValues;
};

type DistribuicaoComissaoFieldsProps = {
  defaultValues: DistribuicaoComissaoFormValues;
  /** Crédito do plano em centavos — usado para prévia R$ de cada parcela. */
  valorCreditoCentavos?: number | null;
  onValuesChange?: (values: DistribuicaoComissaoFormValues) => void;
};

function valorMonetarioDoPercentual(
  creditoCentavos: number | null | undefined,
  percentualRaw: string | undefined,
): number | null {
  if (creditoCentavos == null || creditoCentavos <= 0) return null;
  const percentual = parsePercentualInput(percentualRaw ?? "");
  if (!Number.isFinite(percentual) || percentual < 0) return null;
  return calcularComissaoTotalCentavos(creditoCentavos, percentual);
}

function ValorCalculado({ centavos }: { centavos: number | null }) {
  if (centavos === null) {
    return (
      <p className="mt-1 text-[11px] text-zinc-400">Informe o valor do crédito para calcular</p>
    );
  }
  return (
    <p className="mt-1 text-[11px] font-medium tabular-nums text-zinc-700">
      {formatMoneyPtBrFromCentavos(centavos)}
    </p>
  );
}

type NivelKey = "empresa" | "vendedor" | "supervisor" | "diretor";

type NivelConfig = {
  name: NivelKey;
  title: string;
  description: string;
  badge: string;
};

const NIVEIS: NivelConfig[] = [
  {
    name: "empresa",
    title: "Comissão da Empresa (Recebimento)",
    description:
      "Percentual total recebido da administradora e distribuição exata por parcela de recebimento.",
    badge: "Empresa",
  },
  {
    name: "vendedor",
    title: "Repasse ao Vendedor",
    description:
      "Percentual repassado ao vendedor e divisão por parcela (ex.: 7 parcelas com percentuais distintos).",
    badge: "Vendedor",
  },
  {
    name: "supervisor",
    title: "Repasse ao Supervisor / Líder",
    description:
      "Percentual repassado ao supervisor e distribuição independente por parcela.",
    badge: "Supervisor",
  },
  {
    name: "diretor",
    title: "Repasse ao Diretor",
    description:
      "Percentual repassado ao diretor. A soma das parcelas deve fechar o percentual total do cargo.",
    badge: "Diretor",
  },
];

const REPASSE_NIVEIS: NivelKey[] = ["vendedor", "supervisor", "diretor"];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function nivelTemErro(
  errors: FieldErrors<DistribuicaoComissaoFormValues>,
  nivel: NivelKey,
): boolean {
  return Boolean(errors[nivel]);
}

function DistribuicaoSection({
  config,
  open,
  onOpenChange,
  hasError,
  valorCreditoCentavos,
  extra,
}: {
  config: NivelConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError?: boolean;
  valorCreditoCentavos?: number | null;
  extra?: ReactNode;
}) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={`rounded-xl border bg-white ${
        hasError ? "border-red-300 ring-1 ring-red-200" : "border-zinc-200/80"
      }`}
    >
      <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-zinc-50/80">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {config.badge}
            </span>
            <span className="text-sm font-semibold text-zinc-900">{config.title}</span>
            {hasError ? (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                Revisar
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{config.description}</p>
        </div>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-zinc-200/80 px-4 py-4">
        <NivelDistribuicaoFields
          config={config}
          valorCreditoCentavos={valorCreditoCentavos}
        />
        {extra}
      </CollapsibleContent>
    </Collapsible>
  );
}

function NivelDistribuicaoFields({
  config,
  valorCreditoCentavos,
}: {
  config: NivelConfig;
  valorCreditoCentavos?: number | null;
}) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<DistribuicaoComissaoFormValues>();

  const nivelName = config.name;
  const numeroParcelas = useWatch({ control, name: `${nivelName}.numeroParcelas` });
  const percentualTotal = useWatch({ control, name: `${nivelName}.percentualTotal` });
  const parcelas = useWatch({ control, name: `${nivelName}.parcelas` });

  const { fields, replace } = useFieldArray({
    control,
    name: `${nivelName}.parcelas`,
  });

  useEffect(() => {
    const quantidade = Math.min(24, Math.max(1, Number(numeroParcelas) || 1));
    if (fields.length === quantidade) return;

    const atuais = getValues(`${nivelName}.parcelas`) ?? [];
    const proximas = Array.from({ length: quantidade }, (_, index) => ({
      percentual: atuais[index]?.percentual ?? "",
    }));
    replace(proximas);
  }, [fields.length, getValues, nivelName, numeroParcelas, replace]);

  const nivelErrors = errors[nivelName];
  const somaParcelas = (parcelas ?? []).reduce((acc, parcela) => {
    const valor = parsePercentualInput(parcela?.percentual ?? "");
    return acc + (Number.isFinite(valor) ? valor : 0);
  }, 0);
  const totalInformado = parsePercentualInput(percentualTotal ?? "");
  const somaDivergente =
    Number.isFinite(totalInformado) &&
    totalInformado > 0 &&
    Math.abs(somaParcelas - totalInformado) > TOLERANCIA_SOMA_PERCENTUAL;

  const totalNivelCentavos = valorMonetarioDoPercentual(
    valorCreditoCentavos,
    percentualTotal,
  );
  const somaParcelasCentavos =
    valorCreditoCentavos != null && valorCreditoCentavos > 0
      ? (parcelas ?? []).reduce((acc, parcela) => {
          const valor = valorMonetarioDoPercentual(
            valorCreditoCentavos,
            parcela?.percentual,
          );
          return acc + (valor ?? 0);
        }, 0)
      : null;

  function distribuirIgualmente() {
    const total = parsePercentualInput(percentualTotal ?? "");
    const quantidade = Math.min(24, Math.max(1, Number(numeroParcelas) || 1));
    if (!Number.isFinite(total) || total <= 0) return;
    replace(distribuirPercentualIgualmente(total, quantidade));
  }

  function alinharRepassesAEmpresa() {
    const quantidade = Math.min(24, Math.max(1, Number(getValues("empresa.numeroParcelas")) || 1));

    for (const nivel of REPASSE_NIVEIS) {
      setValue(`${nivel}.numeroParcelas`, quantidade, {
        shouldDirty: true,
        shouldValidate: true,
      });

      const totalNivel = parsePercentualInput(getValues(`${nivel}.percentualTotal`) ?? "");
      const atuais = getValues(`${nivel}.parcelas`) ?? [];

      if (Number.isFinite(totalNivel) && totalNivel > 0) {
        setValue(`${nivel}.parcelas`, distribuirPercentualIgualmente(totalNivel, quantidade), {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else {
        const proximas = Array.from({ length: quantidade }, (_, index) => ({
          percentual: atuais[index]?.percentual ?? "",
        }));
        setValue(`${nivel}.parcelas`, proximas, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Porcentagem total (%) <span className="text-red-600">*</span>
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="2,20"
            className={formControlClass()}
            {...register(`${nivelName}.percentualTotal`)}
          />
          <ValorCalculado centavos={totalNivelCentavos} />
          <FieldError message={nivelErrors?.percentualTotal?.message} />
        </label>

        <label className="block">
          <div className="mb-1 text-xs font-medium text-zinc-600">
            Número de parcelas <span className="text-red-600">*</span>
          </div>
          <input
            type="number"
            min={1}
            max={24}
            className={formControlClass()}
            {...register(`${nivelName}.numeroParcelas`, { valueAsNumber: true })}
          />
          <FieldError message={nivelErrors?.numeroParcelas?.message} />
        </label>
      </div>

      {nivelName === "empresa" ? (
        <button
          type="button"
          onClick={alinharRepassesAEmpresa}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
        >
          <Link2 className="size-3.5" />
          Alinhar parcelas dos repasses à empresa
        </button>
      ) : null}

      <div
        className={`rounded-xl border border-dashed p-4 ${
          somaDivergente
            ? "border-amber-300 bg-amber-50/80"
            : "border-zinc-200 bg-zinc-50/70"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Distribuição por parcela
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Informe o percentual exato de cada parcela. O valor em R$ é calculado
              automaticamente sobre o crédito do plano.
            </p>
          </div>
          <button
            type="button"
            onClick={distribuirIgualmente}
            className="inline-flex h-8 items-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Distribuir igualmente
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {fields.map((field, index) => {
            const parcelaCentavos = valorMonetarioDoPercentual(
              valorCreditoCentavos,
              parcelas?.[index]?.percentual,
            );
            return (
              <label key={field.id} className="block">
                <div className="mb-1 text-xs font-medium text-zinc-600">P{index + 1}</div>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className={`${formControlClass()} ${
                    somaDivergente ? "border-amber-300 focus-visible:border-amber-400" : ""
                  }`}
                  {...register(`${nivelName}.parcelas.${index}.percentual`)}
                />
                <ValorCalculado centavos={parcelaCentavos} />
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span
            className={
              somaDivergente ? "font-semibold text-amber-800" : "font-medium text-zinc-600"
            }
          >
            Soma das parcelas: {formatPercentualInput(somaParcelas)}%
            {Number.isFinite(totalInformado) && totalInformado > 0
              ? ` / Total: ${formatPercentualInput(totalInformado)}%`
              : null}
            {somaParcelasCentavos !== null
              ? ` · ${formatMoneyPtBrFromCentavos(somaParcelasCentavos)}`
              : null}
          </span>
          {somaDivergente ? (
            <span className="font-medium text-amber-800">
              Diferença:{" "}
              {formatPercentualInput(Math.abs(somaParcelas - totalInformado))} pp — ajuste para
              fechar o total.
            </span>
          ) : Number.isFinite(totalInformado) &&
            totalInformado > 0 &&
            fields.length > 0 ? (
            <span className="font-medium text-emerald-700">Soma fechada</span>
          ) : null}
        </div>

        <FieldError
          message={
            typeof nivelErrors?.parcelas?.message === "string"
              ? nivelErrors.parcelas.message
              : undefined
          }
        />
      </div>
    </div>
  );
}

export const DistribuicaoComissaoFields = forwardRef<
  DistribuicaoComissaoFormHandle,
  DistribuicaoComissaoFieldsProps
>(function DistribuicaoComissaoFields(
  { defaultValues, valorCreditoCentavos = null, onValuesChange },
  ref,
) {
  const methods = useForm<DistribuicaoComissaoFormValues>({
    resolver: zodResolver(distribuicaoComissaoSchema),
    defaultValues,
    mode: "onChange",
  });

  const [openByNivel, setOpenByNivel] = useState<Record<NivelKey, boolean>>({
    empresa: true,
    vendedor: true,
    supervisor: true,
    diretor: true,
  });

  const watchedValues = useWatch({ control: methods.control });
  const formErrors = methods.formState.errors;

  useEffect(() => {
    if (!onValuesChange || !watchedValues) return;
    onValuesChange(methods.getValues());
  }, [methods, onValuesChange, watchedValues]);

  useImperativeHandle(ref, () => ({
    async validate() {
      const isValid = await methods.trigger();
      if (!isValid) {
        const parsed = distribuicaoComissaoSchema.safeParse(methods.getValues());
        const issuePaths = parsed.success
          ? []
          : parsed.error.issues.map((issue) => String(issue.path[0] ?? ""));

        setOpenByNivel((prev) => ({
          empresa:
            prev.empresa ||
            issuePaths.includes("empresa") ||
            issuePaths.includes("diasParaEstorno"),
          vendedor: prev.vendedor || issuePaths.includes("vendedor"),
          supervisor: prev.supervisor || issuePaths.includes("supervisor"),
          diretor: prev.diretor || issuePaths.includes("diretor"),
        }));
        return null;
      }
      return mapDistribuicaoToPayload(methods.getValues());
    },
    getValues() {
      return methods.getValues();
    },
  }));

  return (
    <FormProvider {...methods}>
      <div className={`${panelClass()} mt-8 border-zinc-200/80 p-5`}>
        <div className="text-sm font-semibold text-zinc-900">Distribuição de comissões</div>
        <p className="mt-1.5 text-xs leading-5 text-zinc-500">
          Configure em cascata o recebimento da empresa e os repasses internos (Vendedor →
          Supervisor → Diretor). Os valores em R$ são calculados automaticamente com base no
          valor do crédito e no percentual de cada parcela.
        </p>

        <div className="mt-5 space-y-3">
          <DistribuicaoSection
            config={NIVEIS[0]}
            open={openByNivel.empresa}
            onOpenChange={(open) => setOpenByNivel((p) => ({ ...p, empresa: open }))}
            hasError={nivelTemErro(formErrors, "empresa") || Boolean(formErrors.diasParaEstorno)}
            valorCreditoCentavos={valorCreditoCentavos}
            extra={
              <label className="mt-4 block border-t border-zinc-200/80 pt-4">
                <div className="mb-1 text-xs font-medium text-zinc-600">
                  Dias para estorno <span className="text-red-600">*</span>
                </div>
                <input
                  type="number"
                  min={1}
                  className={formControlClass()}
                  {...methods.register("diasParaEstorno")}
                />
                <FieldError message={methods.formState.errors.diasParaEstorno?.message} />
              </label>
            }
          />
          <DistribuicaoSection
            config={NIVEIS[1]}
            open={openByNivel.vendedor}
            onOpenChange={(open) => setOpenByNivel((p) => ({ ...p, vendedor: open }))}
            hasError={nivelTemErro(formErrors, "vendedor")}
            valorCreditoCentavos={valorCreditoCentavos}
          />
          <DistribuicaoSection
            config={NIVEIS[2]}
            open={openByNivel.supervisor}
            onOpenChange={(open) => setOpenByNivel((p) => ({ ...p, supervisor: open }))}
            hasError={nivelTemErro(formErrors, "supervisor")}
            valorCreditoCentavos={valorCreditoCentavos}
          />
          <DistribuicaoSection
            config={NIVEIS[3]}
            open={openByNivel.diretor}
            onOpenChange={(open) => setOpenByNivel((p) => ({ ...p, diretor: open }))}
            hasError={nivelTemErro(formErrors, "diretor")}
            valorCreditoCentavos={valorCreditoCentavos}
          />
        </div>
      </div>
    </FormProvider>
  );
});

export type { DistribuicaoComissaoFormValues };
