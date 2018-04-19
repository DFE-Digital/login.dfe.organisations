-- ALTER TABLE [organisation]
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'Category')
    BEGIN
        ALTER TABLE [organisation]
        ADD Category varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'Type')
    BEGIN
        ALTER TABLE [organisation]
        ADD [Type] varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'URN')
    BEGIN
        ALTER TABLE [organisation]
        ADD URN varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'UID')
    BEGIN
        ALTER TABLE [organisation]
        ADD [UID] varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'UKPRN')
    BEGIN
        ALTER TABLE [organisation]
        ADD UKPRN varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'EstablishmentNumber')
    BEGIN
        ALTER TABLE [organisation]
        ADD EstablishmentNumber varchar(25)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'Status')
    BEGIN
        ALTER TABLE [organisation]
        ADD [Status] int NOT NULL DEFAULT(1)
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'ClosedOn')
    BEGIN
        ALTER TABLE [organisation]
        ADD ClosedOn date
    END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'organisation' AND COLUMN_NAME = 'Address')
    BEGIN
        ALTER TABLE [organisation]
        ADD Address varchar(512)
    END
GO

UPDATE organisation SET Category = '002' WHERE id = 'FA460F7C-8AB9-4CEE-AAFF-82D6D341D702';