# Management

Business-level governance for the platform: who owns what, who runs what, and where
the live status lives. Venture-level operations stay in each venture's `operations.md`;
this directory is the layer above them.

```
management/
├── README.md                  This file — teams, ownership, succession intent
├── status.md                  Business tracking: executive summary + status board
├── business-registration.md   BC sole proprietorship registration + succession checklist
├── naming-and-domains.md      Business name candidates, domain plan, email/web hosting
└── projects/                  Project management structure
    ├── README.md              How projects run + the live project register
    └── _template.md           Copy to start a new project one-pager
```

## Legal ownership

- **Legal structure:** Sole proprietorship, registered in **British Columbia, Canada**
- **Owner (sole proprietor):** Sheila Nayler
- **Succession intent:** the business and its assets pass to **Troy Nayler** if anything
  happens to Sheila — implemented through Sheila's will (see
  [`business-registration.md`](business-registration.md) § Succession, and note the
  legal-advice caveat there: a BC sole proprietorship is not a separate legal entity,
  so this is estate planning, not a corporate document)

## Business Management Team

Accountable for the business as a whole: legal, financial, and strategic decisions.

| Role | Holder | Accountable for |
|---|---|---|
| **Owner / Principal** | Sheila Nayler | Legal owner; final authority on binding commitments, banking, registration |
| **Managing Director** | Troy Nayler | Strategy and operations across all ventures; platform-level decisions; designated successor |

Decision rule (mirrors [Pillar 1](../docs/01-business-structure.md)): anything that
legally binds the business or its money — registrations, bank accounts, contracts,
credit — is the Owner's signature. Everything operational is the Managing Director's
call.

## Project Management Team

Accountable for delivery: projects planned, executed, and reported.

| Role | Holder | Accountable for |
|---|---|---|
| **Program Lead** | Troy Nayler | The project register: priorities, statuses, unblocking |
| **Venture Owners** | (per venture registry) | Projects inside their venture delivered to milestone |
| **Automation / AI support** | Claude (platform tooling) | Build work, research, drafting, and tracking as directed — always under a named human owner per [Pillar 5](../docs/05-automation.md) |

With a two-person team, the same people hold multiple seats — the seats still matter,
because they say which hat is being worn when a decision is made, and they are the
slots future hires drop into.

## Reporting rhythm

- **[`status.md`](status.md)** is the written record: executive summary + status board,
  updated whenever something material changes and at least monthly.
- The **[platform console](../console/index.html)** is the live dashboard (ventures,
  financials, opportunities).
- Quarterly: venture pillar reviews per the [platform framework](../docs/00-platform-overview.md).
