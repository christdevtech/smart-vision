# Assessment integrity

Practice assessments use server-owned sessions. The browser is a presentation and answer-entry client, not the source of truth for scoring.

## Request flow

1. `POST /api/custom/tests/start` authenticates the student, verifies an active subscription, derives the academic level from the authenticated user, and validates the chosen subject and topic.
2. The server selects up to 50 valid MCQs and stores their ordered IDs in an owner-bound session that expires after two hours.
3. The response contains question content plus option IDs and text. It never contains `isCorrect` or the explanation field.
4. `POST /api/custom/tests/submit` accepts only the session ID and selected option IDs. It reloads the session and answer key with system access, verifies ownership, expiry, subscription, question membership, and option membership, then calculates the result.
5. The result is uniquely linked to the session. Retrying or racing the same submission returns the already-created result instead of generating a second score or achievement.

## Authoring requirements

Every MCQ must contain three to five unique options with exactly one correct option. Invalid questions are rejected by Payload validation and are also excluded when a session is created as defense in depth.

## Result authority

The server derives the user, academic level, subject, topics, start/completion time, elapsed minutes, attempt number, correct/incorrect/skipped totals, percentage, grade, per-question review, and weak/strong topic areas. Ordinary users cannot create or update `test-results` through Payload REST or GraphQL. Completed results are immutable; administrators may delete a record but cannot rewrite its score.
