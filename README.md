# Correios Wizard

Extensão para Chrome, Edge e Firefox que otimiza tarefas operacionais nos Correios.

## Instalação

Disponível na [Chrome Web Store](https://chromewebstore.google.com/detail/correios-wizard/oogeamkmbaejmkigijcpbfcbkfeolkca) e [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/correios-wizard/andcjlemogipmhmhedliljjcoogbcfcj).

## Download Direto

Extensões compiladas disponíveis na [última release](https://github.com/henrique-coder/correios-wizard/releases/latest):

| Arquivo                                                                                                                                 | Navegador       |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| [`correios-wizard-chrome.zip`](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-chrome.zip)   | Google Chrome   |
| [`correios-wizard-edge.zip`](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-edge.zip)       | Microsoft Edge  |
| [`correios-wizard-firefox.zip`](https://github.com/henrique-coder/correios-wizard/releases/latest/download/correios-wizard-firefox.zip) | Mozilla Firefox |

## Funcionalidades

### Lançamento Automático (`/lancamentoautomatico/`)

- **Painel flutuante** — exibe em tempo real o distrito, status, previsão de entrega e dados operacionais do objeto sendo induzido. Arrastável e com posição salva entre sessões.
- **Tabela de dados operacionais** — detalhes completos do objeto: endereço, contato, serviços (AR/MP/DD), lista de indução, carteiro, estação e carimbo.
- **Atalhos de teclado** — comandos rápidos via tecla `#` para induzir (`#CT-INDUZIROBJETO#`) ou excluir (`#CT-EXCLUIROBJETO#`) objetos sem usar o mouse.
- **Auto-dismiss de modais** — fecha automaticamente pop-ups de impressão de etiquetas e alertas de confirmação.

### LOEC Suspensa (`/loecsuspensa/`)

- **Dashboard tático** — HUD com métricas em tempo real: carga total suspensa, backlog de vencidos, urgência operacional, complexidade (ARs), densidade do cluster, pontos físicos e status tático (Controlado/Atenção/Crítico).

## Estrutura

```
├── extension.config.toml
├── build/
├── scripts/
│   └── build.mjs
└── src/
    ├── background.js
    ├── content.js
    ├── injected.js
    ├── libs/
    └── icons/
```

## Arquitetura e Build (Produção)

- **Google Closure Compiler:** Os scripts JavaScript da extensão são compilados com `SIMPLE_OPTIMIZATIONS`, gerando artefatos menores e mantendo compatibilidade com APIs de runtime de extensões.
- **Injeção Híbrida Inteligente:** A biblioteca do _browser-polyfill_ é embutida localmente visando estrita integridade na bridge `browser.*`, enquanto dependências analíticas secundárias como _Chart.js_ são demandadas por requisição do `unpkg` dinamicamente preservando o tamanho original da extensão.
- **Isolamento de Estado:** Os scripts utilitários atuam sob invólucro de expressões auto-invocáveis (IIFE) estritas para neutralizar quaisquer vazamentos de variáveis globais que possam colidir com a arquitetura subjacente do site.
- **Package Manager:** Transicionado inteiramente ao `pnpm`. Utiliza `7zip` nativo via temporário de S.O para criar release artifacts (zip archives) em compressão máxima (nível 9).
- **Resiliência de runtime:** O status remoto de habilitação da extensão é consultado de forma assíncrona com timeout e cache curto em sessão para reduzir bloqueios e latência no carregamento da página.

## Licença

[PolyForm Noncommercial License 1.0.0](./LICENSE) — uso não-comercial permitido.
