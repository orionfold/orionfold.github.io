---
title: "Why Relay Packs: not a skill, not an MCP server, not a plugin"
date: 2026-07-09
stage: draft
series: "Relay Packs"
summary: "Skills teach one agent. MCP connects a model to a tool. Plugins extend someone else's app. A Relay Pack is a different category: an installable bundle of composable primitives you own that turns a generic workspace into a domain operating system. The structural argument, fair to every alternative."
tags: ["packs", "mcp", "skills", "plugins", "gpts", "agent-frameworks", "architecture"]
difficulty: intermediate
signature: signature.svg
status: draft
---

<!-- DRAFT ITERATION 1 — pillar memo for the Relay Packs series. External claims are cited in metrics.json; soft dates are hedged per the research uncertainty flags. -->

## 1. The claim

Everyone shipping AI tooling in 2026 is answering the same question — *how do you make a general model do a specific job well?* — and the industry has converged on five answers: **Skills**, **MCP**, **plugins**, **custom GPTs**, and **agent frameworks**. Relay ships a sixth: the **Pack**.

The claim of this memo is narrow and structural, not tribal. A Pack is not a better skill or a smarter plugin. It sits at a **different layer**. Four of the five common answers extend or configure a *single agent or a single host*; the fifth hands you a *toolkit to build one yourself*. A Pack packages what none of them packages together: multiple primitive kinds — agents, workflows, data tables, schedules, document routing — composed into a **running application you own**, installed in one step by someone who is not a programmer.

Where those five are genuinely good, this memo says so. Two of them (MCP, Skills) are not competitors at all; they are things a Pack happily *uses*. The point is not that Packs win a fight. It is that they are playing a different game — the domain-operating-system game — and the others, by design, decline to play it.

## 2. Why this matters for the Relay operator

If you run a business on AI, you do not need a smarter chatbot. You need a system: the leads live somewhere you own, a workflow enriches each one the moment it lands, an agent specialized for your domain drafts the outreach, a schedule keeps the list clean four times a day, and a document routes itself from intake to the right desk. That is five *kinds* of moving part, each with its own state and lifecycle, all cooperating.

No amount of "better instructions for one agent" gives you that. A chatbot that is 20% smarter is still a chatbot — you still have no owned data, no scheduled jobs, no cooperating specialists, no application surface. The gap between "an assistant that helps me" and "a system that runs my function" is not a quality gap you close with a bigger model. It is a **category gap** you close with the right unit of packaging.

The Pack is that unit. And because the parts it bundles are things you already understand — a table is a table, a schedule is a schedule — a Pack is *cheaper to trust* than a plugin or a hosted assistant. You can read what it installed. You can edit a cell. You keep the parts if you leave.

## 3. Where it sits in the arc

Relay is built on exactly four composable primitive kinds — **agent profiles, workflow blueprints, data tables, and schedules** — plus a **view** that turns them into an app surface. (A fifth thing people expect, "document routing," is not a separate primitive: it is a workflow blueprint that fires on a new table row. Worth stating precisely, because precision is the whole brand.)

A Pack is a bundle of those primitives with a manifest. Install it and a generic workspace becomes a domain operating system: a real-estate delivery system, a marketing function, a web-design surface. Thirteen packs ship bundled today, across kinds — persona spines, industry verticals, functional packs, and bundles that flatten several children into one app.

This memo is the pillar of the *Relay Packs* series. The other memos take this argument into one domain each and show it doing real work. Here we make the argument itself, against the five alternatives, one at a time.

## 4. The journey — five alternatives, honestly

Before the one-at-a-time walk, here is the whole stack at a glance. The five alternatives are not competitors on one line; they are different strata. A request flows down through connectivity, agent know-how, and orchestration — and the Pack is the application layer that sits on top of all of them and *uses* the ones below it.

