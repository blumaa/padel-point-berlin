# WhatsApp Listener — Agent Setup Instructions

You are an AI agent running on a machine with openClaw. Your job is to run the PadelPoint Berlin WhatsApp listener as a persistent background process. It connects to WhatsApp, reads match announcements from group chats, and writes them to Supabase.

---

## Prerequisites

Confirm Node.js 22+ is available:
```bash
node --version
```

If on Linux, install Chromium system dependencies (required for the headless browser):
```bash
apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
  libatk1.0-0 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
  libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 wget xdg-utils
```

---

## Step 1 — Get the code

```bash
git clone https://github.com/YOUR_REPO/padel-point-berlin.git
cd padel-point-berlin
npm install
```

`npm install` also downloads a Chromium binary via Puppeteer — this is expected and may take a minute.

---

## Step 2 — Create the env file

Create `.env.local` in the project root. Ask the user for the values if you don't have them:

```
NEXT_PUBLIC_SUPABASE_URL=https://zapgtydmlnohikbnkeii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ask user>
SUPABASE_SERVICE_ROLE_KEY=<ask user — this is the secret service_role key from Supabase Settings → API>
```

---

## Step 3 — First run (QR code scan required once)

Run the listener in the foreground so the QR code is visible:

```bash
npm run listener
```

The process will print a QR code to the terminal within ~15 seconds. **Relay the QR output to the user immediately** — they need to scan it with WhatsApp on their phone (WhatsApp → Linked Devices → Link a Device).

Once they scan it, the terminal will print:
```
WhatsApp client is ready!
```

The session is now saved to `.wwebjs_auth/` on disk. You do not need to scan again unless the session expires.

> **openClaw note:** The process will auto-background after yieldMs. Use `send-keys` to keep the session alive or `poll` to check if `WhatsApp client is ready!` has appeared in the output before proceeding.

---

## Step 4 — Run persistently with pm2

Once authenticated, manage the listener with pm2 so it restarts automatically on crash or reboot:

```bash
npm install -g pm2
pm2 start "npm run listener" --name padel-listener
pm2 save
pm2 startup   # run the command it prints to enable reboot persistence
```

Useful commands:
```bash
pm2 logs padel-listener       # live logs
pm2 status                    # check running state
pm2 restart padel-listener    # restart
pm2 stop padel-listener       # stop
```

---

## How it works

- `listener/index.ts` — connects to WhatsApp Web via headless Chromium, receives group messages
- `listener/handler.ts` — parses each message and writes matches to Supabase
- On disconnect the process exits with code 1 and pm2 restarts it automatically
- Session data lives in `.wwebjs_auth/` — do not delete this folder

---

## If the session expires and a new QR is needed

```bash
pm2 stop padel-listener
rm -rf .wwebjs_auth
npm run listener          # QR appears — relay to user to scan
# after "WhatsApp client is ready!" appears:
pm2 restart padel-listener
```
