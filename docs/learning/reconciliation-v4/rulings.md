# The v4 reconciliation: the rulings, word for word

**Decided by:** Umer, with Habiba and Mubeen (the designer), at one table.
**Rulings collected:** 2026-11-13; follow-up answers 2026-11-18.
**Against:** the designer's v4 delivery, `designs/AIJournal-v4/` (30 October
2026), and the locked feature list of 2026-10-10.

**What this file is.** The record of every ruling, as Umer sent it, so that
each line of the new `docs/features.md` can be traced back to a decision. The
table the rulings answer had 47 rows, each with what was locked, what v4
showed, what it meant and the Master Thread's suggestion; seven follow-up
questions closed the gaps the rulings left. "Take the suggestion" means the
suggestion printed on that row, which is summarised in brackets.

The resulting scope is `docs/features.md`; the order is `docs/roadmap.md`;
what the designer is asked for is `docs/design-asks-v4.md`.

## The suggestions that "take the suggestion" refers to

| Row | Suggestion taken |
|---|---|
| 2 | Drafts are kept in the browser only and cleared on sign-out; Ref 12 changes to match |
| 5 | The mood graph is allowed as a named exception; mood charts stay out of scope otherwise |
| 6 | Timeline takes the new design and Ref 17 becomes "today and past days" |
| 9, 10 | Keep the password to delete the account, and the new password typed twice; the designer adds both |
| 11 | Keep Ask's saved sessions and History |
| 12 | Keep Copy and Bookmarks |
| 13 | Keep the thumbs, stored on the account, never sent to a model |
| 14 | Weekly reflections only; every number computed by code, never by a model |
| 15 | Monday to Sunday in the person's timezone, written after the week ends; no reflection for an empty week; a short one for a thin week |
| 17 | Ask reads entries and transcripts only |
| 18 | Skeletons, built with the redraw; ADR-021 notes the change |
| 19 | Live counts on What it sees, built with Ask |
| 20 | Saved reflections and answers stay as written, are never sent to a model again, and stop linking to a deleted entry |
| 21 | Export includes reflections and Ask conversations (JSON and PDF), not ratings; every new table joins the account deletion |
| 22 | A memo kept out of memory is not transcribed; it is transcribed if later put in memory |
| 24 | Kept-out entries are left out of every number in Reflections |
| 25 to 31, 33 | Confirmed as v4 shows them |
| 34 | Rebuild the screens on reusable components, bottom up, mirroring the designer's layers, as one feature, first |
| 36 | Behaviour is rewritten in React; the designer's scripts are never run |
| 38 | The two known layout bugs are checked and fixed during the redraw |
| 39 | Habiba learns reusable components on one complete example; workers do the rest |
| 40 | The v3 folder is removed after the redraw merges; a short list of design asks replaces the old handover |
| 42 | One simple public page |
| 43 | Public and private routes are kept apart, with a Next.js route group each |
| 45 | The suggested order of work |
| 47 | The AI provider and the embedding model stay open |

## The rulings, as sent

