INSERT INTO agents (name, email) VALUES
  ('Pawan Kumar', 'pawan@example.com'),
  ('Meera Iyer', 'meera@example.com'),
  ('Dilawar Khan', 'Dilawar@example.com')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO tickets
  (subject, description, priority, status, assigned_agent_id, sla_due_at, is_escalated, created_at, updated_at)
VALUES
  ('Login OTP not arriving', 'Customer cannot receive OTP while signing in.', 'urgent', 'open', 1, DATE_ADD(NOW(), INTERVAL 18 MINUTE), FALSE, DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),
  ('Invoice PDF is missing tax ID', 'Billing export does not show customer GST details.', 'high', 'in_progress', 2, DATE_SUB(NOW(), INTERVAL 40 MINUTE), FALSE, DATE_SUB(NOW(), INTERVAL 9 HOUR), NOW()),
  ('Profile avatar upload fails', 'PNG upload gives a generic network error.', 'medium', 'open', NULL, DATE_ADD(NOW(), INTERVAL 3 HOUR), FALSE, DATE_SUB(NOW(), INTERVAL 21 HOUR), NOW()),
  ('Typo on help page', 'Customer spotted a spelling issue in docs.', 'low', 'resolved', 3, DATE_ADD(NOW(), INTERVAL 48 HOUR), FALSE, DATE_SUB(NOW(), INTERVAL 24 HOUR), NOW()),
  ('Webhook retries exhausted', 'Partner integration is not receiving order updates.', 'high', 'open', 1, DATE_ADD(NOW(), INTERVAL 1 HOUR), FALSE, DATE_SUB(NOW(), INTERVAL 7 HOUR), NOW());

INSERT INTO ticket_comments (ticket_id, author, message, created_at) VALUES
  (1, 'customer', 'I have tried resend OTP three times.', DATE_SUB(NOW(), INTERVAL 55 MINUTE)),
  (1, 'Aarav Sharma', 'Checking SMS provider delivery logs.', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
  (2, 'customer', 'Finance team needs this today.', DATE_SUB(NOW(), INTERVAL 8 HOUR)),
  (3, 'customer', 'It happens only on PNG files.', DATE_SUB(NOW(), INTERVAL 20 HOUR));
