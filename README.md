# Correios Wizard

Extensão para Chrome, Edge e Firefox com automações operacionais para as telas internas dos Correios.

## Instalação

- Chrome Web Store: https://chromewebstore.google.com/detail/correios-wizard/oogeamkmbaejmkigijcpbfcbkfeolkca
- Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/correios-wizard/andcjlemogipmhmhedliljjcoogbcfcj

## Download Direto

Builds prontos na última release:

| Arquivo                                                                                                                               | Navegador       |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| [correios-wizard-chrome.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-chrome.zip)   | Google Chrome   |
| [correios-wizard-edge.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-edge.zip)       | Microsoft Edge  |
| [correios-wizard-firefox.zip](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-firefox.zip) | Mozilla Firefox |

## Funções Da Extensão

### Lançamento Automático

- Painel flutuante com dados do objeto em tempo real (status, distrito, previsão, dados operacionais e endereço).
- Posição do painel salva automaticamente entre sessões.
- Tabela de apoio operacional com detalhes para triagem e conferência.
- Atalho de comando por teclado com `#CT-INDUZIROBJETO#` para indução rápida.
- Auto-fechamento de pop-ups de impressão/alerta (com botão de liga/desliga no painel).
- Manutenção de foco no campo de objeto quando há erro de validação.
- Atualização automática da interface ao interceptar respostas da própria página (`fetch`/`XMLHttpRequest`).

### LOEC Suspensa

- Dashboard com indicadores táticos: total, vencidos, vencem hoje, a vencer, ARs e pontos.
- Top 10 distritos por volume para priorização rápida.
- Botões de ação imediata: `Vencem Hoje`, `Vencidos`, `A Vencer`.
- Filtros por distrito, grade, lado, situação SRO e texto ignorado.
- Consulta em lote do SRO Intranet com cache local e atualização paralela.
- Exportação em texto, cópia para área de transferência e geração de arquivo `.txt`.
- Impressão formatada em A4 com agrupamento por distrito.
- Modal analítico por distrito com visão detalhada de objetos e categorias de motivo.

## Permissões E Hosts (Com Motivo)

### Permissões da extensão (`permissions`)

A extensão **não solicita permissões de API** no campo `permissions` do manifest (lista vazia).

### Hosts solicitados (`host_permissions`)

| Host                                    | Por que é pedido                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `https://sroweb.correios.com.br/*`      | Página base onde a automação roda e de onde saem dados de LOEC/Lançamento Automático. |
| `https://srointranet.correios.com.br/*` | Consulta de rastreamento e situação SRO usada nos painéis/filtros.                    |
| `https://sromonitor.correios.com.br/*`  | Consulta de dados analíticos usados no modal de relatório operacional.                |

### Onde o script roda (`content_scripts.matches`)

- `https://sroweb.correios.com.br/app/entregaexternaautomatica/lancamentoautomatico/*`
- `https://sroweb.correios.com.br/app/entregaexternaautomatica/loecsuspensa/*`

### Recurso exposto para injeção (`web_accessible_resources`)

- `injected.js` é exposto para `https://*.correios.com.br/*`.
- Motivo: permitir injeção do runtime principal no contexto da página para integração com os eventos/fluxos internos do sistema.

## Scripts (PNPM)

### Desenvolvimento

- `pnpm dev`: inicia o modo de desenvolvimento no Chrome.
- `pnpm dev:chrome`: desenvolvimento focado no Chrome.
- `pnpm dev:edge`: desenvolvimento focado no Edge.
- `pnpm dev:firefox`: desenvolvimento focado no Firefox.

### Build

- `pnpm build`: gera build para **todos** os navegadores suportados (Chrome, Edge e Firefox).
- `pnpm build:chrome`: gera build só para Chrome.
- `pnpm build:edge`: gera build só para Edge.
- `pnpm build:firefox`: gera build só para Firefox.

### ZIP

- `pnpm zip`: gera zip para **todos** os navegadores suportados.
- `pnpm zip:chrome`: gera zip só para Chrome.
- `pnpm zip:edge`: gera zip só para Edge.
- `pnpm zip:firefox`: gera zip só para Firefox.

## O Que Faz Cada Comando Especial

- `dev`: sobe o ambiente de desenvolvimento com rebuild/hot reload para testar a extensão localmente.
- `postinstall`: roda `wxt prepare` após instalar dependências, preparando arquivos e tipos internos do WXT para evitar erro de ambiente incompleto.

## Deploy

O workflow de deploy:

- valida formato/lint;
- limpa `.output` antes de empacotar;
- gera ZIP para Chrome, Edge e Firefox;
- valida se todos os artefatos foram criados;
- publica release com versionamento automático.

## Licença

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso não-comercial permitido.
