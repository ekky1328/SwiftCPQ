-- proposal_section.proposal_id was defined without ON DELETE CASCADE,
-- which causes a FK violation when deleting a proposal that has sections.
-- All other child tables (proposal_section_item, proposal_milestone via
-- section_id, and proposal_version via proposal_id) already use CASCADE.
-- This brings proposal_section in line with the rest of the schema.

ALTER TABLE proposal_section
  DROP CONSTRAINT fk_section_proposal;

ALTER TABLE proposal_section
  ADD CONSTRAINT fk_section_proposal
  FOREIGN KEY (proposal_id)
  REFERENCES proposal(id)
  ON DELETE CASCADE;
