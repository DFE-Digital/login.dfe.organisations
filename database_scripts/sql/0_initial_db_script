
IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'service')
BEGIN
    CREATE TABLE dbo.service
    (
        id uniqueidentifier PRIMARY KEY NOT NULL,
        name varchar(500) NOT NULL,
        description varchar(max)
    );
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'organisation')
BEGIN
    CREATE TABLE dbo.organisation
    (
        id uniqueidentifier PRIMARY KEY NOT NULL,
        name varchar(500) NOT NULL
    );
END

GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'invitation_services')
BEGIN
    CREATE TABLE dbo.invitation_services
    (
        invitation_id uniqueidentifier PRIMARY KEY NOT NULL,
        role_id smallint DEFAULT 0 NOT NULL,
        organisation_id uniqueidentifier NOT NULL,
        service_id uniqueidentifier NOT NULL,
        CONSTRAINT invitation_services_organisation_id_fk FOREIGN KEY (organisation_id) REFERENCES organisation (id),
        CONSTRAINT invitation_services_service_id_fk FOREIGN KEY (service_id) REFERENCES service (id)
    );
END
GO

IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_services')
BEGIN
    CREATE TABLE dbo.user_services
    (
        id uniqueidentifier PRIMARY KEY NOT NULL,
        status smallint DEFAULT 0 NOT NULL,
        user_id uniqueidentifier NOT NULL,
        role_id smallint DEFAULT 0 NOT NULL,
        organisation_id uniqueidentifier,
        service_id uniqueidentifier,
        createdAt datetime NOT NULL,
        updatedAt datetime NOT NULL,
        CONSTRAINT user_services_organisation_id_fk FOREIGN KEY (organisation_id) REFERENCES organisation (id),
        CONSTRAINT user_services_service_id_fk FOREIGN KEY (service_id) REFERENCES service (id)
    );
END
GO