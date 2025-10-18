-- Flyway migration: create tones table
-- Matches `com.bucha.entity.Tone` fields used by the app

CREATE TABLE IF NOT EXISTS tones (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(255),
	pitch_value VARCHAR(255),
	pronunciation TEXT,
	tone_mark VARCHAR(255),
	external_id BIGINT,
	sort_order INT,
	content_hash VARCHAR(64),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add index for lookup performance
CREATE INDEX IF NOT EXISTS idx_tones_external_id ON tones (external_id);
CREATE INDEX IF NOT EXISTS idx_tones_tone_mark ON tones (tone_mark);
CREATE INDEX IF NOT EXISTS idx_tones_sort_order ON tones (sort_order);
