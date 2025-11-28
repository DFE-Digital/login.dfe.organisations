# DfE Sign-in Organisations

**DfE Sign-in Organisations** is an API used to provide user service information at an organisation level. This service is part of the wider **login.dfe** project.

## Getting Started

### Install Dependencies

```
npm install
```

### Run application

Setup Keystore & development ssl certs

```
npm run setup
```

Start the application with:

```
npm run dev
```

Once the service is running, to test the API locally:

```
curl https://localhost:4437/services
```

### Endpoints

You are able to get and user associated services via the following endpoint:

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
node tools/createDatabase.js

```

which against a blank database will create the necessary tables. If you already have a database then use the scripts in the
**database_scripts** folder.

### Run Tests

Run all tests with:

```
npm run test
```

### Code Quality and Formatting

Run ESLint:

```
npm run lint
```

Automatically fix lint issues:

```
npm run lint:fix
```

### Development Checks

Run linting and tests together:

```
npm run dev:checks
```

### Pre-commit Hooks

Pre-commit hooks are handled automatically via Husky. No additional setup is required.
