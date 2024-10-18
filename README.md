# SoundMuve Backend
Welcome to simplified music distributions

## .env file content required
This values are required in .env file to run this application.

```bash
    MONGO_DB_ACCESS_URI 

    JWT_SECRET
    REFRESH_TOKEN_SECRET

    HOST_EMAIL
    HOST_PASSWORD
    HOST_SENDER
    EMAIL_PASSWORD

    CLOUDINARY_CLOUD_NAME
    CLOUDINARY_API_KEY
    CLOUDINARY_API_SECRET
    CLOUDINARY_URL

    SECRET_KEY
    JWT_TOKEN

    PAYPAL_CLIENT_ID
    PAYPAL_SECRET
    PAYPAL_OAUTH_URL
    PAYPAL_PAYOUTS_URL

    SPOTIFY_CLIENT_ID
    SPOTIFY_CLIENT_SECRET

    STRIPE_SECRET_KEY
    STRIPE_PUBLISHABLE_KEY
```


## Response codes used in the project

success
```bash
    200 - successful, everything went well
    201 - successful, everything went well
    202 - successful, everything didn't go well, transaction may go through, but not recorded on the db.
```