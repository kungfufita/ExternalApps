# IEP Studio — Deaf Education (Ontario)

A progressive web app (PWA) for teachers of Deaf and hard-of-hearing students. It is
**visual-first** (nothing in the app depends on sound), **offline-first** (all data lives
on-device in IndexedDB), and **installable** on desktop, tablet, and phone.

## What it does

| Area | Capability |
| --- | --- |
| **IEP profiles** | Full Ontario-format IEP per student: identification & placement (IPRC), communication profile (ASL/LSQ, amplification, interpreter), strengths/needs, assessment data, instructional/environmental/assessment accommodations (with Deaf/HH-focused suggestions), AC/MOD/ALT program areas with annual goals and term learning expectations, human resources, transition plan, consultation log. |
| **Individual questions** | Each student carries their own intake question set (seeded with Deaf-education intake questions); teachers add any question needed for that child. Answers flow into the printed IEP. |
| **Interactive sessions** | One-question-at-a-time visual runner with large touch targets, optional ASL/LSQ video link and image per question, prompt-level recording (independent → hand-over-hand), and instant visual feedback. |
| **Adaptive engine** | Per-expectation mastery tracking (EMA weighted by prompt independence) selects the next question's difficulty for each child individually. |
| **Tracking & reports** | Printable Ontario-format IEP form, IEP progress report with per-expectation mastery and trend, session logs, CSV and JSON exports, whole-class JSON backup/restore. |
| **PDSB interface** | Assembles standardized referral packages for the Provincial and Demonstration Schools Branch (Sir James Whitney, E.C. Drury, Robarts, Centre Jules-Léger) — printable form, JSON package (`on-pdsb-referral@1`), and optional transmission to a board-configured secure HTTPS endpoint. Every exchange is logged. |

## Accessibility for Deaf educators and learners

- No audio cues anywhere; notifications are **visual flashes** with `role="alert"`.
- Every question can carry an **ASL/LSQ video link** and image so instructions never depend on spoken/written English alone.
- High-contrast palette, dark-mode support, ≥48 px touch targets, keyboard focus rings,
  reduced-motion fallback.

## Running it

It is a static app — serve the folder over HTTP(S):

```bash
cd apps/deaf-teacher-iep
python3 -m http.server 8080
# open http://localhost:8080
```

Install via the browser's "Install app" prompt (or the header button). Once loaded, it
works fully offline; the service worker caches the app shell.

## Privacy notes

Student records never leave the device unless the teacher explicitly downloads an export
or presses **Send** in the PDSB module with a board endpoint configured in Settings.
PDSB has no public API — the endpoint field exists for boards that provide their own
secure intake service. Follow your board's MFIPPA/privacy protocols for any transfer of
student records, and verify printed IEPs against your board's current template before filing.
