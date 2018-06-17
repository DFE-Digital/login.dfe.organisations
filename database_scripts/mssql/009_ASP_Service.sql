IF NOT EXISTS (SELECT id FROM service WHERE id='DF2AE7F3-917A-4489-8A62-8B9B536A71CC')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('DF2AE7F3-917A-4489-8A62-8B9B536A71CC', 'Analyse school performance (RAISE)', 'Analyse school performance (RAISE)')
    END
GO
