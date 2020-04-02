 -- This script should remove NSA-2936's list of organisations from dfe if there are no users assigned to it

BEGIN TRAN NSA2936
DECLARE @orgId UNIQUEIDENTIFIER;
SET @orgId = 'C9974ABF-6301-48D4-AE06-5C2A8F1AFDD4';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '4D30055D-19D6-4484-B4D0-AA5A66B39D63';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = 'E4833276-5645-4A92-BDAD-12746F1DD10C';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '23544A75-55A7-4F07-AEC5-AAA9E37E6C82';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '82E9AA44-49C1-45ED-A6C6-30AE0361984F';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '3DBAD9C7-D547-469F-97BC-0CC18A488BB5';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = 'CD40A092-E5BE-4934-90CD-218122B22E2F';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '9FB119A7-7B19-404C-93F9-F0D9BCB845AE';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '42D38F4C-F729-4068-B04A-A7EFE922A5FB';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '82396E46-8CD3-4C90-896A-62FF84EB4490';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
       DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '3ED85020-CC26-42FC-AA78-A0059EE1D4C9';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = 'AAA525EA-E882-4610-A94A-4B6EFF2D9528';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '75503A34-AD52-4BB9-B072-100E272868AA';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '5E7E6EB1-138D-4E36-8A02-A1D4A06CDB9A';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = '883A528E-4B7C-4550-B195-E02180D31F53';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END

SET @orgId = 'DA3D4E5D-6F39-4085-A69D-FCB7D343F5CC';
 IF (select count(*) from user_organisation where organisation_id =@orgId)  = 0
    BEGIN
        DELETE FROM [dbo].[organisation] where id=@orgId;
    END
ROLLBACK TRAN NSA2936
