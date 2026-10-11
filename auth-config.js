/* ======================================================================
   Bridge to China — Supabase connection
   ======================================================================
   This is the ONLY file you need to edit to turn on real accounts.

   1. Go to https://supabase.com and create a free project.
   2. In your project: Settings → API.
   3. Copy "Project URL" and paste it below as SUPABASE_URL.
   4. Copy the "anon public" key and paste it below as SUPABASE_ANON_KEY.
      (This key is MEANT to be public / visible in website code — it only
      allows what your Row Level Security rules permit, which is why the
      schema file restricts every volunteer to their own row.)
   5. In Supabase: SQL Editor → paste the contents of supabase-schema.sql
      → Run. This creates the profiles table.
   6. (Recommended for now) Authentication → Providers → Email →
      turn OFF "Confirm email", so new volunteers can log in immediately
      without waiting on a confirmation email. You can turn this back on
      later once you've set up a "from" email address.

   Every page loads this file, so
   you only ever update your keys in one place.
   ====================================================================== */

const SUPABASE_URL = "https://tihgzwxgplfbmquwwhra.supabase.co/rest/v1";      // e.g. "https://abcdxyz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpaGd6d3hncGxmYm1xdXd3aHJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1ODY3NzEsImV4cCI6MjEwNzE2Mjc3MX0.0XPrDvw_wfB4mJ-b-SPAaUqazJYVm555pUQykuDDgy4";     // the long "anon public" key

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

const configProblem = diagnoseConfig();
const isConfigured = configProblem === "";

let supabaseClient = null;
if (isConfigured) {
  if (window.supabase && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());
  } else {
    console.error("The Supabase library did not load. Add supabase.js next to your pages (see SETUP.md) or check your internet connection.");
  }
}
