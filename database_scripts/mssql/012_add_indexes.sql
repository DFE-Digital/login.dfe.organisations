DECLARE @ExistingIndexName1 nvarchar(128) = (SELECT i.name
FROM sys.indexes i
  JOIN sys.index_columns ic ON i.index_id = ic.index_id
  JOIN sys.columns c ON ic.column_id = c.column_id AND c.object_id = i.object_id
WHERE i.[object_id] = OBJECT_ID('user_services')
AND i.type <> 1
AND (
  (c.name = 'user_id' AND ic.is_included_column = 0)
  OR
  (c.name = 'organisation_id' AND ic.is_included_column = 0)
)
GROUP BY i.name
HAVING COUNT(DISTINCT c.name) = 2)

IF @ExistingIndexName1 IS NULL
    BEGIN
      PRINT 'creating IX_UserServices_UserOrg'
      CREATE NONCLUSTERED INDEX [IX_UserServices_UserOrg]
        ON [user_services] ([user_id], [organisation_id])
      PRINT 'created IX_UserServices_UserOrg'
    END
ELSE
  PRINT 'Index already exists as ' + @ExistingIndexName1
GO


DECLARE @ExistingIndexName2 nvarchar(128) = (SELECT i.name
FROM sys.indexes i
  JOIN sys.index_columns ic ON i.index_id = ic.index_id
  JOIN sys.columns c ON ic.column_id = c.column_id AND c.object_id = i.object_id
WHERE i.[object_id] = OBJECT_ID('organisation_association')
AND i.type <> 1
AND (
  (c.name = 'organisation_id' AND ic.is_included_column = 0)
  OR
  (c.name = 'associated_organisation_id' AND ic.is_included_column = 1)
  OR
  (c.name = 'link_type' AND ic.is_included_column = 1)
)
GROUP BY i.name
HAVING COUNT(DISTINCT c.name) = 3)

IF @ExistingIndexName2 IS NULL
    BEGIN
      PRINT 'creating IX_OrganisationAssociation_OrgAssType'
      CREATE NONCLUSTERED INDEX [IX_OrganisationAssociation_OrgAssType]
        ON [organisation_association] ([organisation_id])
        INCLUDE ([associated_organisation_id], [link_type])
      PRINT 'created IX_OrganisationAssociation_OrgAssType'
    END
ELSE
  PRINT 'Index already exists as ' + @ExistingIndexName2
GO