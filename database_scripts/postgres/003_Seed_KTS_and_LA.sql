INSERT INTO services.organisation
(id, name)
VALUES
('fa460f7c-8ab9-4cee-aaff-82d6d341d702', 'Local Authority')
ON CONFLICT (id) DO NOTHING;

INSERT INTO services.service
(id, name, description)
VALUES
('3bfde961-f061-4786-b618-618deaf96e44', 'Key to success (KtS)', 'A searchable database of confidential pupil-data used to support assessment, attainment and transition, and the Pupil Premium and Summer School initiative.')
ON CONFLICT (id) DO NOTHING;