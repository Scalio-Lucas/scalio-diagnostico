import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function HowWeCalculate() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="how" className="border-[color:var(--color-border)]">
        <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground hover:no-underline">
          Como calculamos isso?
        </AccordionTrigger>
        <AccordionContent className="text-xs leading-relaxed text-muted-foreground">
          Esta é uma simulação matemática baseada nas informações fornecidas por você. Mantemos o
          volume atual de leads, ticket médio e conversão de visitas em vendas e simulamos o impacto
          de uma alteração na taxa de leads que chegam à visita.
          <br />
          <br />
          Os valores apresentados representam cenários potenciais, não garantia de resultados. O
          desempenho real pode variar de acordo com qualidade dos leads, imóveis, região,
          atendimento, equipe comercial, preço, financiamento, follow-up e outros fatores.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
