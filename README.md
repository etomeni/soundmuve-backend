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


# Deployment steps
Follow this steps to deploy the application


---

## **Step 1: Set Up Your DigitalOcean Droplet**

1. **Create a Droplet**:
   - Log in to DigitalOcean, click **Create** > **Droplets**.
   - Choose an image: **Ubuntu 20.04 (or newer)**.
   - Select a plan (basic plans work fine for small apps).
   - Choose a data center region (choose **Bangalore** or **Singapore** if you are in Nigeria for better latency).
   - Add your SSH key (if not done already, refer to the steps for creating an SSH key).
   - Finalize and create the droplet.

2. **Access Your Droplet**:
   - Use the IP address provided by DigitalOcean to connect to your droplet via SSH:
    ```bash
    ssh -i ~/.ssh/soundmuve_key root@your_droplet_ip
    ```

---

## **Step 2: Configure the Droplet**

1. **Update the System**:
   - Update the package list and install updates:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```

2. **Install Node.js**:
   - Install Node.js (use the LTS version):
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt install -y nodejs
    ```
   - Verify installation:
    ```bash
    node -v
    npm -v
    ```

3. **Install Git**:
   - Install Git to pull your application code:
    ```bash
    sudo apt install git -y
    ```

4. **Install PM2**:
   - PM2 is a process manager for Node.js applications:
    ```bash
    sudo npm install -g pm2
    ```

---

## **Step 3: Deploy Your Application**

1. **Create file directory**:
    - Create a directory to house the program files 
    ```bash
    mkdir var
    cd var
    mkdir www
    cd var
    ```

2. **Clone Your Repository**:
   - Pull your application code from a Git repository (e.g., GitHub):
    ```bash
    git clone https://github.com/yourusername/your-repo.git
    cd your-repo
    ```

3. **Setup the environment variables**
    - Create .env file and verify it was created
    ```bash
    touch .env
    ls -a
    ```
    - Open the .env file and past the variables
    ```bash
    nano .env
    ```
    - Save and exit

4. **Add Swap Space on Ubuntu 22.04**:
    - One way to guard against out-of-memory errors in applications is to add some swap space to your server. In this guide, we will cover how to add a swap file to an Ubuntu 22.04 server.
    - Follow the steps/guide in this article to setup and add Swap Space

    ```
    https://www.digitalocean.com/community/tutorials/how-to-add-swap-space-on-ubuntu-22-04
    ```

3. **Install Dependencies**:
   - Install the dependencies for your project:
    ```bash
    npm install
    ```

4. **Build Project**:
   - Install the dependencies for your project:
    ```bash
    npm run build
    ```

5. **Run Your Application**:
   - Start your app with PM2:
    ```bash
    pm2 start index.js --name "soundmuve"
    ```
   - Enable PM2 to restart your app on reboot:
    ```bash
    pm2 startup
    pm2 save
    ```

---


## **Step 4: Configure a Reverse Proxy with Nginx**

1. **Install Nginx**:
   - Install Nginx to serve your application:
    ```bash
    sudo apt install nginx -y
    ```

2. **Configure Nginx**:
   - Open a new configuration file:
    ```bash
    sudo nano /etc/nginx/sites-available/soundmuve
    ```
   - Add the following configuration:
    ```nginx

        server {
            listen 80;
            server_name your_droplet_ip api.soundmuve.com www.api.soundmuve.com;

            location / {
                proxy_pass http://localhost:3000; # Replace with your app's port
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }

            # Redirect HTTP to HTTPS
            return 301 https://$host$request_uri;
        }

        server {
            listen 443 ssl;
            server_name your_droplet_ip api.soundmuve.com www.api.soundmuve.com;

            ssl_certificate /etc/letsencrypt/live/api.soundmuve.com/fullchain.pem; # Certbot SSL
            ssl_certificate_key /etc/letsencrypt/live/api.soundmuve.com/privkey.pem;

            location / {
                proxy_pass http://localhost:3000; # Replace with your app's port
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
        }
    ```
   - Save and exit the editor.

3. **Enable the Configuration**:
   - Create a symbolic link to enable the configuration:
    ```bash
    sudo ln -s /etc/nginx/sites-available/soundmuve /etc/nginx/sites-enabled/
    ```
   - Test Nginx configuration:
    ```bash
    sudo nginx -t
    ```
   - Restart Nginx:
    ```bash
    sudo systemctl restart nginx
    ```

4. **Allow Traffic on Port 80**:
   - Update the firewall to allow HTTP traffic:
    ```bash
    sudo ufw allow 'Nginx Full'
    ```

---

## **Step 5: Access Your Application**

- Open your browser and go to `http://your_droplet_ip`. You should see the app response message from your Express app.

---

## **Optional Steps**

1. **Set Up a Domain**:
   - Point a domain name to your droplet’s IP address using your domain registrar’s DNS settings.
   - Update the `server_name` in your Nginx config to match your domain name.

2. **Enable HTTPS**:
   - Use Let's Encrypt to secure your app with HTTPS:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d yourdomain.com
    ```

---

Application is live on DigitalOcean!

---
---


# Steps to Update a Running Application on DigitalOcean

## Step 1: Prepare the Updated Code
1. **Ensure Your Local Code is Updated**:
   - Commit and push all changes to your repository (e.g., GitHub, GitLab, etc.).

2. **Log In to the Droplet**:
   - Use SSH to connect:
     ```bash
    ssh -i ~/.ssh/soundmuve_key root@your_droplet_ip
     ```

---

## Step 2: Back Up Your Current App
1. Navigate to the directory where your app is located:
    ```bash
    cd /path/to/your/app
    ```

2. Create a backup of your current app:
    ```bash
    cp -r /path/to/your/app /path/to/your/backup_directory
    ```

---

## Step 3: Pull the Updated Code
If you're using Git:
1. Navigate to your app directory:
    ```bash
    cd /path/to/your/app
    ```

2. Pull the latest changes from your repository:
    ```bash
    git pull origin main
    ```
    Replace `main` with the branch you're using, if different.

---

## Step 4: Install Dependencies
1. Ensure you are in your app directory.
2. Install or update dependencies:
    ```bash
    npm install
    ```

---

## Step 5: Build the Application (If Necessary)
If your app requires building (e.g., React or Angular frontend, TypeScript backend):
1. Build the app:
    ```bash
    npm run build
    ```
    Ensure your `package.json` has a `build` script configured.

---

## Step 6: Restart the Application
If your app is running with a process manager like PM2:
1. List running processes:
    ```bash
    pm2 list
    ```

2. Restart the application:
    ```bash
    pm2 restart <app_name>
    ```
    Replace `<app_name>` with your app's name or ID.

3. (Optional) If you made changes to the environment variables, reload the app:
    ```bash
    pm2 reload <app_name>
    ```

If you're using `systemctl` or `forever`, use the appropriate command to restart your app.

---

## Step 7: Verify the Update
1. Check your app logs to ensure everything is running correctly:
    ```bash
    pm2 logs <app_name>
    ```
    Or for other methods:
    ```bash
    journalctl -u <your_app_service_name>
    ```

2. Open your app in a browser or use `curl` to test its endpoint:
    ```bash
    curl http://your_domain_or_ip
    ```

---

## Step 8: Clean Up
- Remove any unnecessary backup files if the update is successful:
    ```bash
    rm -rf /path/to/your/backup_directory
    ```

---

**Written with 💞️❤️ By: Sunday Etom (https://github.com/etomeni)**