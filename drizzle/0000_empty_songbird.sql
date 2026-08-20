CREATE TABLE `test_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`ai_name` text NOT NULL,
	`question_count` integer NOT NULL,
	`primary_type` text NOT NULL,
	`primary_match` integer NOT NULL,
	`secondary_type` text NOT NULL,
	`secondary_match` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
