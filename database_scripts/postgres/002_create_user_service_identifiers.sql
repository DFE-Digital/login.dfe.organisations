create table if not exists services.user_service_identifiers
(
	user_id uuid not null,
	service_id uuid not null,
	organisation_id uuid not null,
	identifier_key varchar(25) not null,
	identifier_value varchar(255) not null,
	constraint user_service_identifiers_pkey
		primary key (user_id, service_id, organisation_id, identifier_key)
);

create table if not exists services.invitation_service_identifiers
(
	invitation_id uuid not null,
	service_id uuid not null,
	organisation_id uuid not null,
	identifier_key varchar(25) not null,
	identifier_value varchar(255) not null,
	constraint invitation_service_identifiers_pkey
		primary key (invitation_id, service_id, organisation_id, identifier_key)
);