IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'legacyId')
    BEGIN
        ALTER TABLE [organisation]
        ADD legacyId bigint
    END
GO