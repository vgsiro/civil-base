# Structural AI — Build Plan

A prescriptive spec for an AI coding agent (e.g. Claude Code) to implement a
structural-engineering assistant inside the existing CivilAxis app.

> **Governing principle — read first, applies to every phase.**
> The way this app gets smarter is **not** by retraining the model's weights —
> it's by improving the stuff *around* the frozen model.
> **"By documents"** means feeding the knowledge base. **"By time"** means a
> feedback loop that accumulates corrections and examples.
> Intelligence lives in three layers only: **retrieval, data, and verified math.**
> The Gemini model is a frozen reasoning engine. Never fine-tune it for knowledge.

---

## 0. Context & constraints

**Existing stack (do not replace):**
- Next.js app. RAG chat at `app/api/chat/route.js` (Gemini + Supabase, pgvector).
- Chat UI at `app/components/ChatPanel.tsx`. Renders LaTeX via `rehype-katex`.
- Formula viewer at `app/components/FormulaPanel.tsx`, backed by a `formulas` table.
- Tables in DB: `pdf_chunks` (vector search), `formulas`, mind maps.

**Hard rules for the agent:**
1. Do not train, fine-tune, or swap the model. Use the existing Gemini calls.
2. The LLM never produces final numeric results. It produces *symbolic* steps;
   numbers are computed deterministically in JS. See Phase 3.
3. Every structural answer must cite a clause (e.g. `EN 1993-1-1 §6.2.5`), not
   just a page number.
4. Every chunk and example must carry a code edition/year tag. Standards change;
   versioning is mandatory.
5. All new behaviour is gated behind `scope: 'structural'` so the general chat is
   untouched.

---

## 1. Architecture

```
User (Structural AI card)
  -> [optional parametric form]
  -> embed query
  -> scoped retrieval (structural docs only) + few-shot retrieval (golden examples)
  -> assemble prompt (system prompt + clauses + examples + inputs)
  -> Gemini call (reasoning + symbolic formulas in LaTeX)
  -> deterministic calc layer (JS computes numbers, decides PASS/FAIL)
  -> render (KaTeX + formula links)
  -> log response + capture feedback  ───┐
                                          │  "by time"
  Knowledge base (ingest documents) ──────┤  "by documents"
                                          ▼
                              both improve future answers
                              (model weights unchanged)
```

---

## PHASE 1 — Structural system prompt
**Effort: ~1h. No new infra.**

In `app/api/chat/route.js`, branch on `scope === 'structural'` and inject this
system prompt. Keep the general prompt for all other scopes.

```js
const STRUCTURAL_SYSTEM_PROMPT = `You are a structural engineering assistant specializing in
Eurocode (EN 1990–EN 1999) and Vietnamese standards (TCVN).

RULES — follow every time:
1. CITE THE CLAUSE. Reference the exact clause or table (e.g. "EN 1993-1-1 §6.2.5",
   "TCVN 5575:2012 Table 7"). Never cite only a page number. If you cannot find a
   clause in the provided context, say so — do not invent one.
2. RESPECT THE EDITION. Only use clauses from the code edition present in the
   retrieved context. If the user pins a version, never mix in another edition.
3. SYMBOLIC, NOT NUMERIC. When a calculation is needed, do NOT compute the final
   number yourself. Output the formula and the substituted symbols, then return a
   machine-readable calc block (see format below). The system computes the result.
4. SHOW WORK IN LATEX. State the formula in LaTeX, then the substitution with
   values. Default units: kN, kNm, mm, MPa unless the user specifies otherwise.
5. VERDICT COMES FROM MATH, NOT YOU. Do not assert PASS/FAIL. Emit the utilisation
   ratio for the system to evaluate.
6. SAFETY. End every calculation answer with: "AI assistance — verify against the
   governing code before use in design."

CALC BLOCK FORMAT — when a numeric check is requested, append a fenced json block:
\`\`\`calc
{
  "clause": "EN 1993-1-1 §6.2.5",
  "quantity": "M_c,Rd",
  "formula_latex": "M_{c,Rd} = \\\\frac{W_{pl} f_y}{\\\\gamma_{M0}}",
  "variables": { "W_pl": {"value": 628000, "unit": "mm^3"},
                 "f_y":  {"value": 275, "unit": "MPa"},
                 "gamma_M0": {"value": 1.0, "unit": "-"} },
  "expression": "(W_pl * f_y) / gamma_M0",
  "result_unit": "Nmm",
  "compare": { "demand_expression": "M_Ed", "demand_value": 90e6, "demand_unit": "Nmm" }
}
\`\`\`
Provide ONE calc block per check. Use SI base units inside the block.`;
```

**Acceptance criteria**
- `scope:'structural'` requests use the new prompt; other scopes unchanged.
- Answers contain clause references, LaTeX, and (for checks) a ` ```calc ` block.

---

## PHASE 2 — Scoped retrieval + metadata schema
**Effort: ~2–3h.**

### 2a. Extend `pdf_chunks` with structural metadata

