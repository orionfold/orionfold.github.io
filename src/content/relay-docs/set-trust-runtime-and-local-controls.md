---
title: "Set Trust, Runtime, And Local Controls"
order: 9
summary: "This chapter helps you check the trust, runtime, approval, and license controls that matter before you run real business work."
features:
  - "Local-first trust posture"
  - "Runtime selection"
  - "Tool permissions and approvals"
  - "Offline license lifecycle"
  - "Settings summary and top chrome"
  - "Dashboard and settings drill-downs"
---
## What This Chapter Helps You Do

This chapter helps you check the trust, runtime, approval, and license controls that matter before you run real business work.

## The Operator Story

Before Northstar Automation Studio lets Relay touch client work, Maya does one final admin pass. She checks whether the app is running locally, which runtime will carry model work, what license state is saved, and where approvals will appear. She also wants to know where to inspect cost and failures after a run.

This is not security theater. It is the practical setup a small business needs before trusting an agentic tool. Relay can run tasks, use tools, route approvals, record costs, and publish artifacts. A local-first app still needs rules.

Trust in Relay is built from visible controls. Settings tells you what is configured. Inbox tells you what needs a person. Monitor tells you what happened. Costs tells you what usage means. Together, these screens form the control loop.

This control loop should be easy to explain to a non-technical owner. Before work starts, check Settings. While work waits, check Inbox. After work runs, check Monitor. When spend matters, check Costs. That simple path is stronger than a long policy nobody follows.

## What This Part Of Relay Is For

Relay is local-first. Product state lives locally, and Relay does not send customer data to Orionfold. That does not mean every action is risk-free. A runtime may call a model provider. A workflow may use tools. A premium pack may depend on license state. A publish action may target a real remote.

Settings is the preflight screen for those decisions. Use it before real customer work, before premium pack changes, before publish actions, and before changing runtime defaults.

The trust question is not "Can I click this?" The better question is, "Do I understand what will happen if I click this?"

This is especially important for local-first software. Local state reduces one kind of risk, but it does not remove operational risk. A local app can still call a provider, write files, start a workflow, or publish to a configured destination.

## Walk The Screen Like An Operator

Open **Settings**. Start with the summary so you can see the current instance state.

What you should notice:

- Summary cards for the local app.
- Links or sections for runtime, license, and other controls.
- Top chrome that helps you confirm where you are.

![Settings summary for local Relay controls](relay-shot:settings-summary)

The summary is where the admin story starts. It should show enough state to orient you before you change anything. In a dev repo, dev mode may be visible. In a real local install, you should still be able to understand license, runtime, and control posture from Settings.

Open **Runtime** next. Check which model paths are configured before you run chat, tasks, workflows, or AI-assist actions.

![Runtime settings with model and provider controls](relay-shot:settings-runtime)

Runtime is a trust setting because it controls where model work goes. A local path, a provider path, and an SDK-backed path do not carry the same cost or data-flow expectations. Read this screen before a buyer demo, a client workflow, or a budget-sensitive run.

## Run The Work Carefully

Open **License**. Check saved license state before installing or updating premium packs.

What you should see:

- Offline license verification state.
- Premium install and update access when a valid license is saved.
- Existing installed premium content remains installed even if a license later expires.

![License settings with saved offline license state](relay-shot:settings-license)

The license panel matters because it explains pack behavior. If a premium install is blocked, this is where you look. If a license expires, installed local content should remain installed. The gate applies to new premium installs and updates, not to the local work you already have.

While work runs, use **Inbox** as the human control point.

![Inbox approval queue for human control](relay-shot:inbox-approvals)

Inbox shows approvals, workflow questions, budget alerts, and other operator decisions. If an approval is waiting, answer it before starting more work. A waiting approval is not clutter. It is Relay asking for human judgment.

After the action, use Monitor to inspect execution.

![Monitor view for execution and failure checks](relay-shot:monitor)

Monitor is where you check what ran, what failed, and which runtime or provider identity Relay can show. If a run fails, this is the evidence screen.

Finally, open **Cost & Usage** from the Observe section to understand spend and usage.

![Costs view for spend and usage checks](relay-shot:costs)

Costs completes the trust loop. It helps separate local-free usage, metered usage, budget context, and attribution. Use it before changing budgets or rerunning expensive work.

Together, these screens create a review rhythm. Settings defines intent. Inbox captures judgment. Monitor records execution. Costs records usage. A team can use that rhythm in a weekly review or before a buyer demo.

## What To Do When The State Looks Wrong

If a runtime is missing, do not run client work until you configure or select the right path. A missing runtime is not a prompt problem.

If an approval is waiting, answer it from Inbox before you start more work. A second run may duplicate the first issue.

If a premium pack action is blocked, fix the license state or keep using the installed version you already have.

If a run fails, use Monitor and Costs to understand the effect before retrying. Keep the error text.

If a publish target or network bind points outside your local loopback setup, stop and review the destination. Local-first does not mean every configured action stays private.

If trust settings look correct but behavior still surprises you, capture the evidence. Save the settings state, the Inbox item, the Monitor row, and the Costs view. Those four pieces make a useful bug report or internal review note.

## What This Changes In Daily Work

The daily habit is to run a trust loop around important work. Settings before action. Inbox during action. Monitor after action. Costs when spend or budget matters.

For an admin, this creates a simple review path. For an agency, it makes client work explainable. For an SMB owner, it lowers the risk of silent automation.

Relay gives you local control, but control only helps when you use the screens that show it.

The best outcome is a calm operating habit. People should not need to ask where approvals live or why a model path was used. The answer should be visible in the product.

## Where To Go Next

Next, return to the chapter for the work you plan to run: packs, projects, chat, workflows, tables, costs, or web publishing.
