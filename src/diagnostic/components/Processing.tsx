import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";

const MESSAGES = [
  "Analisando seu funil...",
  "Calculando suas taxas...",
  "Identificando oportunidades...",
  "Simulando seu potencial...",
  "Diagnóstico concluído.",
];

const STEP_MS = 550; // 5 mensagens * 550ms ≈ 2.75s — dentro do teto de 2-3s do briefing

export function Processing({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= MESSAGES.length - 1) {
      const finalTimer = setTimeout(onDone, STEP_MS);
      return () => clearTimeout(finalTimer);
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [index, onDone]);

  const progress = ((index + 1) / MESSAGES.length) * 100;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 h-1.5 w-48 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <m.div
          className="h-full rounded-full bg-gradient-to-r from-[color:var(--electric)] to-[color:var(--electric-bright)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <AnimatePresence mode="wait">
        <m.p
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="font-display text-lg font-medium text-foreground sm:text-xl"
        >
          {MESSAGES[index]}
        </m.p>
      </AnimatePresence>
    </div>
  );
}
