# QR awareness / Mercedes F1 T-shirt giveaway

A mobile entry page and protected presenter dashboard for a real event giveaway and QR awareness reveal.

- GitHub Pages serves `docs/`.
- Cloudflare Worker + D1 stores visits and voluntary entries centrally.
- Browser/OS/model breakdown, poster attribution, minute-by-minute visits, recent anonymous device activity, team and size charts.
- Random claim codes identify the winner without email or phone collection.
- Presentation mode, sample mode, authenticated live statistics, and one saved winner draw.

**Deployed:** [Giveaway page](https://ajai1337.github.io/qr-awareness/) · [Presenter dashboard](https://ajai1337.github.io/qr-awareness/dashboard.html) · [Print A5 posters](https://ajai1337.github.io/qr-awareness/poster.html)

Cloudflare API is connected. Sample results are clearly labelled. The presenter password is stored separately as a Cloudflare secret; it is never in this repository.

## Local rehearsal (Node 24+)

Run `node local-server.mjs` from this folder, then open the local links it prints. Use its temporary dashboard password. Data stays in memory and disappears when the server stops. This exercises the same backend handler as production, using SQLite locally.

## Verify

`node --test backend/test.mjs backend/integration.test.mjs`

See [SETUP.md](SETUP.md) for deployment, the event checklist, data deletion, and measurement limits. Never commit credentials, database files, or attendee data.
