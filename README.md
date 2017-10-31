# login.dfe.organisations

[![Build Status](https://travis-ci.org/DFE-Digital/login.dfe.organisations.svg?branch=master)](https://travis-ci.org/DFE-Digital/login.dfe.organisations)

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

### Purpose

The purpose of this project is to provide user service information at an organisation level.
The postgres instance can be installed using brew.
1) You will need [brew](https://brew.sh/)
1) Once installed from terminal run ``` brew install postgres ```
1) Then ```brew services start postgresql``` to start a local instance of postgres

The following configuration must then be supplied as detailed in login.dfe.organisations.dev.json

```
  "database":{
    "host" :"localhost",
    "username":"my-username",
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


