/**
 * Real WhatsApp message samples from padel groups in Berlin.
 * Used as test fixtures for parser modules.
 */

export const formatA1 = `*MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG*

 📅 Tuesday 10, 13:30 (90min)
 📍 Berlin
 📊 Level 1.39 - 2.39
 ✅ Zain Salman Dar (1.6)
 ⚪ ??
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/cWBx3ut8`;

export const formatA2 = `*MATCH IN PADEL FC*
Tomorrow 11:30

 📅 Dienstag 03., 11:30 (90min)
 📍 Berlin
 📊 Level 0.56 - 1.56
 ✅ Milan Schock (0,8
 ✅ Torben Schäfer (1,4
 ✅ Niklas (1,3
 ⚪ ??
https://app.playtomic.io/t/HIqdkrnm`;

export const formatA3 = `*MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG*

One free spot :)

 📅 Montag, 09., 13:00 (90min)
 📍 Berlin
 📊 Level 1.56 - 2.56
 ✅ Lukas Bohnert (1,8)
 ✅ Philipp (2,8)
 ✅ ST (1,9)
 ⚪ ??
https://app.playtomic.io/t/I13xyOso`;

export const formatA4 = `*MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG*

 📅 Thursday 05, 10:30 (90min)
 📍 Berlin
 📊 Level 1.8 - 2.8
 🚻 Mixed
 ✅ Nikki D (2
 ⚪ ??
 ✅ Rebecca  (2.6
 ✅ Sebastian (1.9
https://app.playtomic.io/t/g3igercb`;

export const formatA5 = `*Padel Mitte*

 📅 Donnerstag 12, 18:00 (60min)
 📍 Padzone Berlin
 📊 Level 1,5 - 2,5
 🚻 Open
 ✅ Max (1,8
 ✅ Julia (2,2
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/abc123xyz`;

export const formatB1 = `Signup!
Activity type: Padel class
Date and time: Tuesday, March 03, 10:00 am
Duration: 60 min
Level: 0 - 1.5
Category: Open

Download Playtomic and reserve and join sports activities at the best clubs:
https://playtomic.io/

Signup -> https://app.playtomic.io/lesson_class/6c3522b9-843c-4bc4-9cac-a725e076ba09?utm_source=app_android&utm_campaign=share`;

export const formatC1 = `Looking for a 4th player Tuesday at Padel Berlin`;

export const noPlaytomicLink = `Hey anyone want to play padel tomorrow?`;

// ── Add-match scenarios ───────────────────────────────────────────────────────

/** German date, comma decimals, unclosed parens — the exact message from the app demo */
export const addMatchTypical = `*MATCH IN PADELHAUS GMBH*

 📅 Mittwoch 04., 09:00 (90min)
 📍 Berlin
 📊 Level 1,5 - 2,5
 ✅ Michael Reimer (2,5
 ✅ Jonas Bauer (2,0
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/xYz789ab`;

/** PARTIDO EN prefix (Spanish), padelhaus spelling variant */
export const addMatchSpanishPrefix = `*PARTIDO EN PADEL FC*

 📅 Jueves 05., 18:00 (90min)
 📍 Berlin
 📊 Level 2.0 - 3.0
 ✅ Carlos (2,5
 ⚪ ??
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/es111aaaa`;

/** GAME IN prefix, PBC Center venue */
export const addMatchPBC = `*GAME IN PBC CENTER*

 📅 Friday 06., 20:00 (90min)
 📍 Berlin
 📊 Level 1.8 - 2.8
 🚻 Mixed
 ✅ Anna (2,0
 ✅ Tom (2,2
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/pbc222bbb`;

/** GAME IN TIO TIO ROOFTOP venue */
export const addMatchTioTio = `*GAME IN TIO TIO ROOFTOP*

 📅 Saturday 07., 11:00 (60min)
 📍 Berlin
 📊 Level 0.5 - 1.5
 🚻 Women
 ✅ Sara (1,0
 ⚪ ??
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/tio333ccc`;

/** Charlotte / Charlottenburg venue variant */
export const addMatchCharlotte = `*MATCH IN MITTE — CHARLOTTENBURG*

 📅 Sunday 08., 14:00 (90min)
 📍 Berlin
 📊 Level 1.0 - 2.0
 ✅ Felix (1,5
 ✅ Laura (1,8
 ✅ Mark (1,6
 ⚪ ??
https://app.playtomic.io/t/cha444ddd`;

/** Missing playtomic link — should return null */
export const addMatchNoLink = `*MATCH IN PADEL FC*

 📅 Monday 09., 10:00 (90min)
 📍 Berlin
 📊 Level 1.0 - 2.0
 ✅ Someone (1,5
 ⚪ ??
 ⚪ ??
 ⚪ ??`;

/** Has playtomic link but cannot be parsed (no date line) */
export const addMatchUnparseable = `Some random message
https://app.playtomic.io/t/noParse1`;

/** Women category */
export const addMatchWomen = `*MATCH IN PADELHAUS GMBH*

 📅 Dienstag 03., 08:00 (90min)
 📍 Berlin
 📊 Level 1.0 - 2.0
 🚻 Women
 ✅ Katrin (1,5
 ⚪ ??
 ⚪ ??
 ⚪ ??
https://app.playtomic.io/t/wom555eee`;
