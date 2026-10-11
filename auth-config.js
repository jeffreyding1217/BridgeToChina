/* ======================================================================
   Bridge to China — Supabase connection
   ======================================================================
   This is the ONLY file that holds your connection settings.
   Every page loads it, so you only ever update your keys here.

   SUPABASE_URL      = Project Settings → API → "Project URL"
                       (just https://xxxx.supabase.co — nothing after .co)
   SUPABASE_ANON_KEY = the "anon" / "publishable" public key.
                       NEVER put a "service_role" or "secret" key here.
                       (The anon key is meant to be public — your database's
                       security rules decide what it can do.)
   ====================================================================== */

const SUPABASE_URL = "https://tihgzwxgplfbmquwwhra.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpaGd6d3hncGxmYm1xdXd3aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1ODY3NzEsImV4cCI6MjEwNzE2Mjc3MX0.0XPrDvw_wfB4mJ-b-SPAaUqazJYVm555pUQykuDDgy4";

// ---- Checks the two values above and explains exactly what's wrong, if anything ----
function diagnoseConfig() {
  const u = String(SUPABASE_URL || "").trim();
  const k = String(SUPABASE_ANON_KEY || "").trim();
  if (u.startsWith("YOUR_") || k.startsWith("YOUR_")) {
    return "auth-config.js still contains the placeholder text (YOUR_SUPABASE_...). Paste in your real Project URL and public key, save, and upload the file to your site again.";
  }
  if (!u.startsWith("https://")) {
    return "SUPABASE_URL must start with https:// and look like https://abcdxyz.supabase.co — check for a missing https://, a stray space, or missing quotation marks.";
  }
  if (k.startsWith("sb_secret_")) {
    return "STOP: that is a SECRET key. Never put it on a website. Use the 'anon' or 'publishable' key instead, and rotate the secret key in Supabase (Project Settings → API Keys) because it was exposed.";
  }
  try {
    const parts = k.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role === "service_role") {
        return "STOP: that is the service_role (secret) key. Never put it on a website. Use the 'anon' key instead, and rotate the service_role key in Supabase (Project Settings → API Keys) because it was exposed.";
      }
    }
  } catch (e) { /* not a JWT-style key; fine */ }
  if (k.length <= 20) {
    return "SUPABASE_ANON_KEY looks too short. Copy the full 'anon' or 'publishable' key from Supabase → Project Settings → API.";
  }
  return "";
}

// If someone pastes ".../rest/v1/" (a common slip), keep only the base address.
function cleanUrl(u) {
  try { return new URL(String(u).trim()).origin; } catch (e) { return String(u).trim(); }
}

const configProblem = diagnoseConfig();
const isConfigured = configProblem === "";

let supabaseClient = null;
if (isConfigured) {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(cleanUrl(SUPABASE_URL), SUPABASE_ANON_KEY.trim());
  } else {
    console.error("The Supabase library did not load. Add supabase.js next to your pages (see SETUP.md) or check your internet connection.");
  }
}
