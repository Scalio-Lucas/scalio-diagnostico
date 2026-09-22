import * as SliderPrimitive from "@radix-ui/react-slider";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface DiagnosticSliderProps {
  /** Posição interna do trilho (já convertida se a escala for não-linear). */
  position: number;
  min: number;
  max: number;
  step: number;
  onPositionChange: (position: number) => void;
  disabled?: boolean;
}

/**
 * Slider premium, dedicado ao diagnóstico: thumb grande, área de toque
 * confortável, preenchimento animado e resposta instantânea. Recebe sempre
 * uma posição numérica pronta pro trilho — a conversão pra valor real (linear
 * ou por escala não-linear) acontece em QuestionSlider, não aqui.
 */
export function DiagnosticSlider({
  position,
  min,
  max,
  step,
  onPositionChange,
  disabled,
}: DiagnosticSliderProps) {
  return (
    <SliderPrimitive.Root
      className="relative flex h-11 w-full touch-none select-none items-center"
      value={[position]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={([v]) => onPositionChange(v)}
    >
      <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-[color:var(--color-surface-2)] ring-1 ring-inset ring-[color:var(--color-border)]">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-[color:var(--electric)] to-[color:var(--electric-bright)]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className={cn(
          "block h-8 w-8 rounded-full border-2 border-[color:var(--electric-bright)] bg-white",
          "shadow-[0_0_0_6px_oklch(0.62_0.24_264_/_0.18),0_4px_16px_oklch(0_0_0_/_0.4)]",
          "transition-transform duration-150 ease-out will-change-transform",
          "hover:scale-110 active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
        aria-label="Ajustar valor"
      />
    </SliderPrimitive.Root>
  );
}

interface EditableValueProps {
  displayValue: string;
  rawValue: number;
  onCommit: (raw: string) => void;
  inputMode?: "numeric" | "decimal";
  className?: string;
}

/** Número grande em destaque; tocar nele abre um input pra digitar manualmente. */
export function EditableValue({
  displayValue,
  rawValue,
  onCommit,
  inputMode = "numeric",
  className,
}: EditableValueProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(rawValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(String(rawValue));
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [editing, rawValue]);

  function commit() {
    onCommit(draft);
    setEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      setEditing(false);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        inputMode={inputMode}
        className={cn(
          "w-full bg-transparent text-center outline-none",
          "border-b-2 border-[color:var(--electric-bright)]",
          className,
        )}
      />
    );
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "cursor-text rounded-lg transition-colors hover:bg-white/5 active:bg-white/10",
          className,
        )}
        aria-label="Tocar para digitar um valor exato"
      >
        {displayValue}
      </button>
      <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground/70">
        <svg
          aria-hidden
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
        Toque para digitar
      </p>
    </div>
  );
}
