# 📘 Chrome Extension – AI Translation Assistant (Universal)

## 📌 Objetivo do Projeto

Desenvolver uma **extensão do Google Chrome (Manifest V3)**, genérica e flexível, capaz de **traduzir conteúdos de formulários em qualquer site**, com foco especial em **CMSs modernos (React, Rich Text, etc.)**.

O caso de uso principal é:
- Usuário preenche campos em um idioma (ex: **Português**)
- A extensão detecta, pareia e traduz para outro idioma (ex: **Inglês**)
- A tradução é feita via **IA**, com **providers pluggable**
- O preenchimento dos campos de destino é feito automaticamente quando possível

O projeto **não é um boilerplate público**, mas um **produto técnico reutilizável**, seguindo **padrões reais de extensões Chrome profissionais**.

---

## 🧠 Princípios Fundamentais (Obrigatórios)

1. **Manifest V3**
2. **Separação absoluta de responsabilidades**
3. **IA nunca decide estrutura de DOM**
4. **Heurística local > IA**
5. **Fallbacks sempre disponíveis**
6. **Funcionar em qualquer site**
7. **Segurança de chaves e dados**
8. **UX clara e não invasiva**

---

## 🧱 Arquitetura Padrão (Obrigatória)

```
┌──────────────────────────┐
│ Popup / Options UI       │  (React / Vite)
└─────────────┬────────────┘
              │ messages
┌─────────────▼────────────┐
│ Service Worker (MV3)     │  ← IA, providers, storage, batching
└─────────────┬────────────┘
              │ messages
┌─────────────▼────────────┐
│ Content Script           │  ← DOM, inputs, rich text, overlay
└──────────────────────────┘
```

### Regras
- ❌ Content Script **NÃO** faz chamadas HTTP externas
- ❌ Service Worker **NÃO** acessa DOM
- ❌ UI **NÃO** acessa diretamente a página
- ✅ Comunicação apenas via `chrome.runtime.sendMessage`

---

## 📁 Estrutura de Pastas Recomendada

```
src/
  core/
    engine.ts              # lógica pura (pareamento, payload, parsing)
    heuristics.ts          # regras de detecção e pareamento
    language.ts            # detecção de idioma
    types.ts               # tipos compartilhados

  providers/
    provider.interface.ts  # contrato de IA
    google.provider.ts     # provider default (Google)
    custom.provider.ts     # provider configurável

  content/
    detect-fields.ts       # detectar inputs, labels, rich text
    overlay-ui.ts          # bordas, badges, seleção
    pairing.ts             # pareamento PT ↔ EN
    apply-values.ts        # escrita segura nos campos
    fallback.ts            # clipboard, preview, undo

  background/
    index.ts               # service worker
    translate.ts           # batching + provider selection
    storage.ts             # chrome.storage abstraction

  ui/
    popup/
    options/

manifest.json
```

---

## 📜 Manifest.json (Regras)

- Deve usar **Manifest Version 3**
- Deve declarar explicitamente:
  - `service_worker`
  - `content_scripts`
  - `permissions`
  - `host_permissions`

### Permissões mínimas esperadas
```json
[
  "storage",
  "activeTab",
  "scripting"
]
```

### Host permissions
```json
["<all_urls>"]
```

---

## 🎯 Responsabilidades por Camada

### 🟣 Content Script

Responsável por:

- Detectar campos traduzíveis:
  - `input[type=text]`
  - `textarea`
  - `contenteditable`
  - Rich Text wrappers conhecidos (quando possível)
- Extrair metadados:
  - label
  - placeholder
  - name / id
  - tipo do campo
  - posição no DOM
- Injetar UI visual:
  - **borda roxa discreta**
  - badges de idioma (PT, EN, etc.)
- Permitir:
  - seleção de campos
  - pareamento automático
  - pareamento manual (linkar campos)
- Aplicar traduções nos campos
- Disparar eventos corretamente (`input`, `change`)
- Fallback para:
  - copiar tradução para clipboard
  - preview antes de aplicar

📌 **Importante:**  
O Content Script **não conhece IA**, apenas envia dados estruturados.

---

### 🟡 Service Worker (Background)

Responsável por:

- Receber jobs de tradução
- Escolher provider de IA
- Executar chamadas HTTP
- Fazer batching por:
  - número de campos
  - tamanho total de texto
- Validar JSON de resposta
- Retornar resultado estruturado
- Persistir configurações no `chrome.storage`

📌 **API keys nunca devem existir no content script.**

