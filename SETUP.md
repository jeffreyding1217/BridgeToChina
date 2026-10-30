# Bridge to China — START HERE

You only ever do these 5 things. Each one is copy → paste → click.

## 1. Put the website files online
Unzip this folder on your computer. Upload EVERYTHING inside it to your GitHub repository
(replace the old files) and click "Commit changes". Wait 1–2 minutes.
Your site: https://jeffreyding1217.github.io/BridgeToChina/

## 2. Set up the database  (file: 1-database-setup.sql)
Supabase → SQL Editor → New query → paste the whole file → Run.
Safe to repeat any time you get a new version.

## 3. Turn on email alerts  (file: 2-email-alerts.sql)
Paste it into a new query, replace the Resend-key placeholder near the bottom with your real
Resend key (starts with re_), then Run. A test email is sent to jeffreyding1217@gmail.com.
Never save the key in a file or put it on GitHub.

## 4. Make yourself an admin  (file: 3-make-me-admin.sql)
First sign up on the website with jeffreyding1217@gmail.com and click the verification link.
Then paste file 3 into a new query and Run. The result says in plain English whether it worked.

## 5. Supabase email settings (once)
Authentication → URL Configuration:
- Site URL: https://jeffreyding1217.github.io/BridgeToChina/
- Redirect URLs → Add: https://jeffreyding1217.github.io/BridgeToChina/**
Also copy the file supabase.js next to your pages if students in China will use the site
(see "Students in China" below).

---
## How an application gets reviewed
1. Applicant presses Submit → you get an email with a link to that person.
2. Click it, log in, read their answers, play their recordings, enter writing + speaking scores.
3. Click Approve / Needs Additional Training / Not Approved. They see the new status on their dashboard.
4. Under-18s: confirm with the parent/guardian by email before approving.

## Students in China (important)
- Download https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js , save it as
  `supabase.js`, and upload it next to your pages (a public CDN may be slow or blocked in China).
- Test sign-up from a phone inside mainland China before you launch. I could not verify Supabase is reliably reachable there.
- Supabase's built-in email sender is only for testing and verification emails often don't reach
  QQ/163 mailboxes. Before launch connect your own email service (Supabase → Authentication → SMTP).

## Before you launch — please review
- `orientation.html` contains DRAFT safety text. Replace anything that doesn't match your real policies.
- Volunteers can be 13+ (under 18 need a parent/guardian's permission). A tick-box is not verified consent;
  the admin page reminds you to confirm by email. Get advice on children's-data rules (including China's).
- Emailing applicants when you approve/decline needs a domain you own (see the comments in file 2).

## What's real vs. not yet built
Real: sign-up, email verification, application wizards for volunteers and students, English + Chinese
assessments, orientation, availability, admin review, email alerts to you.
Not yet built: matching students with volunteers, lesson scheduling, real hours tracking/certificates,
profile photo upload, server-side grading.
