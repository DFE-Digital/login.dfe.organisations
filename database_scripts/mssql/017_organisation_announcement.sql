IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'organisation_announcement')
  BEGIN
    CREATE TABLE organisation_announcement (
      announcement_id uniqueidentifier NOT NULL,
      origin_id nvarchar(125) NOT NULL,
      organisation_id uniqueidentifier NOT NULL,
      type int NOT NULL,
      title nvarchar(255) NOT NULL,
      summary nvarchar(340) NOT NULL,
      body nvarchar(max) NOT NULL,
      publishedAt datetime2 NOT NULL,
      expiresAt datetime2 NULL,
      published bit NOT NULL,
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,

      CONSTRAINT [PK_OrganisationAnnoucement] PRIMARY KEY (announcement_id),
      CONSTRAINT [FK_OrganisationAnnoucement_Organisation] FOREIGN KEY (organisation_id) REFERENCES [organisation](id)
    )
  END