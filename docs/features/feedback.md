# Driver Feedback

After a completed parking session, the driver can leave a 1–5 star rating with an
optional comment. One feedback per session (enforced by a unique constraint on
`session_id`).

## Flow

1. Driver completes a parking session (status = COMPLETED, payment settled).
2. On the session history page, driver clicks **Rate** → selects stars, writes comment.
3. Backend validates: session must be COMPLETED, must belong to the driver, no
   duplicate feedback.
4. Manager views all feedback on the analytics / reports screen.

## API

- `POST /api/driver/feedback` — body: `{ sessionId, rating, comment? }`
- `GET /api/driver/feedback` — driver's own feedback history
- `GET /api/manager/feedback` — all feedback (newest first)

## Data Model

```
feedback
├── id          PK
├── session_id  FK → parking_session (UNIQUE)
├── user_id     FK → users
├── rating      SMALLINT (1–5, CHECK constraint)
└── comment     VARCHAR(500)
└── created_at  TIMESTAMPTZ
```

## Demo Data

12 feedback entries seeded with ratings 2–5 and realistic comments about parking
experience, staff helpfulness, and facility cleanliness.

## Implementation Files

| Layer | File | Purpose |
|-------|------|---------|
| Service | `feedback/FeedbackService.java` | `create()`, `listByDriver()`, `listAll()` |
| Controller | `feedback/DriverFeedbackController.java` | `POST/GET /api/driver/feedback` |
| Controller | `feedback/ManagerFeedbackController.java` | `GET /api/manager/feedback` |
| Entity | `feedback/Feedback.java` | `rating` (1-5 CHECK), `comment`, UNIQUE on `session_id` |
| Frontend | `pages/system/FeedbackPage.jsx` | Manager: all feedback list |
| Frontend | `pages/user/MySessionsPage.jsx` | Driver: "Rate" button on completed sessions |

## Slide Notes

- **One-liner**: "1-5 star rating per completed session — one feedback per session enforced by DB constraint."

