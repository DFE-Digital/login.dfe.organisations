
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_organisation' AND COLUMN_NAME = 'status')
    BEGIN
        ALTER TABLE user_organisation ADD [status] smallint DEFAULT 0 NOT NULL

        update user_organisation set [status] = 1
    END
GO


IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_organisation' AND COLUMN_NAME = 'reason')
    BEGIN
        ALTER TABLE user_organisation ADD [reason] VARCHAR(5000) NULL
    END
GO
