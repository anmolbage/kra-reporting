/*  KRA Reporting — Google Sheets backend
 *
 *  1. Create a Google Sheet. Extensions → Apps Script. Paste this whole file.
 *  2. Run setup() once (choose it in the function box, press Run, allow access).
 *     It creates the Entries / Staff / Targets tabs and a first manager row
 *     with a random PIN — read it in the Staff tab and change it if you like.
 *  3. Deploy → New deployment → Web app
 *       Execute as: Me      Who has access: Anyone
 *     Copy the /exec URL into index.html (CFG.ENDPOINT).
 *
 *  After editing this file later: Deploy → Manage deployments → ✎ → Version: New.
 *  (Otherwise the /exec URL keeps running the old code.)
 *
 *  No PINs live in this file. They live in the Staff tab only.
 */

var TABS = {
  Entries: ['Key','Timestamp','Date','Branch','User','GroupID','Group',
            'Parameter','ParamID','Count','Amount'],
  Staff:   ['Name','PIN','Role','Active'],
  Targets: ['Month','ParamID','Parameter','TargetCount','TargetAmount']
};
var MAX_FAILS = 5;          // wrong PINs before a name is locked
var LOCK_SECS = 600;        // …for 10 minutes

/* ================= one-time setup ================= */

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABS).forEach(function (name) { tab(name); });
  ss.getSheetByName('Entries').getRange('C:C').setNumberFormat('@');   // Date as text
  ss.getSheetByName('Staff').getRange('B:B').setNumberFormat('@');     // keep leading zeros
  ss.getSheetByName('Targets').getRange('A:A').setNumberFormat('@');   // Month as text

  var st = ss.getSheetByName('Staff');
  if (st.getLastRow() < 2) {
    var pin = String(Math.floor(1000 + Math.random() * 9000));
    st.appendRow(['Anmol', pin, 'manager', true]);
    Logger.log('First manager: Anmol, PIN ' + pin + ' (change it in the Staff tab).');
  }
  secret();   // create the signing secret now
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
}

/* ================= entry points ================= */

function doGet() {
  return HtmlService.createHtmlOutput(
    '<h3 style="font-family:sans-serif">KRA Reporting endpoint is live.</h3>' +
    '<p style="font-family:sans-serif">Put this page\'s URL into index.html (CFG.ENDPOINT).</p>');
}

function doPost(e) {
  var req;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (x) { return json({ ok: false, error: 'Bad request' }); }

  // Public: the list of names for the sign-in screen. Nothing else.
  if (req.action === 'names') return json({ ok: true, names: activeNames() });
  if (req.action === 'login') return json(login(req));

  var me = auth(req);
  if (!me) return json({ ok: false, auth: true, error: 'Signed out — please sign in again' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    switch (req.action) {
      case 'push':      return json(push(me, req));
      case 'pull':      return json(pull(me, req));
      case 'setTarget': return json(mgr(me) || setTarget(req));
      case 'addParam':  return json(mgr(me) || addParam(req));
      case 'staff':     return json(mgr(me) || staffList());
      case 'saveStaff': return json(mgr(me) || saveStaff(me, req));
    }
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/* ================= auth ================= */

// A session token is HMAC(name|PIN) with a secret only this script knows.
// Changing someone's PIN or setting Active = FALSE ends their session at once.

function secret() {
  var p = PropertiesService.getScriptProperties();
  var s = p.getProperty('SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SECRET', s); }
  return s;
}

function sign(name, pin) {
  var raw = Utilities.computeHmacSha256Signature(name + '|' + pin, secret());
  return Utilities.base64EncodeWebSafe(raw);
}

function staffRows() {
  var sh = tab('Staff'), last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 4).getValues().map(function (r, i) {
    return { row: i + 2, name: String(r[0]).trim(), pin: String(r[1]).trim(),
             role: String(r[2]).trim().toLowerCase() === 'manager' ? 'manager' : 'staff',
             active: r[3] === true || String(r[3]).toUpperCase() === 'TRUE' };
  }).filter(function (s) { return s.name; });
}

function findStaff(name) {
  var n = String(name || '').trim().toLowerCase();
  var all = staffRows();
  for (var i = 0; i < all.length; i++) if (all[i].name.toLowerCase() === n) return all[i];
  return null;
}

function activeNames() {
  return staffRows().filter(function (s) { return s.active && s.pin; })
    .map(function (s) { return s.name; }).sort();
}

function login(req) {
  var s = findStaff(req.name);
  var cache = CacheService.getScriptCache();
  var ck = 'fail:' + String(req.name || '').trim().toLowerCase();
  var fails = Number(cache.get(ck) || 0);
  if (fails >= MAX_FAILS) return { ok: false, error: 'Too many wrong PINs — try again in 10 minutes' };

  if (!s || !s.active || !s.pin || String(req.pin || '').trim() !== s.pin) {
    cache.put(ck, String(fails + 1), LOCK_SECS);
    return { ok: false, error: 'Name or PIN not recognised' };
  }
  cache.remove(ck);
  return { ok: true, user: s.name, role: s.role, token: sign(s.name, s.pin) };
}

function auth(req) {
  var s = findStaff(req.user);
  if (!s || !s.active || !s.pin || !req.token) return null;
  return sign(s.name, s.pin) === req.token ? s : null;
}

function mgr(me) {
  return me.role === 'manager' ? null : { ok: false, error: 'Managers only' };
}

/* ================= helpers ================= */

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function tab(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(TABS[name]); sh.setFrozenRows(1); }
  return sh;
}

function body(sh, width) {
  var last = sh.getLastRow();
  return last > 1 ? sh.getRange(2, 1, last - 1, width).getValues() : [];
}

function tz() { return Session.getScriptTimeZone(); }

