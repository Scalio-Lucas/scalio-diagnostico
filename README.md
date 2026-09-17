# Scalio · Diagnóstico de Eficiência Comercial

Diagnóstico interativo para donos de imobiliárias: em 6 perguntas com sliders,
calcula o VGV potencial deixado na mesa por ineficiência no funil
Investimento → Leads → Visitas → Vendas → VGV → Comissão, e convida para uma
aula ao vivo sobre como melhorar a taxa Lead → Visita.

Extraído do monorepo da landing page da Scalio para ser deployado
independentemente.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS 4
- Radix UI (slider, progress, accordion) + Framer Motion

## Rodando localmente

```bash
npm install
npm run dev
```

## Build de produção

```bash
npm run build
```

## Configuração

Edite `src/diagnostic/config.ts` para ajustar:

- `WHATSAPP_GROUP_URL` — link do grupo de WhatsApp da aula
- `LIVE_CLASS_DATE` / `LIVE_CLASS_TIME` — data/horário da próxima aula (deixe
  vazio para ocultar essa linha no CTA)
- `SCENARIOS` — os três cenários de simulação (conservador/potencial/alta
  eficiência) usados como parâmetros internos, não benchmarks de mercado

## Arquitetura

Todo o motor de cálculo vive em `src/diagnostic/engine/` como funções puras,
sem estado: validação → métricas → cenários → diagnóstico dinâmico →
formatação. O estado do fluxo (respostas do usuário, fase, taxa do simulador)
fica em `src/diagnostic/state/` via Context + reducer.
