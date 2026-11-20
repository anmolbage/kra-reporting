# KRA Reporting

A phone app for Ramgarh Cantt (443) that turns the day's figures into the branch WhatsApp
report, so nobody types it by hand.

> **Status: live 20 Nov 2026 (slices 1–4)** at https://anmolbage.github.io/kra-reporting/ — Sheet: "KRA Reporting" in Drive,
> Apps Script project "KRA Reporting" bound to it, deployment "v1".

---

## What the pieces are

If you have not built one of these before, here is what each part does and why it exists.

**The app** — a single `index.html` file. It is a normal web page, but written so it works on a
phone, saves to the phone itself, and can be added to the home screen like an installed app.
There is no server running it and nothing to pay for. Staff open a link; that is the whole
installation.

**The Google Sheet** — where the figures actually live. One row per parameter, per person, per
day. You can open it like any spreadsheet and sort, filter or pivot it. This is the real record;
if the app vanished tomorrow the data would still be there.

**Apps Script** — a small piece of code that lives *inside* the Google Sheet (Extensions →
Apps Script). It is the only thing allowed to read and write the Sheet. The app talks to it
over the internet; it checks the person's PIN and then saves their rows. It exists because a
web page cannot safely be given direct access to a spreadsheet — the password would be visible
to anyone who viewed the page source.

**GitHub Pages** — free hosting. You put `index.html` in a GitHub repository, switch Pages on,
and GitHub gives you a web address. That address is what you send to staff.

Put together: **phone → app → Apps Script → Sheet**, and back again for the reports.

---

## How it will work day to day

1. Each person opens the link on their phone, picks their name and types their own PIN. Once.
2. Through the day they tap a section, pick a parameter, and type the A/C count and amount.
   Only the lines where something happened — everything else stays blank.
3. Figures save to the phone instantly and reach the Sheet a couple of seconds later. No
   signal means it waits and sends when signal returns; nothing is lost.
4. At close, the Report screen shows the whole branch's figures added together, already
   formatted as the WhatsApp message, with a copy button.
5. The MTD screen shows the month so far against the targets you set.

---

## Setting it up

About 15 minutes, once.

1. **Make the Sheet.** Create a new Google Sheet (call it *KRA Reporting*). Open
   **Extensions → Apps Script**, delete what is there, paste the whole of `Code.gs`, press Save.
2. **Run `setup()`.** Pick `setup` in the function box at the top, press **Run**, and allow the
   permissions it asks for. It creates the `Entries`, `Staff` and `Targets` tabs and one row:
   **Anmol / manager** with a random PIN. Open the `Staff` tab, read the PIN (change it if you like —
   4 to 8 digits).
3. **Deploy.** **Deploy → New deployment → ⚙ Web app.** Execute as: **Me**. Who has access:
   **Anyone**. Press Deploy and copy the URL ending in `/exec`.
4. **Connect the app.** Either send the URL to Claude to put in `index.html` and push, or edit
   `CFG.ENDPOINT` near the top of the script in `index.html` yourself and push.
5. **Sign in** on your phone at https://anmolbage.github.io/kra-reporting/ with your name and the PIN
   from step 2. Then **Add to Home screen** from the browser menu.
6. **Add staff** from **More → Staff** in the app (name, PIN, role), or straight into the `Staff` tab.
   Set **Branch targets** for the month on the same screen.
7. **Send the link** to the named staff member and tell them their PIN in person.

**Changed `Code.gs` later?** Deploy → **Manage deployments** → ✎ → Version: **New version** → Deploy.
The `/exec` URL stays the same. Without this the old code keeps running.

**Changed `index.html` later?** Bump `VERSION` in `sw.js` too, so installed phones pick it up.

### Login, in one paragraph

Each person picks their name and types their own PIN. The script checks it against the `Staff`
tab and hands back a signed token; the PIN is not kept on the phone. Every save is stamped with the
name from that token, so nobody can enter figures as someone else. Setting **Active** to FALSE (or
changing their PIN) signs that person out on their next sync. Five wrong PINs lock that name for
10 minutes. Managers can also set targets, add parameters and manage staff.

### What lives where

| | |
|---|---|
| `Entries` tab | One row per parameter, per person, per day. Re-saving a day replaces that person's rows. |
| `Staff` tab | Name, PIN, Role (`staff`/`manager`), Active. PINs live only here; managers see them in More → Staff (Show PINs / Copy login). |
| `Targets` tab | Month (`yyyy-mm`), ParamID, TargetCount, TargetAmount — branch level. |
| Script properties | The token-signing secret and any parameters a manager added. |
| The phone | Your own lines (saved instantly) and the queue of days not yet sent. |

---

## Rules for this folder

- One folder, one app. No `v1/`, no `v2.zip`, no spare copies of `index.html`. Versions are git
  tags.
- `BRIEF.md` is the agreement. If you want to build something not in it, write it in `LATER.md`
  and finish the current slice first.
- Never put customer names or account numbers into this app. Performance figures only.

---

## The files here

| File | What it is |
|---|---|
| `BRIEF.md` | The agreement (kept local — not in the public repo, it holds a PIN) |
| `index.html` | The app |
| `Code.gs` | The Apps Script backend — paste into the Sheet |
| `sw.js`, `manifest.json`, `icon*` | Make it installable and open without signal |
| `PARAMETERS.md` | The 41 parameters — ids, names, groups, and the report format |
| `LATER.md` | Ideas parked during the build |
| `README.md` | This file |