```text
v4 reconciliation rulings
1. The AI note under each entry: postpone | Note: For now dropping, In future could be considered.
2. Written drafts: take the suggestion
3. Entries and memos that fail to send: decide differently | Note: No, we will send the api req as soon as save button is clicked, the text or memo whatever it is, it stays as the new draft status( which means the text stays in the box where its written) and the save button turns in to some sort of a loader animation. and once its saved correctly, then we move it to the entries. otherwise we show an error in an error box or something (this will be desinged by designer).
4. The voice memo draft: decide differently | Note: we will keep it as it is today. like we record it, we can pause it, we can resume, but if we refersh the page, then the recording is lost and user records a new recording.
5. Mood graph on Timeline: take the suggestion
6. Timeline's list and calendar: take the suggestion | Note: this is a feature change. we will use this new idea of timeline. one thing though, we cannot edit entries in timeline. we can only delete it.
7. The past-day page: how do people reach it?: decide differently | Note: The timeline is totally redesinged. we will go with new flow and UI UX.
8. Name at sign-up: decide differently | Note: We will keep the name as we have currently. designer will add it as well.
9. Password to delete the account: take the suggestion | Note: yes we keep the passoword. desinger will add it.
10. New password typed twice: take the suggestion | Note: Yes keep it. desinger will add it.
11. Ask: saved sessions and History: take the suggestion | Note: This is a new feature. we will develop according to new designs.
12. Ask: Bookmarks and Copy: take the suggestion | Note: This is a new feature. we will develop according to new designs. however we discuss on actual BE implementation as to what approaches we can take for it.
13. Thumbs up and down, and “What was wrong?”: take the suggestion | Note: we will save it. and in future we can maybe design a feature which might use it. its fre data for now.
14. Reflections as a weekly booklet: take the suggestion | Note: This is a new feature. we will develop according to new designs.
15. When a reflection is written: take the suggestion
16. Overview on Today, and its nudge: decide differently | Note: We wont be keeping this at all. no nudge no redirct. user can directly go to reflections.
17. Ask reads reflections as well as entries: take the suggestion | Note: yes we keep entries and transcriptions only. not the reflections.
18. Skeleton loading screens: take the suggestion | Note: This is a new feature. we will develop according to new designs.
19. “What it sees” shows live counts: take the suggestion
20. Saved AI text after an entry is deleted: take the suggestion
21. Export and deleting the new data: take the suggestion
22. Is a memo kept out of memory transcribed?: take the suggestion
23. Kept-out entries and search by meaning: postpone | Note: This is sort of thing we need more discussions to decide. we can discuss on it. and see what we can do.
24. Do kept-out entries count in Reflections' numbers?: take the suggestion
25. Search lives on Timeline: take the suggestion
26. Calendar with month and year wheels: take the suggestion
27. One-way memory and its display: take the suggestion
28. Five menu items: take the suggestion
29. Our handover requests, delivered: take the suggestion | Note: ratelimit error can be shown with the error modal which is yet to be designed.
30. Sign-in wording and small form changes: take the suggestion
31. Recorder shows the day, not a time: take the suggestion
32. Sample words to rewrite later: postpone | Note: we will make new privacy policy and support words after app is developed. for now the design has placeholder text. not final text.
33. Old parts of the designer's documents: take the suggestion
34. Rebuild the screens on reusable components: take the suggestion
35. Which modules get built now: decide differently | Note: Since we have decided above that we will create fresh built from bottom up, we can start creating things feature by feature. so already built things, we can go ahead and redevelop them first and them to feature by feature.
36. The designer's scripts: take the suggestion | Note: Yes, our code will be react/nextjs.
37. Which stylesheet the app uses: decide differently | Note: designer is saying everything should be there in the new css. if anything is missing in new one, then tell and we can check. priority is to new one.
38. Known layout bugs: take the suggestion | Note: fix them when redrawing.
39. How Habiba learns during the redraw: take the suggestion | Note: yes go through it once. but once only though. keep it to a day of work for learning this max.
40. Retiring v3 and the old handover: take the suggestion | Note: yes v3 is totally legacy. remove its traces everywhere. everything should point to v4 now.
41. The product's name: decide differently | Note: we will come up with a name and buy a domain. for now we have another domain and for testing we can use a subdomain of that domain. once we decide name and buy a domain for this product, we will shift to it.
42. A public page saying what the product is: take the suggestion | Note: yes the simple page will be designed and developed by the designer and that page will be ai and llm and search engine friendlt. this app login and registration page should be llm, ai and search engine friendly.
43. Public and private routes kept apart: take the suggestion
44. The rest of findability: postpone | Note: again this can be done after domain so for now we can postpone this.
45. The order of work: take the suggestion
46. The domain and feature 8: decide differently | Note: again as i said before, this can be done for now with the subdomain of another domain we have, once we buy it we shift
47. AI provider and embedding model: take the suggestion | Note: yes this is open for now, we will research on this and see what is cheap and provides us good quality.
```

## The follow-up questions

| Q | Option A | Option B |
|---|---|---|
| 1 | Keep the past-day page, opened from a day's date in the Timeline; editing and old moods happen there | No past-day page; old entries can never be edited, and only today's mood can be set or changed |
| 2 | After Stop and keep, the memo waits on the recorder with a loader and moves to Today once saved; a failure shows the error box and Try again there | The memo goes to Today at once, with a loader on its row |
| 3 | Leaving while recording asks "Keep this memo?" with Keep and Discard | Leaving stops and keeps, as today; a failed upload shows on Today |
| 4 | Unbuilt features are not drawn and have no menu item; the menu grows as features ship | All five menu items from the start, with "not built yet" pages |
| 5 | `dist/system.css`, copied in and never edited, additions in `live.css` | v4's `lock.css` |
| 6 | Going live right after the redraw | After Looking back, before the first AI feature |
| 7 | Delete the v3 folder and the old handover after the redraw merges; current documents point at v4 now; ADRs and reports stay as history | Also edit ADRs and reports |

```text
v4 follow-up answers
Q1. Where are old entries edited, and old moods changed?: Option B | Note: there is no past day page anymore. the timeline displays like a week of journal entries, the calender on right can be opened. date can be clicked and it scrolls to the entries of that page. older entries would require an api call to fetch older data but on FE we still show on same page and listed in same page.
Q2. Where does a voice memo wait while it uploads?: Option A
Q3. What happens when someone leaves the recorder mid-recording?: Option A
Q4. What do unbuilt features show during the redraw?: Option A
Q5. Which file is “the new CSS”?: Option A
Q6. When does going live (feature 8) happen?: Option A
Q7. What does “remove every trace of v3” cover?: Option A```

## What the follow-ups left open

Q1 also asked whether a Timeline row keeps **Use in memory**. The answer
chose Option B and did not say. It is listed as open in `features.md`, to be
decided when feature 14 opens.
