-- Revert to the original FK without CASCADE.
ALTER TABLE proposal_section
  DROP CONSTRAINT fk_section_proposal;

ALTER TABLE proposal_section
  ADD CONSTRAINT fk_section_proposal
  FOREIGN KEY (proposal_id)
  REFERENCES proposal(id);
