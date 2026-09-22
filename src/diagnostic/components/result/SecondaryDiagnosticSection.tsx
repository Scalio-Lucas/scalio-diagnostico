import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Diagnostic, FunnelInputs, Scenario } from "../../engine/types";
import { DiagnosticDetailsRows } from "./DiagnosticDetailsRows";

interface SecondaryDiagnosticSectionProps {
  diagnostic: Diagnostic;
  inputs: FunnelInputs;
  current: Scenario;
  referenceBase: Scenario;
  referenceMin: Scenario;
  referenceMax: Scenario;
}

/**
 * "Ver meu diagnóstico completo" — a cadeia completa Hoje × Cenário de
 * referência, mais a leitura dinâmica do motor. O antigo simulador de
 * Lead→Visita foi removido: ele recalculava visitas/vendas a partir dos
 * leads ATUAIS e da Visita→Venda histórica, produzindo números incoerentes
 * com o cenário de referência mostrado logo abaixo. Preferimos remover a
 * interação a apresentar matemática incoerente.
 */
export function SecondaryDiagnosticSection({
  diagnostic,
  inputs,
  current,
  referenceBase,
  referenceMin,
  referenceMax,
}: SecondaryDiagnosticSectionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="full-diagnostic" className="border-[color:var(--color-border)]">
        <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground hover:no-underline">
          Ver meu diagnóstico completo
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5">
            <DiagnosticDetailsRows
              inputs={inputs}
              current={current}
              referenceBase={referenceBase}
              referenceMin={referenceMin}
              referenceMax={referenceMax}
            />

            {diagnostic.diagnosticText ? (
              <div className="border-t border-[color:var(--color-border)] pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  O que seus números mostram
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {diagnostic.diagnosticText}
                </p>
                {diagnostic.secondaryObservation ? (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {diagnostic.secondaryObservation}
                  </p>
                ) : null}
                {diagnostic.recommendations.length > 0 ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {formatList(diagnostic.recommendations)} são alguns dos fatores que podem
                    influenciar essa etapa.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function formatList(items: string[]): string {
  const capitalized = [items[0].charAt(0).toUpperCase() + items[0].slice(1), ...items.slice(1)];
  if (capitalized.length <= 1) return capitalized.join("");
  return `${capitalized.slice(0, -1).join(", ")} e ${capitalized[capitalized.length - 1]}`;
}
