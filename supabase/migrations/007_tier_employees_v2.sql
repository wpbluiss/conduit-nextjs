-- R6: refresh tier allowed_employees to reflect the full 9-employee roster
-- on Enterprise. Free + Pro stay at their R4 definitions.

UPDATE conduit_pricing_tiers
SET allowed_employees = ARRAY['jarvis','marketing']
WHERE id = 'free';

UPDATE conduit_pricing_tiers
SET allowed_employees = ARRAY['jarvis','marketing','sales','engineering']
WHERE id = 'pro';

UPDATE conduit_pricing_tiers
SET allowed_employees = ARRAY[
  'jarvis','marketing','sales','engineering',
  'finance','compliance','hr','ops','legal'
]
WHERE id = 'enterprise';