```sql
-- migration: 0001_structural_metadata.sql
ALTER TABLE pdf_chunks
  ADD COLUMN IF NOT EXISTS category    text,        -- e.g. 'structural'
  ADD COLUMN IF NOT EXISTS code_family text,        -- 'eurocode' | 'tcvn'
  ADD COLUMN IF NOT EXISTS code_ref    text,        -- 'EN 1993-1-1'
  ADD COLUMN IF NOT EXISTS edition     text,        -- '2005+A1:2014'
  ADD COLUMN IF NOT EXISTS clause_ref  text,        -- '§6.2.5'
  ADD COLUMN IF NOT EXISTS table_ref   text,        -- 'Table 5.2'
  ADD COLUMN IF NOT EXISTS topic       text;        -- 'bending' | 'shear' | ...

CREATE INDEX IF NOT EXISTS idx_pdf_chunks_category ON pdf_chunks (category);
CREATE INDEX IF NOT EXISTS idx_pdf_chunks_code    ON pdf_chunks (code_ref, edition);
```

### 2b. Scoped + hybrid retrieval RPC

Add a Postgres function that filters to structural docs and combines vector
similarity with keyword match (keyword nails exact clause refs, vector catches
concepts).

```sql
-- migration: 0002_match_structural.sql
CREATE OR REPLACE FUNCTION match_structural_chunks(
  query_embedding vector(768),
  query_text      text,
  match_count     int default 8,
  filter_edition  text default null
)
RETURNS TABLE (id bigint, content text, code_ref text, clause_ref text,
               edition text, score float)
LANGUAGE sql STABLE AS $$
  SELECT c.id, c.content, c.code_ref, c.clause_ref, c.edition,
         (0.7 * (1 - (c.embedding <=> query_embedding))     -- vector similarity
        + 0.3 * ts_rank(to_tsvector('simple', c.content),
                        plainto_tsquery('simple', query_text))) AS score
  FROM pdf_chunks c
  WHERE c.category = 'structural'
    AND (filter_edition IS NULL OR c.edition = filter_edition)
  ORDER BY score DESC
  LIMIT match_count;
$$;
```

### 2c. Wire into the API
In `app/api/chat/route.js`, when `scope === 'structural'`, call
`match_structural_chunks` instead of the general search. Pass an optional
`edition` from the request to pin a version.

**Acceptance criteria**
- Structural queries retrieve only `category='structural'` chunks.
- Passing `edition` restricts results to that edition.
- A query mentioning a clause number returns that clause in the top results.

---

## PHASE 3 — Deterministic calculation layer
**Effort: ~3–4h. This is the safety-critical phase.**

The LLM emits a ` ```calc ` block (Phase 1). The server parses it, computes the
number with a real math evaluator, and decides PASS/FAIL. The model never decides.

### 3a. Calc engine (server util)

```js
// app/lib/calc.js
import { evaluate } from 'mathjs';

export function runCalc(block) {
  const scope = {};
  for (const [k, v] of Object.entries(block.variables)) scope[k] = v.value;
  const result = evaluate(block.expression, scope);   // deterministic, not the LLM
  let utilisation = null, verdict = null;
  if (block.compare) {
    const demand = block.compare.demand_value;
    utilisation = demand / result;                     // demand / resistance
    verdict = utilisation <= 1.0 ? 'PASS' : 'FAIL';
  }
  return { result, result_unit: block.result_unit, utilisation, verdict };
}
```

### 3b. Pipeline in `app/api/chat/route.js`
1. Get Gemini response text.
2. Extract the ` ```calc ` block(s) with a parser (JSON.parse the fenced body).
3. For each block call `runCalc`.
4. Append a verified results section to the response payload:
   `{ clause, result, utilisation, verdict }`.
5. Return both the prose (LaTeX) and the verified numeric results.

### 3c. Render in `app/components/ChatPanel.tsx`
- Render LaTeX as today (rehype-katex).
- Render the verified result + PASS/FAIL **from the server-computed value**, not
  from any number in the prose.
- Show the safety disclaimer.

> Optional upgrade: instead of parsing a block, expose `runCalc` as a Gemini
> **function/tool** so the model calls it. Same guarantee (numbers from JS), more
> robust. Add only after the block approach works.

**Acceptance criteria**
- Given a beam-check query, PASS/FAIL comes from `runCalc`, not the model text.
- Manually editing the model's stated number does not change the verdict.
- Utilisation ratio is displayed.

---

## PHASE 4 — Parametric input (optional but valuable)
**Effort: ~3–4h.**

In `app/components/ChatPanel.tsx`, add a collapsible "Structural inputs" panel.
On submit, prepend a structured context block to the user message:

```
[Beam check] span=6m; load=20kN/m UDL; section=IPE300; steel=S275; code=EN 1993-1-1
Question: <free text>
```

This is more reliable than parsing free text and feeds clean values into the
calc block.

**Acceptance criteria**
- Form values appear as a structured prefix in the outgoing message.
- The calc block variables match the form inputs.

---

## PHASE 5 — The learning system (storage + feedback loop)
**Effort: ~1–2 days. This is "by time" and "by documents" made concrete.**

