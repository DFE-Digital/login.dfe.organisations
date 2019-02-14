IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'createdAt')
  BEGIN
    ALTER TABLE organisation
      ADD createdAt datetime2 NULL
  END
GO

IF ((SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'createdAt') = 'YES')
  BEGIN
    UPDATE organisation SET createdAt = GETDATE() WHERE createdAt IS NULL

    ALTER TABLE organisation
      ALTER COLUMN createdAt datetime2 NOT NULL
  END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'updatedAt')
  BEGIN
    ALTER TABLE organisation
      ADD updatedAt datetime2 NULL
  END
GO

IF ((SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'updatedAt') = 'YES')
  BEGIN
    UPDATE organisation SET updatedAt = GETDATE() WHERE updatedAt IS NULL

    ALTER TABLE organisation
      ALTER COLUMN updatedAt datetime2 NOT NULL
  END
GO