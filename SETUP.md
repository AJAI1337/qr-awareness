# QR awareness giveaway

The app is deployed on GitHub Pages + Cloudflare Workers/D1. No credentials belong in this repository. The public configuration is `docs/config.js` and the allowed website origin. The steps below also explain how to recreate the deployment.

Live entry: https://ajai1337.github.io/qr-awareness/

Presenter dashboard: https://ajai1337.github.io/qr-awareness/dashboard.html

Print-ready A5 layout with real location QR codes: https://ajai1337.github.io/qr-awareness/poster.html

The entry page and all location posters use the supplied actual purple/turquoise Mercedes prize photo. Confirm the organiser name and draw timing before the event. There is no automatic event schedule or deletion job.

## 1. Preview first

Open a terminal in this folder and run `python -m http.server 8080`. Open `http://localhost:8080/docs/?preview=1` for the entry-page preview and `http://localhost:8080/docs/dashboard.html`, then choose **Explore sample results**. Preview records are never sent to the backend.

## 2. Create your GitHub home

1. Create/sign into an account at https://github.com.
2. Select **New repository**, name it `qr-awareness`, select **Public**, and create it. Never upload passwords or participant data.
3. Select **uploading an existing file** (or **Add file → Upload files**). Upload this project's files and folders, preserving the `docs/` and `backend/` folder structure. Commit the upload.
4. Open **Settings → Pages**. Select **Deploy from a branch**, branch `main`, folder `/docs`, then Save.
5. GitHub shows your public URL, normally `https://YOUR-USERNAME.github.io/qr-awareness/`. Keep it for step 3. Site publication can take a few minutes.

GitHub guidance: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 3. Set up the database and backend

Create/sign into https://dash.cloudflare.com. Install Node.js LTS from https://nodejs.org if needed. In a terminal inside this project's `backend` folder, run each command separately:

```powershell
npx wrangler login
npx wrangler d1 create qr-awareness
```

The second command returns a `database_id`. Paste it into `backend/wrangler.toml` in place of `REPLACE_WITH_DATABASE_ID`. Set `ALLOWED_ORIGIN` to your GitHub **origin only**, such as `https://yourname.github.io` (no repository path, no final slash).

Then run:

```powershell
npx wrangler d1 execute qr-awareness --remote --file=schema.sql
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

At the password prompt, enter a long random dashboard password from a password manager. Keep it private. Do not paste it into this chat or a repository. Deployment prints a URL such as `https://qr-awareness-api.YOUR-SUBDOMAIN.workers.dev`.

Cloudflare guidance: https://developers.cloudflare.com/d1/get-started/

## 4. Connect the page

Edit `docs/config.js`: paste the Worker URL into `api`, with no final slash. Fill in organiser and draw details, then commit/upload the changed file to GitHub. The title is already **Free Mercedes F1 T-shirt up for grabs**. Confirm the actual prize and size availability with the organiser.

Open `https://YOUR-USERNAME.github.io/qr-awareness/dashboard.html` and log in with your dashboard password. It refreshes every 5 seconds. Sample mode is clearly marked and separate from live data.

## 5. Posters and live rehearsal

ElevenLabs poster options: https://elevenlabs.io/app/flows/4OE2P7ulBxH3kIDulYSD

The artwork has a reserved QR area; any AI-generated patterns are NOT usable QR codes. Once your final URL works, create real QR codes for URLs such as:

- `https://YOUR-USERNAME.github.io/qr-awareness/?source=entrance`
- `https://YOUR-USERNAME.github.io/qr-awareness/?source=registration`
- `https://YOUR-USERNAME.github.io/qr-awareness/?source=seating`

The A5 print page now includes real QR codes for the final URLs above. Use a minimum 30 mm QR width, dark modules on white, with its quiet zone preserved. Test a printed copy on iPhone and Android from normal viewing distance before scattering posters. Never encode the dashboard URL or password.

Before the event: verify a phone visit appears on the dashboard; submit and screenshot its claim code; reload and submit again to verify it does not create another entry within that browser session. Try wrong dashboard credentials. Test the winner draw only with rehearsal data, then clear the database below. Clicking Draw a winner persists one winner and closes entries; subsequent clicks return the same winner.

## 6. Run the reveal

Open the dashboard on the presenter's laptop. Log in before projecting. Use Presentation view. Show visits versus entries, device information, and poster sources. Explain that a scan which never opened the page cannot be counted. The app counts random browser sessions, not people: another tab/browser or clearing session data can create another session. It does not guarantee one entry per person. Browser details are self-reported and models are often unavailable. Direct links and preview bots can also affect visit counts. CORS is not bot protection; this is an event demo, not a high-value public contest platform.

The crowd sees anonymous device activity and aggregate statistics only. The draw reveals a claim code; the winner shows their screenshot to collect the actual shirt. No contact details are needed. There is no claim that scanning alone revealed names or hacked devices.

The backend stores the raw user agent, available model, random session ID, poster source, timestamps, submitted name and preferred size. Winner delivery details are stored separately for private fulfilment. It does not store IP addresses; Cloudflare/GitHub may maintain operational logs. The entry page discloses limited collection and the awareness activity. No cookie fingerprinting or GPS collection is used.

## 7. Clear rehearsal data / delete event data

After the event, within the 7-day period promised on the page, delete the records. This permanently clears the current event, including the saved winner. Run in `backend/`:

```powershell
npx wrangler d1 execute qr-awareness --remote --command="DELETE FROM shipping; DELETE FROM winner; DELETE FROM entries; DELETE FROM visits;"
```

This is a manual deletion step, not an automatic retention job. Also disable the Worker after the event in the Cloudflare dashboard so it stops accepting new visits/entries. Keep each event in a separate database if you reuse this app.

## Checks

Run 
ode --test backend/test.mjs` from the project root. These checks cover authentication, cross-origin rejection, invalid input, and device-label fallbacks. Full database integration and real-device QR checks must be completed after account setup.


## Redesigned entry and winner shipping
Name is mandatory; favourite team is no longer collected. Name and size are stored for the draw. Private organiser details show the entered name alongside user agent and available model. Presentation mode hides this private table and all shipping details. A short, explicit notice remains on the entry form.
The winner uses claim.html in the same browser session with their claim code. Only the winning session can submit a delivery address after consenting. The organiser can view that address privately under Winner shipping. Delete shipping records before deleting entries, and delete all event records within the stated seven-day period. Shipping details must never be projected.
The shirt photo is the actual prize supplied by the organiser.



## Event export and reset
The private organiser dashboard offers Export event CSV. It downloads every visit, including those without entries, with name/size when submitted and browser/device details. Delivery addresses are excluded. Keep the downloaded file private. CSV formula-like values are escaped for spreadsheet use.
Reset event counters requires typing RESET EVENT. It permanently deletes visits, entries, the winner and shipping records in one transaction, and reopens the draw for a fresh event. Export first if records are needed. Attendees must reload the entry page. No live reset was performed during development; reset was verified against synthetic local data.
Entry and location posters now use the actual supplied purple/turquoise prize photo, not generated artwork.