> Restating the principle for this phase: the app does not learn by updating
> weights. It learns by **storing responses and corrections** and folding the good
> ones back into retrieval and prompts. A human approves what becomes "knowledge"
> — a silently-learned wrong answer is dangerous in structural work.

### 5a. Log every response (the raw record)

```sql
-- migration: 0003_response_log.sql
CREATE TABLE structural_responses (
  id            bigserial PRIMARY KEY,
  question      text NOT NULL,
  scope         text DEFAULT 'structural',
  edition       text,
  retrieved_ids bigint[],            -- which pdf_chunks were used
  ai_answer     text NOT NULL,       -- full model output
  calc_json     jsonb,              -- the calc block(s)
  verified      jsonb,              -- server-computed result + verdict
  created_at    timestamptz DEFAULT now()
);
```
Write one row per structural answer from the API. This is the audit trail and the
raw material for everything below.

### 5b. Capture feedback (the correction store)

```sql
-- migration: 0004_corrections.sql
CREATE TABLE structural_corrections (
  id              bigserial PRIMARY KEY,
  response_id     bigint REFERENCES structural_responses(id),
  rating          int,                 -- -1 / 0 / +1 (thumbs)
  corrected_answer text,              -- expert's corrected version (nullable)
  note            text,
  reviewer        text,
  status          text DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  embedding       vector(768),         -- of the question, for retrieval
  created_at      timestamptz DEFAULT now()
);
```
- In `ChatPanel.tsx`, add thumbs up/down + an optional "suggest correction" field.
- POST to a new route `app/api/feedback/route.js` that inserts the row and
  embeds the question.

### 5c. Promote good answers to golden examples (few-shot memory)

```sql
-- migration: 0005_golden_examples.sql
CREATE TABLE golden_examples (
  id          bigserial PRIMARY KEY,
  question    text NOT NULL,
  answer      text NOT NULL,          -- the vetted, correct answer
  scope       text DEFAULT 'structural',
  edition     text,
  source_correction_id bigint,
  embedding   vector(768),
  active      boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
```
A reviewer approves a correction (`status='approved'`) → a small admin action
copies it into `golden_examples` with an embedding of the question.

**Few-shot injection (this is how "by time" reaches the model):**
In `app/api/chat/route.js`, before the Gemini call, retrieve the top 2–3
`golden_examples` most similar to the query and insert them into the prompt as
worked examples:

```js
// pseudo
const examples = await matchGoldenExamples(queryEmbedding, 3);
const fewShot = examples.map(e =>
  `Example question: ${e.question}\nIdeal answer: ${e.answer}`).join('\n\n');
// prompt = STRUCTURAL_SYSTEM_PROMPT + fewShot + retrievedClauses + userMessage
```
The model imitates known-good answers without any weight change.

### 5d. Evaluation set (so you know changes actually help)

```sql
-- migration: 0006_eval.sql
CREATE TABLE eval_cases (
  id        bigserial PRIMARY KEY,
  question  text NOT NULL,
  expected  jsonb,         -- expected clause(s), expected verdict, key numbers
  scope     text DEFAULT 'structural'
);
```
- Seed `eval_cases` from approved corrections.
- Add a script `scripts/run_eval.js` that runs each case through the pipeline and
  scores: clause-cited-correctly? verdict matches? utilisation within tolerance?
- Run it before/after any prompt or retrieval change. This replaces guesswork.

### 5e. Ingestion pipeline (the "by documents" path)

Add `scripts/ingest.js` to load a new standard:
1. Extract text per page/section from the PDF.
2. Chunk by semantic unit — a whole clause or table, not fixed character counts.
3. For each chunk, set metadata: `category='structural'`, `code_family`,
   `code_ref`, `edition`, `clause_ref`, `table_ref`, `topic`.
4. Embed and insert into `pdf_chunks`.

Re-running with a new edition adds rows tagged with the new edition; old editions
stay queryable. **This is why RAG beats fine-tuning here: updating knowledge is a
document insert, not a retraining run.**

**Acceptance criteria for Phase 5**
- Every structural answer creates a `structural_responses` row.
- Thumbs/corrections write to `structural_corrections`.
- Approving a correction adds a `golden_examples` row, and similar future queries
  receive it as a few-shot example.
- `run_eval.js` produces a score; a prompt change can be compared before/after.
- Ingesting a new code edition adds version-tagged chunks without touching old ones.

---

## Build order (priority)

1. **Phase 1** — system prompt. Immediate value, ~1h.
2. **Phase 2** — scoped + hybrid retrieval. The core accuracy lever.
3. **Phase 3** — deterministic calc. Turns it from chatbot into a tool you can trust.
4. **Phase 5a + 5b** — logging + feedback capture. Start collecting data early.
5. **Phase 4** — parametric form. Polish.
6. **Phase 5c–5e** — golden examples, evals, ingestion script. The full learning loop.

Do NOT attempt fine-tuning at any phase. If output *style* ever needs tightening
once the app is mature, that is the only valid fine-tuning use — and it is optional.

---

## What "smarter over time" means in one line

More + better-tagged documents (`by documents`) and an approved-corrections loop
fed back as few-shot examples and prompt updates (`by time`) — all around a frozen
model, with every number checked by deterministic math.
