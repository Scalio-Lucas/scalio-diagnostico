import { m } from "framer-motion";
import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { TOTAL_QUESTIONS } from "../config";

interface StepShellProps {
  step: number; // 0-indexed
  question: string;
  helper?: string;
  onBack?: () => void;
  onContinue: () => void;
  continueDisabled?: boolean;
  continueLabel?: string;
  children: ReactNode;
}

export function StepShell({
  step,
  question,
  helper,
  onBack,
  onContinue,
  continueDisabled,
  continueLabel = "Continuar",
  children,
}: StepShellProps) {
  const current = step + 1;

  return (
    <div className="flex min-h-[100dvh] flex-col px-5 pb-6 pt-6 sm:px-8">
      <header className="mx-auto w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            {current} de {TOTAL_QUESTIONS}
          </span>
        </div>
        <Progress value={(current / TOTAL_QUESTIONS) * 100} className="h-1.5" />
      </header>

      <m.main
        key={step}
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10"
      >
        <h1 className="font-display text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
          {question}
        </h1>
        {helper ? <p className="mt-2 text-sm text-muted-foreground">{helper}</p> : null}

        <div className="mt-10">{children}</div>
      </m.main>

      <footer className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled}
          className="glow-electric flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--electric)] to-[color:var(--electric-bright)] px-6 py-4 text-base font-semibold text-white transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {continueLabel} <span aria-hidden>→</span>
        </button>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mx-auto mt-4 block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Voltar
          </button>
        ) : (
          <div className="h-[2.125rem]" />
        )}
      </footer>
    </div>
  );
}
