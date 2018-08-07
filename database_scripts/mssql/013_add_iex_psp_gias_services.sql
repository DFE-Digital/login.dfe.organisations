IF NOT EXISTS (SELECT id FROM service WHERE id='2354cb2e-f559-4bf4-9981-4f6c6890aa5e')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('2354cb2e-f559-4bf4-9981-4f6c6890aa5e', 'Get Information About Schools', 'Get Information About Schools')
    END
GO

IF NOT EXISTS (SELECT id FROM service WHERE id='09c66a38-c8c2-448d-87c5-a4895fb7f8de')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('09c66a38-c8c2-448d-87c5-a4895fb7f8de', 'Post 16 Portal', 'Post 16 Portal')
    END
GO


IF NOT EXISTS (SELECT id FROM service WHERE id='913ba321-9547-46b2-93c3-a7a7ffc2e3e2')
    BEGIN
      INSERT INTO service
      (id, name, description)
      VALUES
      ('913ba321-9547-46b2-93c3-a7a7ffc2e3e2', 'Information Exchange', 'Information Exchange')
    END
GO
