-- Create user_organisation_requests table
IF NOT EXISTS(SELECT 1
              FROM INFORMATION_SCHEMA.TABLES
              WHERE TABLE_NAME = 'user_organisation_requests')
    BEGIN
        CREATE TABLE user_organisation_requests
        (
            id              uniqueidentifier PRIMARY KEY NOT NULL,
            user_id         uniqueidentifier             NOT NULL,
            organisation_id uniqueidentifier             NOT NULL,
            status          smallint DEFAULT 0           NOT NULL,
            reason          VARCHAR(5000)                NULL,
            actioned_at     datetime2                    NULL,
            actioned_by     uniqueidentifier             NULL,
            actioned_reason VARCHAR(5000)                NULL,
            createdAt       datetime2                    NOT NULL,
            updatedAt       datetime2                    NOT NULL,
            CONSTRAINT user_organisation_requests_organisation_id_fk FOREIGN KEY (organisation_id) REFERENCES organisation (id)
        )
    END
GO
