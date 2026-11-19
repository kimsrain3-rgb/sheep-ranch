CREATE TABLE haru_topics (
  id INTEGER PRIMARY KEY,
  summary TEXT NOT NULL UNIQUE,
  answer TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'question' CHECK(kind IN ('question','planned','observed'))
);
--> statement-breakpoint
CREATE TABLE haru_mentions (
  event TEXT PRIMARY KEY,
  topic INTEGER NOT NULL REFERENCES haru_topics(id)
);
--> statement-breakpoint
CREATE INDEX haru_mentions_topic ON haru_mentions(topic);
