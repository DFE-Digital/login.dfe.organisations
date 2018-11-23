IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'web_service_status')
    BEGIN
      CREATE TABLE web_service_status (
        organisation_id uniqueidentifier NOT NULL,
        application_id uniqueidentifier NOT NULL,
        last_action varchar(25) NOT NULL,
        createdAt datetime2 NOT NULL,
        updatedAt datetime2 NOT NULL,

        CONSTRAINT [PK_WebServiceStatus] PRIMARY KEY (organisation_id, application_id),
        CONSTRAINT [FK_WebServiceStatus_Organisation] FOREIGN KEY (organisation_id) REFERENCES [organisation](id)
      )
    END
GO