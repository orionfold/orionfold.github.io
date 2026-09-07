#!/usr/bin/env python3
"""Render the Flow library's recorded example charts as deterministic SVG assets.

Requires matplotlib 3.10.8. Run from any directory with:
    python3 scripts/render-flow-library-charts.py
Optional --preview-dir writes PNGs for visual review outside the public assets.
The sanitized input fixture is sufficient; the private Flow workspace is not needed.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import tempfile

os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "flow-library-matplotlib"))

import matplotlib

matplotlib.use("Agg")
import matplotlib.dates as mdates
from matplotlib import pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Patch
from matplotlib.ticker import FuncFormatter
from datetime import datetime, timedelta

ROOT = Path(__file__).resolve().parents[1]
INK = "#233a35"
TEAL = "#26766c"
GOLD = "#d7ad4e"
RED = "#bb4d36"
MUTED = "#6c7e76"
GRID = "#e6ece7"
PALE = "#dde8e1"
PAPER = "#fffefa"

plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "font.size": 13,
    "text.color": INK,
    "axes.labelcolor": MUTED,
    "xtick.color": MUTED,
    "ytick.color": INK,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.spines.left": False,
    "axes.spines.bottom": False,
    "xtick.major.size": 0,
    "ytick.major.size": 0,
    "svg.fonttype": "none",
    "svg.hashsalt": "orionfold-flow-library-v1",
})


def canvas(width=760, height=350, rect=(.19, .18, .74, .74)):
    fig = plt.figure(figsize=(width / 72, height / 72), dpi=72, facecolor=PAPER)
    ax = fig.add_axes(rect, facecolor=PAPER)
    ax.set_axisbelow(True)
    return fig, ax


def money(value, _position=None):
    return f"${value:,.0f}"


def xgrid(ax, ticks, label):
    ax.set_xticks(ticks)
    ax.grid(axis="x", color=GRID, linewidth=1)
    ax.tick_params(axis="x", pad=12, labelsize=12)
    ax.tick_params(axis="y", pad=14)
    ax.set_xlabel(label, labelpad=15, fontsize=12)


def starter_items(rows):
    fig, ax = canvas(rect=(.18, .20, .72, .70))
    colors = [TEAL if row["group"] == "A" else GOLD for row in rows]
    ax.barh(range(len(rows)), [r["amount"] for r in rows], height=.40, color=colors)
    ax.set_yticks(range(len(rows)), [r["name"] for r in rows])
    ax.invert_yaxis()
    ax.set_xlim(0, 225)
    xgrid(ax, [0, 50, 100, 150, 200], "Amount")
    for y, row in enumerate(rows):
        ax.text(row["amount"] + 5, y, str(row["amount"]), va="center", fontsize=14)
    ax.legend(handles=[Patch(color=TEAL, label="Group A"), Patch(color=GOLD, label="Group B")],
              loc="upper right", bbox_to_anchor=(1.03, 1.13), frameon=False, ncol=2, fontsize=12)
    return fig


def starter_groups(rows):
    fig, ax = canvas(450, 320, (.03, .08, .61, .84))
    ax.pie([r["amount"] for r in rows], startangle=90, counterclock=False,
           colors=[TEAL, GOLD], wedgeprops={"width": .23, "edgecolor": PAPER, "linewidth": 3})
    ax.text(0, .10, "400", ha="center", va="center", fontsize=27, weight="medium")
    ax.text(0, -.19, "total amount", ha="center", va="center", color=MUTED, fontsize=12)
    for i, row in enumerate(rows):
        y = .60 - i * .20
        fig.text(.67, y, "●", color=[TEAL, GOLD][i], fontsize=13)
        fig.text(.72, y, f"Group {row['group']}", fontsize=13)
        fig.text(.72, y - .065, f"{row['amount']}  ·  50%", fontsize=12, color=MUTED)
    return fig


def competitor_pricing(rows):
    fig, ax = canvas(rect=(.20, .19, .69, .71))
    ax.barh(range(len(rows)), [r["price_per_seat"] for r in rows], height=.43,
            color=[TEAL, "#89a799", "#4c897b", "#b8cbb9"])
    ax.set_yticks(range(len(rows)), [f"{r['name']}\n{r['entry_tier']}" for r in rows])
    ax.tick_params(axis="y", labelsize=12)
    ax.invert_yaxis()
    ax.set_xlim(0, 12.3)
    xgrid(ax, [0, 3, 6, 9, 12], "USD / seat / month · billed annually")
    ax.xaxis.set_major_formatter(FuncFormatter(money))
    for y, row in enumerate(rows):
        price = row["price_per_seat"]
        ax.text(price + .22, y, f"${price:.2f}", va="center", fontsize=14)
    return fig


def team_confidence(rows):
    fig, ax = canvas(rect=(.23, .19, .68, .72))
    colors = {"green": TEAL, "amber": GOLD, "red": RED}
    ax.barh(range(len(rows)), [100] * len(rows), height=.37, color=GRID)
    ax.barh(range(len(rows)), [r["confidence"] for r in rows], height=.37,
            color=[colors[r["status"]] for r in rows])
    ax.set_yticks(range(len(rows)), [f"{r['area']}\n{r['name']}" for r in rows])
    ax.tick_params(axis="y", labelsize=12)
    ax.invert_yaxis()
    ax.set_xlim(0, 106)
    xgrid(ax, [0, 25, 50, 75, 100], "Self-reported confidence · 0–100")
    for y, row in enumerate(rows):
        ax.text(row["confidence"] + 2, y, str(row["confidence"]), va="center", fontsize=14)
    return fig


def job_timeline(rows):
    fig, ax = canvas(rect=(.14, .21, .70, .68))
    colors = {"Onsite": TEAL, "Phone screen": "#5e9586", "Applied": "#a9c1b3",
              "Rejected": RED, "Take-home": GOLD, "Offer": INK}
    for y, row in enumerate(rows):
        start, end = [datetime.fromisoformat(row[k]) for k in ("applied", "next_date")]
        ax.barh(y, (end - start).days, left=mdates.date2num(start), height=.39,
                color=colors[row["stage"]])
        ax.plot(mdates.date2num(end), y, "o", color=colors[row["stage"]], ms=5)
        ax.text(mdates.date2num(end + timedelta(days=1)), y, end.strftime("%b %-d"),
                va="center", fontsize=11, color=MUTED)
    ax.set_yticks(range(len(rows)), [r["company"] for r in rows])
    ax.invert_yaxis()
    ax.set_xlim(datetime(2026, 7, 19), datetime(2026, 9, 21))
    ticks = [datetime(2026, 7, 21), datetime(2026, 8, 4), datetime(2026, 8, 18),
             datetime(2026, 9, 1), datetime(2026, 9, 15)]
    xgrid(ax, ticks, "2026 · applied date → next step or closed date")
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %-d"))
    ax.legend(handles=[Patch(color=color, label=stage) for stage, color in colors.items()],
              loc="lower left", bbox_to_anchor=(-.12, 1.04), ncol=6, frameon=False,
              fontsize=10.5, handlelength=.8, columnspacing=1.2)
    return fig


def budget_categories(rows):
    fig, ax = canvas(760, 430, (.20, .15, .56, .76))
    for y, row in enumerate(rows):
        ax.barh(y, row["budget"], height=.56, color=GRID)
        ax.barh(y, row["spent"], height=.28,
                color=RED if row["spent"] > row["budget"] else TEAL)
        ax.plot([row["budget"], row["budget"]], [y-.28, y+.28], color=INK, linewidth=1.5)
        for x, key in [(1.21, "spent"), (1.41, "budget")]:
            ax.text(x, y, money(row[key]), transform=ax.get_yaxis_transform(),
                    ha="right", va="center", fontsize=11.5,
                    color=RED if key == "spent" and row["spent"] > row["budget"] else INK)
    ax.set_yticks(range(len(rows)), [r["category"] for r in rows])
    ax.tick_params(axis="y", labelsize=12)
    ax.invert_yaxis()
    ax.set_xlim(0, 3150)
    xgrid(ax, [0, 1000, 2000, 3000], "USD · August 2026")
    ax.xaxis.set_major_formatter(FuncFormatter(money))
    ax.text(1.21, 1.04, "Spent", transform=ax.transAxes, ha="right", color=MUTED, fontsize=11.5)
    ax.text(1.41, 1.04, "Budget", transform=ax.transAxes, ha="right", color=MUTED, fontsize=11.5)
    ax.legend(handles=[Patch(color=TEAL, label="Spent"), Line2D([0], [0], color=INK, marker="|",
              markersize=13, linestyle="None", label="Budget"), Patch(color=RED, label="Over budget")],
              loc="lower left", bbox_to_anchor=(-.01, 1.025), frameon=False, ncol=3,
              fontsize=11.5, handlelength=1, columnspacing=1.5)
    return fig


def portfolio_allocation(rows):
    fig, ax = canvas(450, 320, (.0, .12, .54, .76))
    colors = [TEAL, "#468979", "#669889", "#81a899", "#a7c0af", GOLD,
              "#bc9550", "#8e774e", "#607764", "#394f47", "#dce5d9"]
    ax.pie([r["value"] for r in rows], startangle=90, counterclock=False, colors=colors,
           wedgeprops={"width": .23, "edgecolor": PAPER, "linewidth": 2})
    ax.text(0, .14, "10", ha="center", va="center", fontsize=29, weight="medium")
    ax.text(0, -.12, "positions", ha="center", va="center", fontsize=12, color=MUTED)
    ax.text(0, -.33, "+ cash", ha="center", va="center", fontsize=11, color=MUTED)
    for i, row in enumerate(rows):
        y = .84 - i * .068
        fig.text(.57, y, "●", color=colors[i], fontsize=11)
        fig.text(.615, y, row["symbol"], fontsize=11.5)
        fig.text(.98, y, money(row["value"]), fontsize=11.5, ha="right")
    fig.text(.615, .91, "Position", fontsize=11, color=MUTED)
    fig.text(.98, .91, "Value (USD)", fontsize=11, color=MUTED, ha="right")
    return fig


def portfolio_history(rows):
    fig, ax = canvas(rect=(.10, .20, .78, .67))
    for line, color in [("Portfolio", TEAL), ("S&P 500", GOLD)]:
        values = [r for r in rows if r["line"] == line]
        days = [datetime.fromisoformat(r["day"]) for r in values]
        indexed = [r["indexed"] for r in values]
        ax.plot(days, indexed, color=color, linewidth=2.7, label=line)
        ax.plot(days[-1], indexed[-1], "o", color=color, ms=6)
        ax.annotate(f"{indexed[-1]:.2f}", (days[-1], indexed[-1]), xytext=(10, 0),
                    textcoords="offset points", va="center", color=color, fontsize=12)
    ax.set_ylim(96, 101.4)
    ax.set_xlim(datetime(2026, 8, 3), datetime(2026, 9, 4))
    ax.set_yticks([96, 97, 98, 99, 100, 101])
    ax.grid(axis="y", color=GRID)
    ax.axhline(100, linewidth=1, color=PALE, linestyle=(0, (4, 3)))
    ticks = [datetime(2026, 8, 4), datetime(2026, 8, 11), datetime(2026, 8, 18),
             datetime(2026, 8, 25), datetime(2026, 9, 2)]
    ax.set_xticks(ticks)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %-d"))
    ax.tick_params(axis="x", pad=12, labelsize=12)
    ax.set_xlabel("2026 · 22 daily closes · first session = 100", labelpad=16, fontsize=12)
    ax.legend(loc="lower left", bbox_to_anchor=(0, 1.04), ncol=2, frameon=False, fontsize=12)
    return fig


def tax_waterfall(rows):
    fig, ax = canvas(rect=(.13, .22, .83, .68))
    cumulative = 0
    for i, row in enumerate(rows):
        change = row["change"]
        total = i == 0 or i == len(rows)-1
        bottom = 0 if total else min(cumulative, cumulative + change)
        height = change if total else abs(change)
        color = INK if i == len(rows)-1 else (TEAL if change >= 0 else GOLD)
        ax.bar(i, height, bottom=bottom, width=.53, color=color)
        top = bottom + height
        label = money(change) if total else f"{'+' if change > 0 else '−'}{money(abs(change))}"
        ax.text(i, top + 4200, label, ha="center", va="bottom", fontsize=12)
        cumulative = change if total else cumulative + change
        if i < len(rows)-2:
            ax.plot([i+.27, i+.73], [cumulative, cumulative], color=PALE,
                    linewidth=1.5, linestyle=(0, (3, 2)))
    labels = {"W-2 wages": "W-2\nwages", "Other income": "Other\nincome", "Adjustments": "Adjustments",
              "Itemized deduction": "Itemized\ndeduction", "Taxable income": "Taxable\nincome"}
    ax.set_xticks(range(len(rows)), [labels[r["step"]] for r in rows])
    ax.tick_params(axis="x", pad=14, labelsize=12)
    ax.tick_params(axis="y", labelsize=11, pad=8)
    ax.set_ylim(0, 174000)
    ax.set_yticks([0, 40000, 80000, 120000, 160000])
    ax.yaxis.set_major_formatter(FuncFormatter(money))
    ax.grid(axis="y", color=GRID)
    ax.set_xlabel("USD · tax year 2025 example", labelpad=15, fontsize=12)
    return fig


RENDERERS = {
    "starter-items": starter_items,
    "starter-groups": starter_groups,
    "competitor-pricing": competitor_pricing,
    "team-confidence": team_confidence,
    "job-timeline": job_timeline,
    "budget-categories": budget_categories,
    "portfolio-allocation": portfolio_allocation,
    "portfolio-history": portfolio_history,
    "tax-waterfall": tax_waterfall,
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--preview-dir", type=Path)
    args = parser.parse_args()
    source = json.loads((ROOT / "src/data/flow-library-charts.json").read_text())
    output_dir = ROOT / "public/flow/library"
    output_dir.mkdir(parents=True, exist_ok=True)
    if args.preview_dir:
        args.preview_dir.mkdir(parents=True, exist_ok=True)
    for name, renderer in RENDERERS.items():
        fig = renderer(source["charts"][name]["data"])
        output = output_dir / f"{name}.svg"
        fig.savefig(output, format="svg", metadata={"Date": None, "Creator": None}, transparent=True)
        # Preserve the plotting library's geometry while using CSS pixel dimensions.
        svg = output.read_text()
        svg = re.sub(r'(width|height)="([\d.]+)pt"', r'\1="\2"', svg, count=2)
        # Matplotlib bundles DejaVu; browsers do not. Keep live text and provide
        # an installed sans-serif face plus a generic fallback for every label.
        svg = svg.replace("font-family: 'DejaVu Sans'", "font-family: Arial, sans-serif")
        svg = "\n".join(line.rstrip() for line in svg.splitlines()) + "\n"
        output.write_text(svg)
        if args.preview_dir:
            fig.savefig(args.preview_dir / f"{name}.png", dpi=108, facecolor=PAPER)
        print(f"{output.relative_to(ROOT)}: {fig.get_figwidth()*72:.0f} × {fig.get_figheight()*72:.0f}")
        plt.close(fig)


if __name__ == "__main__":
    main()
