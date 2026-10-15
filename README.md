# QR awareness / Mercedes F1 T-shirt giveaway

A mobile entry page and protected presenter dashboard for a real event giveaway and QR awareness reveal.

- GitHub Pages serves `docs/`.
- Cloudflare Worker + D1 stores visits and voluntary entries centrally.
- Browser/OS/model breakdown, poster attribution, minute-by-minute visits, recent anonymous device activity, size charts.
- Mandatory name and preferred size, with random claim codes and no email or phone collection. Shipping is collected privately from the winning browser session only.
- Presentation mode, sample mode, authenticated live statistics, and one saved winner draw.

**Deployed:** [Giveaway page](https://ajai1337.github.io/qr-awareness/) · [Presenter dashboard](https://ajai1337.github.io/qr-awareness/dashboard.html) · [Print A5 posters](https://ajai1337.github.io/qr-awareness/poster.html)

Cloudflare API is connected. Sample results are clearly labelled. The presenter password is stored separately as a Cloudflare secret; it is never in this repository.

## Local rehearsal (Node 24+)

Run 
ode local-server.mjs` from this folder, then open the local links it prints. Use its temporary dashboard password. Data stays in memory and disappears when the server stops. This exercises the same backend handler as production, using SQLite locally.

## Verify


ode --test backend/test.mjs backend/integration.test.mjs backend/shipping.test.mjs`

See [SETUP.md](SETUP.md) for deployment, the event checklist, data deletion, and measurement limits. Never commit credentials, database files, or attendee data.


The campaign uses the actual supplied purple Mercedes shirt photo. The protected dashboard supports a complete CSV export (shipping excluded) and a typed-confirmation permanent event reset. Live records were preserved during development.


