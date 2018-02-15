IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES where TABLE_NAME = 'user_service_identifiers')
BEGIN
    create table dbo.user_service_identifiers
    (
        user_id uniqueidentifier not null,
        service_id uniqueidentifier not null,
        organisation_id uniqueidentifier not null,
        identifier_key varchar(25) not null,
        identifier_value varchar(255) not null,
        constraint user_service_identifiers_pkey
            primary key (user_id, service_id, organisation_id, identifier_key)
    )
END
GO

