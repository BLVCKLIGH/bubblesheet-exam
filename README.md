# Bubblesheet: Online Examination System (Task 4)

A practice-exam website with 6 timed multiple-choice exams (HTML & CSS, JavaScript, Python, South African general knowledge, algebra and computer networks). Users read the instructions, answer against a timer, move between questions, flag questions for review, submit, and get a score with a full answer review.

**Tech:** HTML5, CSS3, vanilla JavaScript, LocalStorage. No frameworks and no build step.

## Brief checklist

| Requirement | Where |
|---|---|
| Homepage: hero, platform introduction, available exams, call-to-action buttons | `index.html` |
| Exam listing: name, subject, duration, total questions, difficulty, start button | `exams.html`, also on the homepage |
| Exam interface: answer MCQs, move between questions, select answers, submit | `exam.html?id=javascript` |
| Results: total score, correct/wrong answers, percentage and summary | `result.html` |
| Timer | Counts down from the exam's duration, turns amber then red, warns at one minute, and submits automatically at 00:00 |
| Responsive design | Tested at 360px, 768px and 1366px |
| Navigation bar and footer with contact/about links | Shared, rendered by `js/common.js` |

Scores are calculated in JavaScript (`finish()` in `js/exam.js`).

## Bonus features included

- **Random question generation**: each exam has a 12-question bank; every attempt draws 10 at random and shuffles the answer order
- **Answer review** with explanations, filterable by all, wrong/skipped and correct
- **Mark for review**: flagged questions show a dot in the answer grid
- **Answer grid** to jump to any question, showing answered, unanswered and flagged
- **Resume after refresh**: the attempt and the timer survive a page reload. If time ran out while the page was closed, the attempt is submitted on the next visit
- **Exam history** with pass/fail, time taken and links back to each review
- **Leaderboard** per exam (best score per person, ties broken by time). It starts with clearly labelled sample scores so it isn't empty
- **Question categories / subjects** with filters by subject, level and status
- **Keyboard shortcuts**: A–D or 1–4 to answer, ← → to move, F to flag
- **Submit confirmation** that warns about unanswered and flagged questions
- **Dark mode**, remembered between visits

## Adding or editing questions

Questions live in `js/data.js`. Each one looks like this:

```js
{ q: "What does `typeof null` return?", o: ["`\"object\"`", "`\"null\"`", "`\"undefined\"`", "`\"number\"`"], a: 0, e: "Explanation shown in the review." }
```

`a` is the index of the correct option. Options are shuffled when the exam starts, so the correct one can always be listed first. Text in backticks is shown as code.

## Folder structure

```
exam/
├── index.html      Homepage
├── exams.html      Exam listing with filters
├── exam.html       Instructions and exam interface (?id=)
├── result.html     Score and answer review (?attempt=)
├── history.html    My results and leaderboard
├── 404.html        Not-found page
├── css/styles.css
├── js/
│   ├── data.js     Exams and question banks
│   ├── common.js   Header, footer, theme, storage, exam cards
│   ├── home.js, exams.js, exam.js, result.js, history.js
└── assets/         Favicon
```

## Design

Based on a paper answer sheet: salmon guide lines, graphite pencil fills and numbered bubbles for answer options and the question grid. Set in Atkinson Hyperlegible Next, a typeface designed for readability, which suits an exam.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy to AWS

### Option A: AWS Amplify Hosting (easiest)

1. Sign in to the AWS Console and open **AWS Amplify**.
2. Choose **Create new app**, then **Deploy without Git**, then **Next**.
3. App name: `bubblesheet-exam`. Branch name: `main`.
4. For **Method**, choose **Drag and drop**, then drop **`bubblesheet-exam.zip`** (this zip, as it is: `index.html` is already at the top level).
5. Choose **Save and deploy**, then open the domain shown on the app's overview page.

Optional custom 404 page: **Hosting → Rewrites and redirects → Manage redirects**, then add source `/<*>`, target `/404.html`, type `404 (Rewrite)`.

To update the site later, zip the files again and drag the zip onto the app's deployment page.

### Option B: Amazon S3 static website (+ CloudFront for HTTPS)

1. Create an S3 bucket, e.g. `bubblesheet-exam-<yourname>`, in a nearby region such as `af-south-1` (Cape Town).
2. Upload the files so `index.html` sits at the top of the bucket. With the AWS CLI, run this from inside the unzipped folder:
   ```bash
   aws s3 sync . s3://bubblesheet-exam-<yourname> --delete --exclude "README.md" --exclude "screenshots/*"
   ```
3. Bucket → **Properties** → **Static website hosting** → Enable. Index document: `index.html`. Error document: `404.html`.
4. Bucket → **Permissions** → turn off **Block all public access**, and add this bucket policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicReadGetObject",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::bubblesheet-exam-<yourname>/*"
     }]
   }
   ```
5. Open the bucket website endpoint shown under Static website hosting (HTTP only). For HTTPS, put a **CloudFront** distribution in front of the bucket, with `index.html` as the default root object.

## Notes

- **No backend:** bookings, orders and results are saved in the visitor's browser with `localStorage`, so they stay on that device only. Sign-in and payment screens are UI only, with no real passwords stored and no payment taken.
- **Images** are original SVG illustrations made for this project. To use real photos, replace the files in `assets/` or change the image paths in `js/data.js`.
- **Screenshots** in `screenshots/` were taken without the Google Fonts loaded, so the lettering on the live site looks a little different.