<figure class="fn-diagram" aria-label="The AI extension stack as five strata a request flows down through: the application and operating-system layer (Relay Packs) on top, then orchestration (agent frameworks), then host extension (plugins and GPTs), then agent know-how (Skills), then connectivity (MCP) at the base — Packs consume the layers below rather than competing with them.">
  <svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Five strata stacked from connectivity at the base to the application layer at the top; a particle flows down the left spine touching each layer, showing Packs sit above and consume connectivity, know-how, host extension, and orchestration.">
    <defs>
      <linearGradient id="wp-stack-accent" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0.08"/>
      </linearGradient>
      <linearGradient id="wp-stack-teal" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--svg-accent-teal)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--svg-accent-teal)" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="wp-stack-blue" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--svg-accent-blue)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--svg-accent-blue)" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="wp-stack-green" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--svg-accent-green)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--svg-accent-green)" stop-opacity="0.04"/>
      </linearGradient>
      <linearGradient id="wp-stack-purple" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="var(--svg-accent-purple)" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="var(--svg-accent-purple)" stop-opacity="0.04"/>
      </linearGradient>
      <radialGradient id="wp-stack-glow" cx="0.5" cy="0.5" r="0.6">
        <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.16"/>
        <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="380" cy="50" rx="360" ry="70" fill="url(#wp-stack-glow)"/>
    <g class="fn-diagram__edges">
      <path class="fn-diagram__edge fn-diagram__edge--accent" pathLength="100" d="M 40 50 L 40 250" stroke="var(--color-primary)" stroke-width="1.5" fill="none" stroke-opacity="0.55"/>
    </g>
    <g class="fn-diagram__flow">
      <circle class="fn-diagram__flow" cx="40" cy="50" r="4" fill="var(--color-primary)">
        <animateMotion begin="1.4s" dur="3.6s" repeatCount="indefinite" path="M 0 0 L 0 200"/>
      </circle>
    </g>
    <g class="fn-diagram__nodes">
      <rect x="56" y="33" width="648" height="34" rx="6" fill="url(#wp-stack-accent)" stroke="var(--color-primary)" stroke-width="1.5"/>
      <rect x="56" y="83" width="648" height="34" rx="6" fill="url(#wp-stack-purple)" stroke="var(--svg-accent-purple)" stroke-width="1"/>
      <rect x="56" y="133" width="648" height="34" rx="6" fill="url(#wp-stack-green)" stroke="var(--svg-accent-green)" stroke-width="1"/>
      <rect x="56" y="183" width="648" height="34" rx="6" fill="url(#wp-stack-blue)" stroke="var(--svg-accent-blue)" stroke-width="1"/>
      <rect x="56" y="233" width="648" height="34" rx="6" fill="url(#wp-stack-teal)" stroke="var(--svg-accent-teal)" stroke-width="1"/>
    </g>
    <g class="fn-diagram__labels">
      <text x="74" y="46" font-size="10" fill="var(--color-primary)" font-family="var(--font-mono)" letter-spacing="0.08em">APPLICATION · OS</text>
      <text x="74" y="59" font-size="13" font-weight="600" fill="var(--svg-text-bright)" font-family="var(--font-mono)">Relay Pack</text>
      <text x="688" y="54" text-anchor="end" font-size="12" fill="var(--svg-text-dim)" font-family="var(--font-mono)">owned, multi-primitive app</text>
      <text x="74" y="96" font-size="10" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">ORCHESTRATION</text>
      <text x="74" y="109" font-size="13" fill="var(--svg-text-bright)" font-family="var(--font-mono)">Agent frameworks</text>
      <text x="688" y="104" text-anchor="end" font-size="12" fill="var(--svg-text-muted)" font-family="var(--font-mono)">build &amp; operate it yourself</text>
      <text x="74" y="146" font-size="10" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">HOST EXTENSION</text>
      <text x="74" y="159" font-size="13" fill="var(--svg-text-bright)" font-family="var(--font-mono)">Plugins · GPTs</text>
      <text x="688" y="154" text-anchor="end" font-size="12" fill="var(--svg-text-muted)" font-family="var(--font-mono)">live inside someone's app</text>
      <text x="74" y="196" font-size="10" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">AGENT KNOW-HOW</text>
      <text x="74" y="209" font-size="13" fill="var(--svg-text-bright)" font-family="var(--font-mono)">Skills</text>
      <text x="688" y="204" text-anchor="end" font-size="12" fill="var(--svg-text-muted)" font-family="var(--font-mono)">instructions for one agent</text>
      <text x="74" y="246" font-size="10" fill="var(--svg-text-muted)" font-family="var(--font-mono)" letter-spacing="0.08em">CONNECTIVITY</text>
      <text x="74" y="259" font-size="13" fill="var(--svg-text-bright)" font-family="var(--font-mono)">MCP</text>
      <text x="688" y="254" text-anchor="end" font-size="12" fill="var(--svg-text-muted)" font-family="var(--font-mono)">the port, not the appliance</text>
    </g>
  </svg>
  <figcaption>The extension stack, base to top. Four of the five alternatives each own one stratum; a Pack occupies the application layer and <em>consumes</em> the layers beneath it — which is why MCP and Skills are complements, not rivals.</figcaption>
</figure>

### Skills — instructions for one agent

*What they are.* An Agent Skill, in Anthropic's own words, is an "organized folder of instructions, scripts, and resources that agents can discover and load dynamically." It is loaded by progressive disclosure — a name and description sit in context cheaply; the full body loads only when a task matches. The `SKILL.md` format became an **open standard in late 2025** and is now read by many agents beyond Claude.

