IF NOT EXISTS(SELECT *
FROM sys.objects
WHERE object_id = OBJECT_ID(N'[dbo].[numeric_id_sequence]') AND type = 'SO')
CREATE SEQUENCE [dbo].[numeric_id_sequence] 
    AS [bigint]
    START WITH 50000
    INCREMENT BY 1
    MINVALUE 50000
    MAXVALUE 9223372036854775807
    CACHE 50
GO