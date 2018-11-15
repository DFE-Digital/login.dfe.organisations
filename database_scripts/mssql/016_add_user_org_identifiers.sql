-----------------------------------------------------------------------------------------------------------------------------------------------------------
-- Add identifier columns to user_organisation
-----------------------------------------------------------------------------------------------------------------------------------------------------------
IF NOT EXISTS(SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_organisation' AND COLUMN_NAME = 'numeric_identifier')
    BEGIN
      ALTER TABLE user_organisation
        ADD numeric_identifier bigint NULL
    END

IF NOT EXISTS(SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_organisation' AND COLUMN_NAME = 'text_identifier')
    BEGIN
      ALTER TABLE user_organisation
        ADD text_identifier varchar(25) NULL
    END


UPDATE user_organisation
SET user_organisation.numeric_identifier = CAST(user_service_identifiers.identifier_value as bigint)
FROM user_service_identifiers
WHERE user_organisation.user_id = user_service_identifiers.user_id
AND user_organisation.organisation_id = user_service_identifiers.organisation_id
AND user_service_identifiers.identifier_key = 'saUserId'
AND user_organisation.numeric_identifier IS NULL
AND ISNUMERIC(user_service_identifiers.identifier_value) = 1

UPDATE user_organisation
SET user_organisation.text_identifier = user_service_identifiers.identifier_value
FROM user_service_identifiers
WHERE user_organisation.user_id = user_service_identifiers.user_id
AND user_organisation.organisation_id = user_service_identifiers.organisation_id
AND user_service_identifiers.identifier_key = 'saUsername'
AND user_organisation.text_identifier IS NULL


-----------------------------------------------------------------------------------------------------------------------------------------------------------
-- Add counters table
-----------------------------------------------------------------------------------------------------------------------------------------------------------
IF NOT EXISTS(SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'counters')
  BEGIN
    CREATE TABLE counters(
      counter_name varchar(50) NOT NULL,
      next_value bigint NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,

      CONSTRAINT [PK_counters] PRIMARY KEY (counter_name)
    )
  END

IF NOT EXISTS (SELECT * FROM counters WHERE counter_name = 'user_organisation_numeric_identifier')
    BEGIN
      INSERT INTO counters (counter_name, next_value, createdAt, updatedAt) VALUES ('user_organisation_numeric_identifier', 1, GETDATE(), GETDATE())
    END

IF NOT EXISTS (SELECT * FROM counters WHERE counter_name = 'organisation_legacyid')
    BEGIN
      INSERT INTO counters (counter_name, next_value, createdAt, updatedAt) VALUES ('organisation_legacyid', 1, GETDATE(), GETDATE())
    END