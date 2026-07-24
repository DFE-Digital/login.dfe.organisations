const { QueryTypes } = require("sequelize");
const repository = require("../../infrastructure/repository");
const logger = require("../../infrastructure/logger");

// Literal id from database_scripts/mssql/014_add_s2s_kts-sa_collect_services.sql,
// which INSERTs this service with a hardcoded uniqueidentifier (not NEWID()/an
// IDENTITY column), so the value is identical wherever that migration has run.
// Confirmed against production on 2026-07-24: id 4fd40032-61a6-4beb-a6c4-6b39a3af81c1
// maps to name 'Collect' with no other row sharing that id.
const COLLECT_SERVICE_ID = "4fd40032-61a6-4beb-a6c4-6b39a3af81c1";

const getCollectOrgsWithoutActiveUsers = async (req, res) => {
  const correlationId = req.headers["x-correlation-id"];

  try {
    const rows = await repository.sequelize.query(
      `
      SELECT DISTINCT
        o.id                      AS org_id,
        o.name                    AS org_name,
        o.URN                     AS urn,
        o.EstablishmentNumber     AS establishment_number,
        o.Category                AS category,
        o.Status                  AS status,
        o.DistrictAdministrativeCode AS local_authority_code,
        o.ClosedOn                AS closed_on,
        (
          SELECT COUNT(*)
          FROM dbo.[user_services] us2
          JOIN dbo.[service] s2 ON s2.id = us2.service_id
          WHERE us2.organisation_id = o.id
            AND s2.id = '${COLLECT_SERVICE_ID}'
        ) AS total_user_service_records,
        (
          SELECT COUNT(*)
          FROM dbo.[user_services] us3
          JOIN dbo.[service] s3 ON s3.id = us3.service_id
          WHERE us3.organisation_id = o.id
            AND s3.id = '${COLLECT_SERVICE_ID}'
            AND us3.status = 1
        ) AS active_user_count
      FROM dbo.[organisation] o
      WHERE o.Status = 1
        AND o.id IN (
          SELECT DISTINCT us.organisation_id
          FROM dbo.[user_services] us
          JOIN dbo.[service] s ON s.id = us.service_id
          WHERE s.id = '${COLLECT_SERVICE_ID}'
        )
        AND o.id NOT IN (
          SELECT DISTINCT us.organisation_id
          FROM dbo.[user_services] us
          JOIN dbo.[service] s ON s.id = us.service_id
          WHERE s.id = '${COLLECT_SERVICE_ID}'
            AND us.status = 1
        )
      ORDER BY o.name
      `,
      { type: QueryTypes.SELECT },
    );

    return res.status(200).json(rows ?? []);
  } catch (e) {
    logger.error(
      `Error fetching COLLECT orgs without active users - ${e.message}`,
      { correlationId, stack: e.stack },
    );
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = getCollectOrgsWithoutActiveUsers;
