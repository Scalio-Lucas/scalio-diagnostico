import { WHATSAPP_GROUP_URL } from "../../config";

/**
 * BLOCO 3 — transição pura, sem números do diagnóstico:
 * "sei o problema" → "preciso saber como" → "a aula mostra como" → CTA.
 * O bloco anterior ("O impacto está aqui") já provou a oportunidade; este
 * bloco não a repete, só aponta o próximo passo.
 */
export function CTASection() {
  return (
    <div className="glow-electric rounded-2xl border border-[#2563EB]/50 bg-[#0B1A33] p-6 text-center sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--electric-bright)]">
        Aula ao vivo • Gratuita
      </p>

      <h2 className="mx-auto mt-3 max-w-md font-display text-xl font-bold leading-snug text-white sm:text-2xl">
        Agora você já sabe o que precisa melhorar.
        <br />O próximo passo é aprender <span className="text-[#2B55F5]">COMO</span> fazer.
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">
        E é exatamente isso que eu vou te mostrar em uma aula ao vivo e gratuita: como melhorar seu
        processo para transformar mais leads em visitas e gerar mais vendas.
      </p>

      <a
        href={WHATSAPP_GROUP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#2563EB]/90 active:scale-[0.98] sm:mx-auto sm:w-auto sm:px-10"
      >
        Quero participar da aula gratuita <span aria-hidden>→</span>
      </a>

      <p className="mx-auto mt-3 max-w-sm text-xs text-slate-400">
        Entre no grupo do WhatsApp para receber o link e os avisos da aula.
      </p>
    </div>
  );
}
