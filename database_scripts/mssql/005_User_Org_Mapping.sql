-- Create user_organisation table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_organisation')
    BEGIN
      CREATE TABLE user_organisation (
        user_id uniqueidentifier NOT NULL,
        organisation_id uniqueidentifier NOT NULL,
        role_id smallint DEFAULT 0 NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL,
        CONSTRAINT user_organisation_pk PRIMARY KEY (user_id, organisation_id),
        CONSTRAINT user_organisation_organisation_id_fk FOREIGN KEY (organisation_id) REFERENCES organisation (id)
      )
    END
GO

-- move data from user_services
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_services' AND COLUMN_NAME = 'role_id')
    BEGIN
        EXEC('INSERT INTO user_organisation
        (user_id, organisation_id, role_id, createdAt, updatedAt)
        SELECT s.user_id, s.organisation_id, MAX(s.role_id) role_id, GETDATE(), GETDATE()
        FROM user_services s
          LEFT JOIN user_organisation o
            ON s.user_id = o.user_id
            AND s.organisation_id = o.organisation_id
        WHERE o.user_id IS NULL
        GROUP BY s.user_id, s.organisation_id')
    END
GO

-- remove role id from user_services
DECLARE @constraintName varchar(50) = (SELECT dc.name
FROM sys.columns c
  JOIN sys.default_constraints dc
    ON c.default_object_id = dc.object_id
WHERE c.object_id = OBJECT_ID('user_services')
AND c.name = 'role_id')

IF @constraintName IS NOT NULL
  BEGIN
    EXEC('ALTER TABLE user_services DROP CONSTRAINT [' + @constraintName + ']')
  END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'user_services' AND COLUMN_NAME = 'role_id')
    BEGIN
        ALTER TABLE user_services
        DROP COLUMN role_id
    END



-- Create invitation_organisation table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'invitation_organisation')
    BEGIN
      CREATE TABLE invitation_organisation (
        invitation_id uniqueidentifier NOT NULL,
        organisation_id uniqueidentifier NOT NULL,
        role_id smallint DEFAULT 0 NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL,
        CONSTRAINT invitation_organisation_pk PRIMARY KEY (invitation_id, organisation_id),
        CONSTRAINT invitation_organisation_organisation_id_fk FOREIGN KEY (organisation_id) REFERENCES organisation (id)
      )
    END
GO

-- move data from invitation_services
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_services' AND COLUMN_NAME = 'role_id')
    BEGIN
        EXEC('INSERT INTO invitation_organisation
        (invitation_id, organisation_id, role_id, createdAt, updatedAt)
        SELECT s.invitation_id, s.organisation_id, MAX(s.role_id) role_id, GETDATE(), GETDATE()
        FROM invitation_services s
          LEFT JOIN invitation_organisation o
            ON s.invitation_id = o.invitation_id
            AND s.organisation_id = o.organisation_id
        WHERE o.invitation_id IS NULL
        GROUP BY s.invitation_id, s.organisation_id')
    END
GO

-- remove role id from invitation_services
DECLARE @constraintName varchar(50) = (SELECT dc.name
FROM sys.columns c
  JOIN sys.default_constraints dc
    ON c.default_object_id = dc.object_id
WHERE c.object_id = OBJECT_ID('invitation_services')
AND c.name = 'role_id')

IF @constraintName IS NOT NULL
  BEGIN
    EXEC('ALTER TABLE invitation_services DROP CONSTRAINT [' + @constraintName + ']')
  END

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'invitation_services' AND COLUMN_NAME = 'role_id')
    BEGIN
        ALTER TABLE invitation_services
        DROP COLUMN role_id
    END