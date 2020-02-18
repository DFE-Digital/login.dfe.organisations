IF NOT EXISTS (SELECT serviceId FROM serviceParams WHERE serviceId='df2ae7f3-917a-4489-8a62-8b9b536a71cc' and paramName = 'maximumRolesAllowed')
    BEGIN
      INSERT INTO serviceParams
      (serviceId, paramName, paramValue)
      VALUES
      ('df2ae7f3-917a-4489-8a62-8b9b536a71cc', 'maximumRolesAllowed', 1)
    END
GO