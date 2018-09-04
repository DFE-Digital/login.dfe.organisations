IF((SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='user_service_identifiers' AND COLUMN_NAME='identifier_value') BETWEEN 0 AND 255)
    BEGIN
      ALTER TABLE user_service_identifiers
        ALTER COLUMN identifier_value varchar(max)
    END
GO

IF((SELECT CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='invitation_service_identifiers' AND COLUMN_NAME='identifier_value') BETWEEN 0 AND 255)
    BEGIN
      ALTER TABLE invitation_service_identifiers
        ALTER COLUMN identifier_value varchar(max)
    END
GO
