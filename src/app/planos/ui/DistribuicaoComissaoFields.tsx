"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
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
  type FieldPath,
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
  criarParcelasVazias,
  distribuicaoComissaoSchema,
  distribuirPercentualIgualmente,
  formatPercentualInput,
  parsePercentualInput,
  type DistribuicaoComissaoFormValues,
} from "@/lib/planos/distribuicao-comissao-schema";

export type DistribuicaoComissaoFormHandle = {
  validate: () => Promise<DistribuicaoComissaoPayload | null>;
  getValues: () => DistribuicaoComissaoFormValues;
};

type DistribuicaoComissaoFieldsProps = {
  defaultValues: DistribuicaoComissaoFormValues;
  onValuesChange?: (values: DistribuicaoComissaoFormValues) => void;
};

type NivelConfig = {
  name: FieldPath<DistribuicaoComissaoFormValues>;
  title: string;
  description: string;
  badge: string;
  permiteParcelasZeradas?: boolean;
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
    title: "Repasse ao Vendedor (Nível 1)",
    description:
      "Percentual repassado ao vendedor e divisão por parcela (ex.: 7 parcelas com percentuais distintos).",
    badge: "Nível 1",
  },
  {
    name: "supervisor",
    title: "Repasse ao Supervisor / Líder (Nível 2)",
    description:
      "Percentual repassado ao supervisor e distribuição independente por parcela.",
    badge: "Nível 2",
  },
  {
    name: "diretor",
    title: "Repasse ao Diretor (Nível 3)",
    description:
      "Percentual repassado ao diretor. Parcelas sem valor podem ficar zeradas (ex.: só P1 e P3).",
    badge: "Nível 3",
    permiteParcelasZeradas: true,
  },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function DistribuicaoSection({
  config,
  defaultOpen,
  extra,
}: {
  config: NivelConfig;
  defaultOpen?: boolean;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-zinc-200/80 bg-white">
      <CollapsibleTrigger className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-zinc-50/80">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {config.badge}
            </span>
            <span className="text-sm font-semibold text-zinc-900">{config.title}</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{config.description}</p>
        </div>
        <ChevronDown
          className={`mt-0.5 size-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-zinc-200/80 px-4 py-4">
        <NivelDistribuicaoFields config={config} />
        {extra}
      </CollapsibleContent>
    </Collapsible>
  );
}

function NivelDistribuicaoFields({ config }: { config: NivelConfig }) {
  const {
    register,
    control,
    getValues,
    formState: { errors },
  } = useFormContext<DistribuicaoComissaoFormValues>();

  const nivelName = config.name as "empresa" | "vendedor" | "supervisor" | "diretor";
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
    Math.abs(somaParcelas - totalInformado) > 0.01;

  function distribuirIgualmente() {
    const total = parsePercentualInput(percentualTotal ?? "");
    const quantidade = Math.min(24, Math.max(1, Number(numeroParcelas) || 1));
    if (!Number.isFinite(total) || total <= 0) return;
    replace(distribuirPercentualIgualmente(total, quantidade));
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

      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
              Distribuição por parcela
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {config.permiteParcelasZeradas
                ? "Informe o percentual de cada parcela. Parcelas sem repasse podem ficar em 0."
                : "Informe o percentual exato de cada parcela. A soma deve igualar o total do nível."}
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
          {fields.map((field, index) => (
            <label key={field.id} className="block">
              <div className="mb-1 text-xs font-medium text-zinc-600">P{index + 1}</div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                className={formControlClass()}
                {...register(`${nivelName}.parcelas.${index}.percentual`)}
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={somaDivergente ? "font-medium text-amber-700" : "text-zinc-500"}>
            Soma das parcelas: {formatPercentualInput(somaParcelas)}%
            {Number.isFinite(totalInformado) && totalInformado > 0
              ? ` / Total: ${formatPercentualInput(totalInformado)}%`
              : null}
          </span>
          {somaDivergente ? (
            <span className="font-medium text-amber-700">Ajuste os valores para fechar o total.</span>
          ) : null}
        </div>

        <FieldError message={nivelErrors?.parcelas?.message} />
      </div>
    </div>
  );
}

export const DistribuicaoComissaoFields = forwardRef<
  DistribuicaoComissaoFormHandle,
  DistribuicaoComissaoFieldsProps
>(function DistribuicaoComissaoFields({ defaultValues, onValuesChange }, ref) {
  const methods = useForm<DistribuicaoComissaoFormValues>({
    resolver: zodResolver(distribuicaoComissaoSchema),
    defaultValues,
    mode: "onChange",
  });

  const watchedValues = useWatch({ control: methods.control });

  useEffect(() => {
    if (!onValuesChange || !watchedValues) return;
    onValuesChange(methods.getValues());
  }, [methods, onValuesChange, watchedValues]);

  useImperativeHandle(ref, () => ({
    async validate() {
      const isValid = await methods.trigger();
      if (!isValid) return null;
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
          Configure a árvore de recebimento da empresa e os repasses internos em quatro níveis
          hierárquicos, com parcelas dinâmicas e validação da soma por nível.
        </p>

        <div className="mt-5 space-y-3">
          <DistribuicaoSection config={NIVEIS[0]} defaultOpen extra={
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
          } />
          <DistribuicaoSection config={NIVEIS[1]} />
          <DistribuicaoSection config={NIVEIS[2]} />
          <DistribuicaoSection config={NIVEIS[3]} />
        </div>
      </div>
    </FormProvider>
  );
});

export type { DistribuicaoComissaoFormValues };
