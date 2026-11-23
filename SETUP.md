# Bridge to China — START HERE

You only ever do these 5 things. Each one is copy → paste → click.

## 1. Put the website files online
Unzip this folder on your computer. Upload EVERYTHING inside it to your GitHub repository
(replace the old files) and click "Commit changes". Wait 1–2 minutes.
Your site: https://jeffreyding1217.github.io/BridgeToChina/

## 2. Set up the database  (QUERY 1 in SQL-EDITOR-QUERIES.md)
Supabase → SQL Editor → New query → paste QUERY 1 → Run.
Safe to repeat any time you get a new version.

## 3. Turn on email alerts  (QUERY 2 in SQL-EDITOR-QUERIES.md)
Paste QUERY 2 into a new query, replace the Resend-key placeholder near the bottom with your real
Resend key (starts with re_), then Run. A test email is sent to jeffreyding1217@gmail.com.
Never save the key in a file or put it on GitHub.

## 4. Make yourself an admin  (QUERY 3 in SQL-EDITOR-QUERIES.md)
First sign up on the website with jeffreyding1217@gmail.com and click the verification link.
Then paste QUERY 3 into a new query and Run. The result says in plain English whether it worked.

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

## Matching students and volunteers

1. In the Supabase SQL Editor, run **QUERY 6** from `SQL-EDITOR-QUERIES.md` (creates the `matches` table and the `my_matches` / `update_my_match` functions).
2. Upload the updated files to GitHub.
3. Sign in as admin, open **Admin → Matches**, and pair an approved student with an approved volunteer.
4. Tell both people they have been matched. There is no automatic email for this yet. They will see each other on their dashboards.
5. The volunteer adds the VooV link, meeting ID, password and lesson time on their dashboard; the student then sees a Join button.

Dashboards show only real data. With no matches they show an empty state.

## Lessons, hours, certificates and messages

1. Run **QUERY 7** from `SQL-EDITOR-QUERIES.md` (after QUERY 6).
2. Upload the new/updated files: `chat.js`, `certificate.html`, `admin.html`, `volunteer-dashboard.html`, `student-dashboard.html`.
3. Volunteers submit a report after each lesson (dashboard → their student's card). You approve it in **Admin → Hours**; only approved hours count.
4. The volunteer's certificate page (`certificate.html`) shows only approved hours and prints / saves as PDF.
5. Matched pairs can message each other on their dashboards. You can read every conversation in **Admin → Matches → open a match**. For under-18 students, emails, phone numbers and links are blocked.

Still not built: automatic email reminders/notifications, profile photo upload, server-side grading of assessments.

## Lessons

The Lesson Library has 120 topics plus Lesson 0 (welcome and level check): Beginner 1–20 and 61–90, Intermediate 21–40 and 91–120, Advanced 41–60. Every lesson follows the same 30 minutes: plan, warm-up, vocabulary (with Chinese), language focus with common mistakes, practice sentences (teacher can show answers), speaking roleplay, game, and review/homework. The older Word and PowerPoint templates were removed because they no longer match.

## Public website pages

The site is now separate pages: `index.html` (home), `about.html`, `how-it-works.html`, `volunteers.html`, `students.html`, `curriculum.html`, `faq.html`, `contact.html`. They share `site.css` and `site.js`, so upload those too. All made-up examples, statistics, testimonials, sample profiles and fake social links were removed.

- **Contact page:** open `contact.html` and put your public email between the quotes in `var CONTACT_EMAIL = "";`. Until you do, it says the contact address has not been added.
- **Not written yet:** Privacy Policy and Terms of Service pages. They are not linked anywhere. Because you collect personal information, including from minors, have these written and reviewed properly before launch.

## Chinese in lessons

Beginner (1–20): Chinese vocabulary, plus Chinese explanations of the language focus. Intermediate and Advanced: Chinese is hidden. The teacher can click "Show Chinese · 显示中文" on the vocabulary slide if needed.

## English and Chinese versions (split)

The site now has two complete versions instead of mixed pages:

- **English** (volunteers): the pages in the main folder (`index.html`, `about.html`, …). The nav has a **中文** button.
- **Chinese** (students): the pages in the `zh/` folder (`zh/index.html`, …). The nav has an **English** button. Student sign-up and login links from these pages open the student login in Chinese.
- **Student accounts**: `login.html` (Student tab), `confirmed.html`, `student-application.html`, `student-placement.html` and `student-dashboard.html` all display in Chinese only. `lang.js` removes the English half of the old "English · 中文" strings, so the pages read as Chinese only. Add `?lang=en` to a student page's address to see the English version. Volunteer pages stay in English.
- The English placement-test questions, lesson slides and anything typed by users (names, bios, lesson topics) stay in English on purpose: students are learning English.
- **To change Chinese text**: public pages are generated by `gen_zh.py` (the 60 curriculum titles are in `zh/titles_zh.py`); student pages hold their Chinese text in the page itself. All Chinese was written by Claude, not a translator. **Have a native Chinese speaker read it before launch.**
- Not translated: `admin.html` (English, for the site owner) and the approval emails, which stay bilingual.


The lessons 61–120 were also written by Claude (including Chinese glosses and answer keys) and should be read by a fluent English speaker before you rely on them.
