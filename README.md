# login.dfe.organisations

[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

[![VSTS Build Status](https://sfa-gov-uk.visualstudio.com/_apis/public/build/definitions/aa44e142-c0ac-4ace-a6b2-0d9a3f35d516/711/badge)](https://sfa-gov-uk.visualstudio.com/DfE%20New%20Secure%20Access/_build/index?definitionId=711&_a=completed)

## Setup

### Getting Started

Install deps

```
npm i
```

Setup Keystore & development ssl certs

```
npm run setup
```

Run

```
npm run dev
```

You will also need postgres installed which can be

### Getting started with organisations worker (vscode)

There is an organisations worker that runs tasks on a cron schedule. To run it locally in vscode:

- Ensure you have the `organisationsWorker` version of the config located in `config/worker-local-config.json`
- Run `Launch Org worker` from the Run and debug tab in vscode.

You may need to modify how often it runs in the `schedules` part of the config as some of them are set to run
very infrequently.

### Purpose

The purpose of this project is to provide user service information at an organisation level.
The postgres instance can be installed using brew.

1. You will need [brew](https://brew.sh/)
1. Once installed from terminal run `brew install postgres`
1. Then `brew services start postgresql` to start a local instance of postgres

A schema called **services** should be created, then the following script can be created for the user

```
CREATE USER db_user WITH PASSWORD '[YOUR_PASSWORD]';
alter default privileges in schema services grant all on tables to db_user;


GRANT ALL PRIVILEGES ON SCHEMA services TO GROUP db_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA services TO GROUP db_user;
```

The following configuration must then be supplied as detailed in login.dfe.organisations.dev.json

```
  "database":{
    "host" :"localhost",
    "username":"db_user",
    "password":"my-password"
  }
```

The necessary tables will be created when ran.

### Endpoints

The API uses the security module [login.dfe.jwt-strategies](https://github.com/DFE-Digital/login.dfe.jwt-strategies). You are able to get and user associated services via the following endpoint:

```
GET: /associated-with-user/[uid]
```

This will return a response in the following format:

```
[
    {
        "userService": {
            "id": "b7526206-7760-4024-b869-97004350cb8b",
            "userId": "77d6b281-9f8d-4649-84b8-87fc42eee71d",
            "status": 0
        },
        "organisation": {
            "id": "88a1ed39-5a98-43da-b66e-78e564ea72b0",
            "name": "Test Org"
        },
        "service": {
            "id": "77d6b281-9f8d-4649-84b8-87fc42eee71d",
            "name": "Test Service"
        }
    }
]
```

You are also able to get services that are associated to a user

```
GET: /unassociated-with-user/[uid]
```

### Creating database

You can run the following to create the database

```
settings=./config/login.dfe.organisations.dev.local.json node tools/createDatabase.js

```

which against a blank database will create the necessary tables. If you already have a database then use the scripts in the
**database_scripts** folder.

## Prerequisite

---

1. Add audit sql host name to keyvault with name `auditSqlHostName` - added
2. Add audit sql db name to keyvault with name `auditSqlDbName` - added
3. Add Organisations host name to keyvault with name `standaloneOrganisationsHostName` - added
4. Add Directories host name to keyvault with name `standaloneDirectoriesHostName` - added
5. Add app insights instrumentation Key to keyvault with name `appInsightsInstrumentationKey` - added
6. Add tenant Url to keyvault with name `tenantUrl` - added
7. Add aad shd app id to keyvault with name `aadshdappid` - added
8. Add redis Connection in the keyvault with name `redisConn`
9. Add gias Service Url in the keyvault with name `giasServiceUrl`
10. Add gias Service Username in the keyvault with name `giasServiceUsername`
11. Add gias Service Password in the keyvault with name `giasServicePassword`
12. Add gias All Groups DataUrl in the keyvault with name `giasAllGroupsDataUrl`
