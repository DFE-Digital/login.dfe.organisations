IF NOT EXISTS (SELECT id FROM service WHERE id='4fd40032-61a6-4beb-a6c4-6b39a3af81c1')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('4fd40032-61a6-4beb-a6c4-6b39a3af81c1', 'Collect', 'Collect')
    END
GO

IF NOT EXISTS (SELECT id FROM service WHERE id='57e972f8-0eda-4f0f-aaf9-50b55662c528')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('57e972f8-0eda-4f0f-aaf9-50b55662c528', 'Key to Success', 'Key to Success')
    END
GO

IF NOT EXISTS (SELECT id FROM service WHERE id='09abfb35-3d09-41a7-9e4e-b8512b9b7d5e')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('09abfb35-3d09-41a7-9e4e-b8512b9b7d5e', 'School to School', 'School to School')
    END
GO