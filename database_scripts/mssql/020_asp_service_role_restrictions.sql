
DECLARE @AspServiceId UNIQUEIDENTIFIER

set @AspServiceId = (select top 1 Id from service where [name] = 'Analyse School Performance')

IF NOT EXISTS (SELECT serviceId FROM serviceParams WHERE serviceId=@AspServiceId and paramName = 'maximumRolesAllowed')
    BEGIN
      INSERT INTO serviceParams
      (serviceId, paramName, paramValue)
      VALUES
      ( @AspServiceId, 'maximumRolesAllowed', 1)    
    END
GO
