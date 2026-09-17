import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type {
  CurrentMetrics,
  Diagnostic,
  FunnelInputs,
  OpportunityAnalysis,
  ProjectedMetrics,
} from "../../engine/types";
import { DiagnosticDetailsRows } from "./DiagnosticDetailsRows";
import { SimulatorPanel } from "./SimulatorPanel";

interface SecondaryDiagnosticSectionProps {
  diagnostic: Diagnostic;
  inputs: FunnelInputs;
  current: CurrentMetrics;
  opportunities: OpportunityAnalysis;
  projected: ProjectedMetrics;
  simulatorRate: number;
  simulatorMin: number;
  simulatorMax: number;
  onSimulatorChange: (rate: number) => void;
}

/**
 * "Ver meu diagnóstico completo" — o simulador, os custos/receitas e a leitura
 * dinâmica do motor deixam de disputar espaço com o CTA e viram uma consulta
 * opcional, fechada por padrão.
 */
export function SecondaryDiagnosticSection({
  diagnostic,
  inputs,
  current,
  opportunities,
  projected,
  simulatorRate,
  simulatorMin,
  simulatorMax,
  onSimulatorChange,
}: SecondaryDiagnosticSectionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="full-diagnostic" className="border-[color:var(--color-border)]">
        <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground hover:no-underline">
          Ver meu diagnóstico completo
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-5">
            <SimulatorPanel
              rate={simulatorRate}
              min={simulatorMin}
              max={simulatorMax}
              currentRate={current.leadToVisit}
              onChange={onSimulatorChange}
              visitsPotential={projected.visitsPotential}
              salesPotential={projected.salesPotential}
              vgvPotential={projected.vgvPotential}
            />

            <DiagnosticDetailsRows
              inputs={inputs}
              current={current}
              opportunities={opportunities}
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
