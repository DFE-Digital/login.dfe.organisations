IF NOT EXISTS (SELECT id FROM service WHERE id='0d15c5bd-ca2f-4211-b789-853bb34ce884')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('0d15c5bd-ca2f-4211-b789-853bb34ce884', 'ITT Provider', '')
    END
GO





IF NOT EXISTS (SELECT id FROM service WHERE id='aa4bd63e-61b8-421f-90df-8ef2cd15aa38')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('aa4bd63e-61b8-421f-90df-8ef2cd15aa38', 'Evolve - Employer Access - Schools', '')
    END
GO





IF NOT EXISTS (SELECT id FROM service WHERE id='ddfa2fa3-9824-4678-a2e0-f34d6d71948e')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('ddfa2fa3-9824-4678-a2e0-f34d6d71948e', 'Evolve - Employer Access - Agent', '')
    END
GO




IF NOT EXISTS (SELECT id FROM service WHERE id='8fba5fde-832b-499b-957e-8bcd97d11b2d')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('8fba5fde-832b-499b-957e-8bcd97d11b2d', 'Evolve - Appropriate Body', '')
    END
GO