*What it is genuinely good at.* Teaching *one agent* a domain procedure, token-efficiently and reusably. It is an excellent way to give an agent know-how. Relay's own dev lifecycle runs on skills.

*Where it stops, relative to a domain OS.* A Skill has no owned data model, no schedules, no cooperating second agent, no application surface. Anthropic likens it to "an onboarding guide for a new team member" — know-how, not a running system. Its resources are read-only reference files (a schema *to read*, not a live table you own).

*The honest complement.* This is not a competitor. The open `SKILL.md` format is a fine way to give a **Pack's individual agents** their domain procedures. A Pack supplies the tables, schedules, and routing a Skill has no concept of; a Skill sharpens the agents inside the Pack. They stack.

### MCP — a port, not an appliance

*What it is.* The Model Context Protocol is an open standard for connecting a model to external systems — the docs call it "a USB-C port for AI applications." It standardizes three things: Tools, Resources, and Prompts, exchanged over JSON-RPC. Its own specification scopes it tightly: it *"focuses solely on the protocol for context exchange — it does not dictate how AI applications use LLMs or manage the provided context."* In late 2025 it was donated to a vendor-neutral foundation.

*What it is genuinely good at.* Killing the N×M integration problem. Build a connector once, and any MCP-speaking host can use it. It is the best answer in the industry to *connectivity*.

*Where it stops.* By explicit design, MCP is the port, not the appliance. It defers orchestration to the host ("host applications handle complex orchestration"). It defines no persistent app data model, no workflow engine, no schedules, no UI. It is one kind of thing — a connectivity protocol.

*The honest complement.* MCP is **complementary, full stop.** A Pack can *consume MCP servers* as its connectivity edge — reach an external system through MCP, then let Relay supply the application layer MCP deliberately leaves undefined. Framing MCP as a rival would be a category error. It is the wire; the Pack is the machine the wire plugs into.

### Plugins — extending someone else's app

*What they are.* A plugin extends a **host** through that host's extension point. You do not own the platform; you plug into it, and your extension lives inside that one host. ChatGPT Plugins launched in 2023 and were **wound down in 2024**, superseded by GPTs with Actions. VS Code and JetBrains plugins extend one editor. Claude Code plugins bundle commands, subagents, MCP servers, and hooks — scoped to that one host.

*What they are genuinely good at.* Deep, native access to a single host's API, UI, and runtime, plus one-click distribution through the host's marketplace. When you want to live *inside* one app, a plugin is the richest way in.

*Where it stops.* State, storage, and execution belong to the host. The plugin gives the user no independently owned data substrate. And the lock is hard: a ChatGPT plugin ran only in ChatGPT — and *stopped running entirely* when the beta was sunset. The host can revoke the surface unilaterally.

*The honest position.* Right tool when you want reach and depth inside a vendor's app and do not need to own your data or outlive the host's roadmap. Wrong tool for a system you must still be running in three years regardless of one vendor's decisions.

### Custom GPTs — one assistant, hosted, locked

*What they are.* A Custom GPT is a no-code configuration of ChatGPT itself: instructions plus uploaded knowledge plus Actions, published to a store, running inside ChatGPT. The API-side equivalent, the Assistants API, is being **deprecated — developers were notified in 2025 and it shuts down in 2026**, forcing a migration to a newer API.

*What they are genuinely good at.* Fast, no-code assistant creation with built-in distribution to a large audience and solid retrieval over uploaded docs.

*Where it stops.* It is fundamentally **one assistant** — one instruction set, one knowledge pile, one set of Actions. No user-owned tables, no scheduled jobs, no multiple cooperating agents composed as one app. Knowledge files and threads are stored by the vendor; there is no local mode. And the mandated Assistants-to-successor migration is itself the lock-in tax: a vendor-dictated rewrite on the vendor's timeline.

*The honest position.* Right tool for reach and speed inside one vendor's audience when you do not need ownership or a multi-primitive app. A different category from a domain OS you own.

### Agent frameworks — the toolkit, not the appliance

*What they are.* Code-first, open-source libraries — LangChain/LangGraph, CrewAI, the Microsoft Agent Framework (the merger of AutoGen and Semantic Kernel), LlamaIndex — that you import and program against to orchestrate agents, tools, memory, and multi-agent workflows. None is itself an installable end-user application; each is an SDK you build *with*.

*What they are genuinely good at.* Maximum flexibility and full control, custom multi-agent topologies, production runtime primitives (durable execution, checkpointing, human-in-the-loop), and — genuinely — **low model-layer lock-in**, since all are pluggable across providers including local models. That last point is a real strength, and this memo will not pretend otherwise.

