IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'phaseOfEducation')
    BEGIN
        ALTER TABLE [organisation]
        ADD phaseOfEducation int
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'statutoryLowAge')
    BEGIN
        ALTER TABLE [organisation]
        ADD statutoryLowAge int
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'statutoryHighAge')
    BEGIN
        ALTER TABLE [organisation]
        ADD statutoryHighAge int
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'telephone')
    BEGIN
        ALTER TABLE [organisation]
        ADD telephone varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'regionCode')
    BEGIN
        ALTER TABLE [organisation]
        ADD regionCode char(1)
    END
GO