function iso(v) {        // Date column → 'yyyy-mm-dd' whatever Sheets did to it
  if (v instanceof Date) return Utilities.formatDate(v, tz(), 'yyyy-MM-dd');
  return String(v == null ? '' : v).trim();
}

function month(v) {      // Month column → 'yyyy-mm'
  if (v instanceof Date) return Utilities.formatDate(v, tz(), 'yyyy-MM');
  return String(v == null ? '' : v).trim().slice(0, 7);
}

function num(v) { return (v === '' || v == null || isNaN(Number(v))) ? '' : Number(v); }

/* ================= push: replace my rows for one date ================= */

function push(me, req) {
  var date = iso(req.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: 'Bad date' };

  var sh = tab('Entries'), W = TABS.Entries.length, user = me.name;
  var keep = body(sh, W).filter(function (r) {
    return !(iso(r[2]) === date && String(r[4]).trim().toLowerCase() === user.toLowerCase());
  });

  var now = new Date(), add = [];
  (req.items || []).forEach(function (it) {
    var c = num(it.c), a = num(it.a);
    if (c === '' && a === '') return;
    add.push([date + '|' + user + '|' + it.pid, now, date, req.branch || '', user,
              it.gid || '', it.gname || '', it.pname || '', it.pid, c, a]);
  });

  var out = keep.concat(add), last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, W).clearContent();
  if (out.length) {
    sh.getRange(2, 3, out.length, 1).setNumberFormat('@');
    sh.getRange(2, 1, out.length, W).setValues(out);
  }
  return { ok: true, saved: add.length };
}

/* ================= pull: everyone's rows + targets for one month ================= */

function pull(me, req) {
  var m = String(req.month || '').slice(0, 7), rows = [];
  body(tab('Entries'), TABS.Entries.length).forEach(function (r) {
    var d = iso(r[2]);
    if (!d || (m && d.indexOf(m) !== 0)) return;
    rows.push([d, r[3], String(r[4]).trim(), r[5], r[6], r[7], r[8], num(r[9]), num(r[10])]);
  });

  var targets = {};
  body(tab('Targets'), TABS.Targets.length).forEach(function (r) {
    if (month(r[0]) !== m || !r[1]) return;
    targets[String(r[1]).trim()] = { c: num(r[3]), a: num(r[4]) };
  });

  return { ok: true, rows: rows, targets: targets, custom: customParams(),
           user: me.name, role: me.role, at: new Date().toISOString() };
}

/* ================= manager: targets ================= */

function setTarget(req) {
  var m = String(req.month || '').slice(0, 7), pid = String(req.pid || '').trim();
  if (!/^\d{4}-\d{2}$/.test(m) || !pid) return { ok: false, error: 'Missing month or parameter' };
  var sh = tab('Targets'), rows = body(sh, TABS.Targets.length);
  var c = num(req.c), a = num(req.a), clear = (c === '' && a === '');

  for (var i = 0; i < rows.length; i++) {
    if (month(rows[i][0]) === m && String(rows[i][1]).trim() === pid) {
      if (clear) sh.deleteRow(i + 2);
      else sh.getRange(i + 2, 3, 1, 3).setValues([[req.pname || pid, c, a]]);
      return { ok: true };
    }
  }
  if (!clear) {
    var r = sh.getLastRow() + 1;
    sh.getRange(r, 1).setNumberFormat('@');
    sh.getRange(r, 1, 1, 5).setValues([[m, pid, req.pname || pid, c, a]]);
  }
  return { ok: true };
}

/* ================= manager: extra parameters ================= */
// Kept in Script Properties so every phone sees them. Ids never change.

function customParams() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('CUSTOM') || '[]'); }
  catch (x) { return []; }
}

function addParam(req) {
  var n = String(req.name || '').trim();
  var g = String(req.group || '').trim();
  var m = ['both', 'count', 'amount'].indexOf(req.mode) >= 0 ? req.mode : 'both';
  if (!n || !g) return { ok: false, error: 'Missing name or group' };
  var list = customParams();
  list.push({ id: 'x_' + Date.now().toString(36), g: g, n: n, m: m });
  PropertiesService.getScriptProperties().setProperty('CUSTOM', JSON.stringify(list));
  return { ok: true, custom: list };
}

/* ================= manager: staff ================= */

// Managers only (checked in doPost): includes PINs so the manager can hand out logins.
function staffList() {
  return { ok: true, staff: staffRows().map(function (s) {
    return { name: s.name, pin: s.pin, role: s.role, active: s.active };
  }) };
}

function saveStaff(me, req) {
  var name = String(req.name || '').trim();
  if (!name) return { ok: false, error: 'Name required' };
  var pin = req.pin == null ? null : String(req.pin).trim();
  if (pin !== null && pin !== '' && !/^\d{4,8}$/.test(pin))
    return { ok: false, error: 'PIN must be 4–8 digits' };
  var role = req.role === 'manager' ? 'manager' : 'staff';
  var active = req.active !== false;

  var sh = tab('Staff'), s = findStaff(name);
  if (s && s.name.toLowerCase() === me.name.toLowerCase() && (!active || role !== 'manager'))
    return { ok: false, error: 'You cannot demote or deactivate yourself' };

  if (s) {
    sh.getRange(s.row, 3, 1, 2).setValues([[role, active]]);
    if (pin) sh.getRange(s.row, 2).setNumberFormat('@').setValue(pin);
  } else {
    if (!pin) return { ok: false, error: 'New staff need a PIN' };
    var r = sh.getLastRow() + 1;
    sh.getRange(r, 2).setNumberFormat('@');
    sh.getRange(r, 1, 1, 4).setValues([[name, pin, role, active]]);
  }
  return staffList();
}
