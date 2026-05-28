---
title: One agent, three faces
date: 2025-09-01
summary: The same AI agent should meet a developer in the terminal, a manager in a dashboard, and a phone user by voice. One brain, many doors.
hero: ../../assets/story/one-agent-three-faces/hero.jpeg
heroAlt: "Three-panel comic. The same AI agent meets a developer at a terminal, a manager at a dashboard, and a person by voice."
tags:
  - Agents
  - Personalized for one
  - AI Native
---

I had a good analyst AI. I showed it to a few people. The developer loved it. The manager bounced right off it. My friend on her phone never even tried. Same agent. Three reactions. That taught me something about doors.

## One brain, many doors

An agent is the smart part, the thing that does the work. The interface is the door you walk through to reach it.

I had built exactly one door. A command line. That is the text-only screen where you type commands, the kind developers love and most people quietly fear. So of course the developer was happy. It was made for him. Everyone else was standing outside a door that was not built for them.

## People do not all work the same way

I wrote down what I was seeing, and it matched how people actually behave. As I put it at the time: "Search users prefer chat interfaces. Mobile users like using voice. Browser users are exploring agentic browsers and AI extensions. Developers prefer the terminal user interface or IDE integration."

A manager does not want a command line. She wants a dashboard, a clear picture she can scan in a meeting. A person on a phone does not want to type at all. She wants to ask out loud. A developer wants the keyboard and the terminal.

None of them is wrong. They are different people, knocking on the same brain.

## The idea: situational interfaces

So I stopped asking "what is the one best interface" and started asking "what fits this person, in this moment?" I called it a situational user interface.

The rule I settled on was short: "The interface which works as well for the agents and humans for a specific situation wins."

The agent stays the same. The door changes to fit who is knocking. Terminal for the developer. Dashboard for the manager. Voice for the phone. Chat for the quick question.

## How I built it without starting over

I used an open tool kit called Strands Agents. Open means it is free to use and free to inspect. It let one agent speak through many doors, and it came with the safety parts already built in: keeping a record of what happened, watching what the agent does, hiding private details like names and numbers, and guardrails to keep it in bounds.

That mattered. I could give different people different doors without rebuilding the brain three times, and without dropping safety to do it.

## Why this shaped Orionfold

This is where one of my core beliefs was born. AI should be personalized for one. Not one design forced on everyone. The right door for the person standing in front of it.

A model tuned to your field, reached the way you like to work, on a machine you own. That is the whole picture I am building toward.

I had the doors figured out. Next I needed to build the brain itself far faster, and a tool named Kiro showed me how: [A spec at breakfast, an app by lunch](/story/a-spec-at-breakfast-an-app-by-lunch/).
