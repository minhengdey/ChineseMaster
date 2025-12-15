-- Add question_id column to ise_test_entry table
-- This allows tracking scores per question (best of 3 attempts per question)
-- Note: question_id stores Question.externalId (not Question.id)
ALTER TABLE ise_test_entry ADD COLUMN question_id BIGINT;

-- Create index for faster queries
CREATE INDEX idx_ise_test_entry_test_user_question 
ON ise_test_entry(test_id, user_id, question_id);
