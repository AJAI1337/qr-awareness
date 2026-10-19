# Phishing Simulation: awareness training studio

This branch adds a separate training studio in `docs/simulation/`. The existing giveaway site, Worker and event data are not modified.

## Start

Run `python training-server.py` in this repository. Set a password of at least 12 characters at the prompt, then open the printed URL. You may also supply `TRAINING_ADMIN_PASSWORD` through your environment. Do not commit it. The server binds only to this computer on port 8765.

Open `presentation.html` for the four-slide briefing. Arrow keys navigate, N opens notes. Slide-specific controls step through the reconstructions. WebGL animations respect reduced-motion settings. The original article screenshots remain available through the evidence buttons.

## Scope

All templates use fictional brands and fixed dummy values. There is no real sign-in, payment, domain registration, AI service, credential capture or live marketplace connection. The nonprofit builder is a clearly labelled fictional illustration.

The password-protected local admin shows consent-based aggregate opened/completed event totals and the most recent aggregate timestamp. It does not collect real credentials, form values, IP addresses, user agents, scan identities or visitor identities. Counts are events, not unique people, and reset when the server stops. Preview iframes do not record events. Host providers may separately maintain operational logs.

## QR codes and hosting

On `qr.html`, enter the deployed training site's absolute URL including its repository/subdirectory path. QRCode.js creates codes locally. Slides use that same saved URL in the same browser. A localhost QR cannot be reached by an audience phone.

The static files are proposed on the GitHub branch `codex/phishing-simulation`. No live deployment has been made. The repository remains `qr-awareness`. Its Cloudflare backend is separate and is not used by this studio. The new static pages can run on GitHub Pages, but the Python admin service cannot. Production backend deployment, repository renaming and live replacement remain separate work.

## Source and licenses

Microsoft Security Blog, 14 October 2026: https://www.microsoft.com/en-us/security/blog/2026/10/14/the-hidden-network-inside-the-phishing-infrastructure-ecosystem-powering-global-cybercrime/

Article figures © Microsoft. Storefront and chat scenes are illustrative reconstructions, not transaction transcripts. Microsoft describes purchases through the storefront, with Telegram supporting buyer contact and order notifications.

QRCode.js v1.0.0 © davidshimjs, MIT license: https://github.com/davidshimjs/qrcodejs
