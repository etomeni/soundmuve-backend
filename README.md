# TesaPay
Welcome to simplified payments

## .env file content required
This values are required in .env file to run this application.

```bash
    MONGO_DB_ACCESS_URI

    # OPENSSL_CONF

    JWT_SECRET

    HOST_EMAIL
    HOST_PASSWORD
    HOST_SENDER

    EMAIL_PASSWORD


    TERMII_API_KEY

    IDENTITY_PASS_PREMBLY_API_TEST_KEY
    IDENTITY_PASS_PREMBLY_API_APP_ID


    PSB_VASS_USERNAME
    PSB_VASS_PASSWORD


    PSB_WASS_USERNAME
    PSB_WASS_PASSWORD
    PSB_WASS_CLIENTSECRET 
```

## Complete all TODO:: before launching to testing


Donation to Tesa foundation
loan
currency convertion
live chat


## Response codes used in the project

success
```bash
    200 - successful, everything went well
    201 - successful, everything went well
    202 - successful, everything didn't go well, transaction may go through, but not recorded on the db.
```