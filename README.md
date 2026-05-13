# Correios Wizard

Automação operacional para as telas internas dos Correios no Chrome, Edge e Firefox.

## Em 1 minuto

- Abre painéis inteligentes direto nas telas de Lançamento Automático e LOEC Suspensa.
- Mostra status, endereço e dados operacionais do objeto em tempo real.
- Lista objetos por categoria e exporta tudo em segundos.
- Mantém o fluxo de trabalho simples para quem não é técnico.

## Instalação

- Chrome Web Store: https://chromewebstore.google.com/detail/correios-wizard/oogeamkmbaejmkigijcpbfcbkfeolkca
- Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/correios-wizard/andcjlemogipmhmhedliljjcoogbcfcj

## Download direto (última release)

| Arquivo                                                                                                                               | Navegador       |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| [correios-wizard-chrome.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-chrome.zip)   | Google Chrome   |
| [correios-wizard-edge.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-edge.zip)       | Microsoft Edge  |
| [correios-wizard-firefox.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-firefox.zip) | Mozilla Firefox |

## Uso rápido

### Lançamento Automático

1. Abra a tela de Lançamento Automático.
2. O painel flutuante aparece automaticamente.
3. Use a seta para cima para abrir o rastreamento do objeto.
4. No campo CEP, as setas continuam funcionando normalmente.

### LOEC Suspensa

1. Abra a tela de LOEC Suspensa.
2. O dashboard tático aparece com totais e indicadores.
3. Use os botões `Vencem Hoje`, `Vencidos` e `A Vencer` para listar objetos.
4. Filtre, copie, imprima ou salve o relatório em TXT.

## Atalhos

- `Seta para cima`: abre/fecha o rastreamento rápido do objeto.
- `#CT-INDUZIROBJETO#`: indução rápida do objeto (recomendado usar QR Code ou código de barras).

## Funcionalidades (visão geral)

### Lançamento Automático

- Painel flutuante com status, distrito, previsão, dados operacionais e endereço.
- Posição do painel salva automaticamente entre sessões.
- Tabela de apoio operacional para triagem e conferência.
- Auto-fechamento de alertas e pop-ups de impressão (com botão no painel).
- Foco mantido no campo do objeto quando há erro de validação.
- Atualização automática ao interceptar respostas da própria página.

### LOEC Suspensa

- Dashboard com indicadores táticos: total, vencidos, vencem hoje, a vencer, ARs e pontos.
- Top 10 distritos por volume para priorização rápida.
- Filtros por distrito, grade, lado, situação SRO e texto ignorado.
- Consulta em lote do SRO Intranet com cache local.
- Exportação em texto, cópia para área de transferência e geração de arquivo TXT.
- Impressão A4 com agrupamento por distrito.
- Modal analítico por distrito com visão detalhada.

### Controle de Acesso (blocklist)

- Bloqueio remoto por unidade usando `blocklist.json`.
- Se a unidade estiver bloqueada, a extensão não injeta interface nem altera o sistema.
- Suporta `"block_all": true` para desativação global temporária.

## Detalhamento profundo

### Onde a extensão roda

- `https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/*`
- `https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/*`

### Permissões e segurança

- A extensão não solicita permissões de API no campo `permissions`.
- Hosts usados em `host_permissions`:

| Host                                    | Motivo                                                      |
| --------------------------------------- | ----------------------------------------------------------- |
| `https://sroweb.correios.com.br/*`      | Tela base onde rodam Lançamento Automático e LOEC Suspensa. |
| `https://srointranet.correios.com.br/*` | Rastreamento e situações SRO usados nos painéis e filtros.  |
| `https://sromonitor.correios.com.br/*`  | Dados analíticos utilizados nos relatórios operacionais.    |

### Recurso exposto para injeção

- `injected.js` é exposto para `https://*.correios.com.br/*`.
- Motivo: integrar o runtime principal ao contexto da página.

### Diagnóstico rápido

- Para logs locais, defina `localStorage.cw-debug = "1"` e recarregue a página.
- Para desativar logs, remova a chave ou defina `"0"`.

### Comportamentos importantes

- O rastreamento rápido usa a seta para cima.
- Quando o foco está no campo CEP, as setas não são interceptadas.
- Falhas na consulta de distritos aparecem no progresso da LOEC.

## Desenvolvimento

### Comandos principais

- `pnpm dev:chrome`
- `pnpm dev:edge`
- `pnpm dev:firefox`
- `pnpm build:chrome`
- `pnpm build:edge`
- `pnpm build:firefox`
- `pnpm zip:chrome`
- `pnpm zip:edge`
- `pnpm zip:firefox`

### Fluxo do deploy

- valida formatação e lint
- limpa `.output`
- gera ZIP para Chrome, Edge e Firefox
- publica release com versionamento automático

## Licença

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso não-comercial permitido.
