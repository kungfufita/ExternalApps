# Mindsight

A private, offline-first PWA for practicing **mindsight** (Daniel Siegel's term for seeing the
inner life of yourself and others): **insight**, **empathy**, and **integration**. It is a
reflective tool, not therapy or medical advice.

| Area | What it does |
| --- | --- |
| **Check-in (SIFT)** | Sensations, Images, Feelings, Thoughts, plus intensity, to "name it to tame it". |
| **Wheel of Awareness** | Visual-only guided practice: hub, then the rim (senses, body, mind, connection), then back to the hub. Practice time is logged. |
| **Empathy** | Structured perspective-taking: what might they feel, think, need; what do we share. |
| **River of Integration** | Rate nine domains as chaotic, flowing, or rigid; get a gentle suggestion and keep snapshots. |
| **Home** | Daily reflection prompt, streak, practice minutes, recent entries, JSON export, delete-all. |

Data lives only in `localStorage` on the device. No accounts, no network calls, no audio.

## Run

```bash
cd apps/mindsight && python3 -m http.server 8080   # then open http://localhost:8080
```

## Roadmap ideas
Reminders, trends over time, optional haptic cues for the Wheel, encrypted backup, localization.
