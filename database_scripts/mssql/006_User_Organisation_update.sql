
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_organisation' AND COLUMN_NAME = 'status')
    BEGIN
        ALTER TABLE user_organisation ADD [status] smallint DEFAULT 0 NOT NULL
    END
GO
