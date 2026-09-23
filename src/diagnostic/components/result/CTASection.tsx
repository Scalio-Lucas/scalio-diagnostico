import { BOOKING_URL } from "../../config";
import { formatBRLAbbrev } from "../../engine/format";
import type { Diagnostic } from "../../engine/types";

interface CTASectionProps {
  diagnostic: Diagnostic;
}

/**
 * BLOCO 3 — convite para reunião estratégica (agenda direta, sem etapa de
 * WhatsApp/aula). Quando há oportunidade calculada, a copy referencia o VGV
 * potencial do próprio diagnóstico; nunca promete o resultado como garantido
 * ("alcance" + "com o método", não "você vai vender").
 */
export function CTASection({ diagnostic }: CTASectionProps) {
  const headline = diagnostic.hasOpportunity ? (
    <>
      Alcance os{" "}
      <span className="text-[#2B55F5]">+{formatBRLAbbrev(diagnostic.opportunityVGV)}</span> em VGV
      potencial com o método.
    </>
  ) : (
    <>
      Descubra como aplicar <span className="text-[#2B55F5]">o método</span> para vender mais.
    </>
  );

  return (
    <div className="glow-electric rounded-2xl border border-[#2563EB]/50 bg-[#0B1A33] p-6 text-center sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--electric-bright)]">
        Reunião estratégica • Gratuita
      </p>

      <h2 className="mx-auto mt-3 max-w-md font-display text-xl font-bold leading-snug text-white sm:text-2xl">
        {headline}
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
        Agende uma reunião estratégica gratuita com nosso time e veja como aplicar o método na sua
        operação para transformar esse potencial em vendas reais.
      </p>

      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#2563EB]/90 active:scale-[0.98] sm:mx-auto sm:w-auto sm:px-10"
      >
        Quero agendar minha reunião <span aria-hidden>→</span>
      </a>

      <p className="mx-auto mt-3 max-w-sm text-xs text-slate-400">
        Escolha o melhor horário direto na nossa agenda. Sem compromisso.
      </p>
    </div>
  );
}
