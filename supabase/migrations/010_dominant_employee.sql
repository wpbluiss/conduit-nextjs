-- R9: conduit_conversations.dominant_employee — kept up to date by a trigger
-- on conduit_messages. Sidebar reads this column to render the right
-- dept-color badge per conversation. Conversations with 3+ distinct employees
-- get 'team' so we can render the multi-color round-table badge.

ALTER TABLE conduit_conversations
  ADD COLUMN IF NOT EXISTS dominant_employee text;

CREATE OR REPLACE FUNCTION conduit_update_dominant_employee()
RETURNS TRIGGER AS $$
DECLARE
  v_distinct integer;
  v_dominant text;
BEGIN
  IF NEW.role <> 'assistant' OR NEW.employee IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(DISTINCT employee)
    INTO v_distinct
  FROM conduit_messages
  WHERE conversation_id = NEW.conversation_id
    AND role = 'assistant'
    AND employee IS NOT NULL;

  IF v_distinct >= 3 THEN
    v_dominant := 'team';
  ELSE
    SELECT employee
      INTO v_dominant
    FROM conduit_messages
    WHERE conversation_id = NEW.conversation_id
      AND role = 'assistant'
      AND employee IS NOT NULL
    GROUP BY employee
    ORDER BY COUNT(*) DESC, MAX(created_at) DESC
    LIMIT 1;
  END IF;

  UPDATE conduit_conversations
    SET dominant_employee = v_dominant
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conduit_messages_dominant_employee ON conduit_messages;
CREATE TRIGGER conduit_messages_dominant_employee
  AFTER INSERT ON conduit_messages
  FOR EACH ROW
  EXECUTE FUNCTION conduit_update_dominant_employee();
