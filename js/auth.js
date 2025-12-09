// js/auth.js
import { authHelper } from './seller.js'; // seller.js imports auth.js too; to avoid cycles seller calls authCheck directly via window

// fetch and parse authorized.txt
async function fetchAuthorized() {
  const res = await fetch('/authorized.txt', {cache: "no-store"});
  if (!res.ok) throw new Error('authorized.txt not found');
  const txt = await res.text();
  // split into records by blank line groups; robustly handle whitespace
  const groups = txt.split(/\n\s*\n/).map(g => g.trim()).filter(Boolean);
  const records = groups.map(g => {
    const lines = g.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return { name: lines[0]||'', expires: lines[1]||'', code: lines[2]||'' };
  }).filter(r => r.name && r.expires && r.code);
  return records;
}

// exposed function
export async function authCheck(name, code) {
  const records = await fetchAuthorized();
  const n = (name||'').toLowerCase();
  const c = (code||'').toLowerCase();
  const match = records.find(r => r.name.toLowerCase()===n && r.code.toLowerCase()===c);
  if (!match) return { ok:false, reason: 'not-found' };
  // check expiry inclusive
  const today = new Date();
  const exp = new Date(match.expires + 'T23:59:59');
  if (today > exp) return { ok:false, reason:'expired', expires: match.expires };
  return { ok:true, record: match };
}
