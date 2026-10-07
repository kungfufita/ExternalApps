# Mindsight — blindfold-sight trainer

An offline-first PWA that trains and, more importantly, **measures** "blindfold sight"
(also called mindsight, closed-eye vision, midbrain activation, InfoVision): identifying
colours, shapes and text while the eyes are fully covered, as featured in *The Telepathy
Tapes* season 2.

## How it works

| Area | What it does |
| --- | --- |
| **Train** | Six stages, in the order the courses use: light/dark → 4 colours → 6 colours → shapes → letters & digits → words. Each session: 3-minute settling routine (slow breathing, eyes soft), then N trials with instant feedback. |
| **Device-blinded trials** | The target appears on the phone screen while the blindfold is on (rising chime + vibration), stays for a set exposure, and is removed *before* any answer buttons exist (double chime). The trainee lifts the blindfold and taps what they saw. A score therefore cannot come from peeking at the answer. |
| **Advancement** | A stage is passed when the last 20 training trials reach ≥ 75% and the binomial probability of that by guessing is < 1%. |
| **Blind test** | 20 trials, no feedback, random targets; result shown with chance level and p-value. Run weekly. |
| **Progress** | Streak, minutes, per-session accuracy chart against chance, per-stage table. |
| **Learn** | How the courses train it, the controlled-test history (every controlled test so far has failed), how to build a no-gap blindfold, session routine, sources. |

All data stays in `localStorage`. JSON export and delete-all are on the Today screen.

## Honest framing

No one has passed a controlled test of blindfold sight; exposed cases peeked through the
nose gap. This app is built so its numbers mean something either way: above-chance blind
tests would be a real finding, and chance-level results are the true baseline. It makes no
medical or scientific claims.

## Run

```bash
cd apps/mindsight && python3 -m http.server 8080   # then open http://localhost:8080
```

Set screen brightness to maximum and auto-lock off during sessions. Sound and vibration
cues are used because the trainee is blindfolded.
