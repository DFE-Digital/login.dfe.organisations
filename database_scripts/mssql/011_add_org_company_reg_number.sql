IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'companyRegistrationNumber')
    BEGIN
        ALTER TABLE [organisation]
        ADD companyRegistrationNumber varchar(50)
    END
GO