*Where it stops.* The operator is a software engineer. You **build**, then you test, deploy, host, secure, and *maintain* the code and infrastructure. There is no "install this and get a working real-estate ops system." Local ownership is possible but means you stand up and operate the persistence yourself. The cost is not model lock — it is the **engineering and maintenance floor**.

*The honest position.* The right choice when you have engineers and need bespoke orchestration the platform cannot express. A Pack collapses that floor into an install step — trading some ceiling of control for the ability to be used by someone who does not write code.

## 5. Verification — the four axes, applied

The comparison above runs on four axes, and each verdict is checkable — product facts against Relay source (cited in this memo's `metrics.json`), external facts against primary docs (also cited there):

| | Local data ownership | Composes multiple primitive kinds | Full application surface | Vendor-locked |
|---|---|---|---|---|
| **Relay Pack** | Yes — you own the state | Yes — agents + workflows + tables + schedules | Yes — installs a running app | No |
| Skill | No (read-only resources) | No — one agent's instructions | No | Format open; not an app |
| MCP | N/A (a protocol) | No — one thing: connectivity | No — a port | No (vendor-neutral) |
| Plugin | No (host owns state) | No — features of one host | No — you plug into another app | Yes, hard |
| Custom GPT | No (vendor-hosted) | No — one assistant config | No — one hosted assistant | Yes |
| Agent framework | Possible, self-operated | Yes, if you build it | Only if you build it | Low at model layer |

The table is the argument compressed. Only two rows say "yes" across ownership *and* multi-primitive *and* application surface: the Pack (turnkey) and the agent framework (if you are willing to build and operate it). Everything else is, by design, a single-primitive or host-locked answer.

## 6. Tradeoffs and honest gaps

The fair reading of this comparison cuts against Relay in specific places, and the brand is precision, so here they are:

- **Packs trade ceiling for floor.** An agent framework can express orchestration a Pack's four primitive kinds cannot. If you need a bespoke topology, the framework is right and a Pack is a cage. Packs win on *time-to-owned-system*, not on *maximum expressiveness*.
- **A Pack is only as portable as its runtime.** "You own it" means you own it *in Relay*. The open `SKILL.md` format is more portable across *agents* than a Pack is across *platforms*. Ownership here is about your data and your deploy targets (your GitHub repo, your local DB), not about running the Pack outside Relay.
- **The complementary tools are genuinely complementary, and that cuts both ways.** Because a Pack should *use* MCP and *can* embed Skills, "Pack vs MCP" is a false frame that flatters us. The honest claim is layering, not victory.
- **Some soft facts deserve hedging.** The exact launch date of Claude Skills and the precise ChatGPT-plugin sunset dates are cross-corroborated but not quoted from a single canonical source; treat them as approximate. The Assistants-API shutdown is well-sourced. This memo hedges accordingly rather than asserting false precision — which is, itself, the point of the series.

## 7. What this unlocks

Reading the landscape this way unlocks three things:

1. **A clean mental model.** Connectivity is MCP's job. Agent know-how is a Skill's job. Reach inside a host is a plugin's or a GPT's job. Bespoke orchestration is a framework's job. *Composing owned primitives into a domain application* is a Pack's job. Once the layers are separate in your head, "should I use X or a Pack?" usually resolves to "both, at different layers."
2. **A buying test.** Ask of any AI extension: *does it own my data locally, does it compose more than one kind of primitive, is it a whole application, and can the vendor turn it off?* The answers sort the field in four questions.
3. **A build direction for Relay.** Because Packs are composed from typed, owned primitives over a runtime the user controls, the platform can add a new primitive kind or a new pack kind additively — and every existing pack inherits it. The domain memos in this series are each a proof that the composition holds under real domain load.

## 8. Closing

The five common answers to "make a general model do a specific job" are all good at what they were designed for, and two of them — MCP and Skills — are things a Pack is glad to use. But none of them, alone, gives a non-engineer a **running, owned, multi-primitive domain system** in one install. That is the layer a Pack occupies, and it is a different layer than a connector, an instruction bundle, a host extension, a hosted assistant, or a code toolkit.

The rest of the *Relay Packs* series takes this pillar into the field. The **Web Designer** memo shows a table of rows becoming a landing page you own. The **Agency** memo shows a free spine and an industry vertical flattening into one operating system. The **Marketing** memo shows a bundle split across two function domains, bound by an attribution spine. The **CRE and Nonprofit** memos show real domain fields — rent rolls, grant cycles — riding on the same four primitives.

Start with any of them. You will see this argument stop being an argument and start being an app.

---

_Series pillar. Domain memos: **Web Designer**, **Agency**, **Marketing**, **CRE & Nonprofit**._