---

### 🔵 UI (Popup / Options)

Popup:
- Ativar/desativar modo de tradução
- Iniciar detecção
- Traduzir campos selecionados

Options Page:
- Configurar provider de IA
- Definir idioma default
- Definir tom de tradução
- Glossário (termos que não devem ser traduzidos)
- Provider custom (endpoint + headers)

---

## 🧠 Heurística de Pareamento de Campos

A extensão deve **sempre parear localmente**, usando score.

### Critérios (com peso):

1. Label normalizado (removendo idioma)
2. name / id (`_pt`, `_en`, etc.)
3. Placeholder
4. Proximidade visual
5. Contexto (tabs PT/EN, títulos próximos)

### Idiomas detectáveis:
- pt, pt-br, português
- en, en-us, english
- (estrutura preparada para N idiomas)

### Fallback:
- Se score < threshold → solicitar pareamento manual

---

## 🔗 Pareamento Manual (Obrigatório)

O usuário deve poder:
1. Clicar no campo origem
2. Clicar no campo destino
3. Criar um par explícito

Esse mapeamento deve ser:
- salvo por domínio
- reutilizado automaticamente no futuro

---

## 🤖 IA – Provider Pluggable

### Interface padrão

```ts
interface AiProvider {
  name: string;
  translate(job: TranslateJob): Promise<TranslateResult>;
}
```

### Provider Default
- **Google (Gemini / equivalente)**

### Provider Custom
- Endpoint configurável
- Headers customizáveis (JSON)
- Timeout configurável

---

## 📦 Payload enviado à IA (Contrato Fixo)

A IA **não recebe DOM**.

```json
{
  "job": {
    "sourceLang": "pt-BR",
    "targetLang": "en-US",
    "tone": "marketing profissional",
    "glossary": ["CCXP", "Omelete"]
  },
  "pairs": [
    {
      "pairId": "p1",
      "source": {
        "fieldId": "f_pt_title",
        "value": "Nome do evento"
      },
      "target": {
        "fieldId": "f_en_title"
      },
      "hints": {
        "label": "Nome",
        "maxLength": 120
      }
    }
  ]
}
```

---

## 📤 Resposta esperada da IA

A IA **DEVE** retornar apenas JSON válido:

```json
{
  "results": [
    {
      "pairId": "p1",
      "translated": "Event name"
    }
  ]
}
```

Sem comentários, sem explicações.

---

## ✍️ Regras de Tradução (Prompt Base)

A IA deve:
- Preservar:
  - nomes próprios
  - marcas
  - siglas
  - URLs
  - textos entre `{{ }}` ou `[ ]`
- Manter quebras de linha
- Preservar HTML (traduzir apenas texto)
- Não inventar conteúdo
- Se já estiver no idioma alvo, retornar igual

---

## 📝 Escrita nos Campos (Regras)

- Inputs controlados (React):
  - usar setter nativo
  - disparar `input` com `bubbles: true`
- Rich text:
  - tentar `contenteditable`
  - se falhar → fallback clipboard
- Sempre manter:
  - histórico anterior (undo)

---

## 🧯 Fallbacks Obrigatórios

- Não conseguiu escrever → botão “Copiar tradução”
- Erro de IA → retry / batch menor
- Heurística falhou → pareamento manual
- Rich text bloqueado → preview

---

## 🔐 Segurança e Privacidade

- API keys:
  - armazenadas apenas no `chrome.storage`
- Dados enviados:
  - apenas campos selecionados
- Nenhum dado persistente sem consentimento
- Nenhuma execução remota de código

---

## 🧪 Qualidade e Manutenibilidade

- Core independente do Chrome API
- Tipos compartilhados
- Mensagens tipadas
- Sem strings mágicas
- Código preparado para N idiomas

---

## ✅ Critério de Sucesso

A extensão é considerada correta se:

- Funciona em **qualquer site**
- Traduz **inputs simples e rich text**
- Não depende da IA para lógica estrutural
- Tem fallback para todos os casos críticos
- Segue padrões reais do Chrome Extensions MV3

---

## 🚫 O que NÃO fazer

- ❌ IA decidir DOM ou campos
- ❌ API key no content script
- ❌ React diretamente no DOM da página
- ❌ Seletores frágeis sem fallback
- ❌ Lógica pesada fora do service worker

---

**Este documento deve ser usado como prompt integral para a IA desenvolvedora.**
**Todas as decisões arquiteturais aqui são obrigatórias.**

