# CAB230-AS2
The repository for Isaac Shea's submission of the CAB230 AS2.

# Installation guide - QUT Virtual Machine Only
### 1. Download this repository onto the VM

### 2. Open a terminal within the folder
1. Unzip the folder if required. 
2. Right-click on the wallpaper and select `"Open terminal"`, then type `cd CAB230-AS2-main`.

### 4. Create the mySQL database
1. Type `sudo mysql -u root -p`, then enter the Virtual Machine's password. This should open the mySQL command line.
2. Use `CREATE DATABASE volcanoes_db;` to generate a new database, and `USE volcanoes_db;` to change to that database.
3. Type `source volcanoes_schema.sql` to generate and populate the database with necessary information.
4. Use `show tables;` to ensure this command worked. You should see `users` and `volcanoes` tables.

### 5. Installing dependencies
Run `npm install --save` to install dependencies.

### 6. Updating the Knexfile
1. Open `knexfile.js` in Visual Studio Code (`right click > Open With Visual Studio Code`).
2. Change the `connection > password` value to the VM's password.
3. Save this file.

### 7. Creating self-signed keys
1. Run the following command: `sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/node-selfsigned.key -out /etc/ssl/certs/node-selfsigned.crt`.
2. Follow an instructions and enter information as required.

### 8. Adding a .env file
1. Within the base directory of the app, create a file entitled `.env`, and paste the following contents: 
```bash
PORT=443
SECRET_KEY="secret key"
```

### 9. Running the server
1. Navigate to the root directory in the terminal by using `cd ..`.
2. Use `sudo chown root CAB230-AS2-main`.
3. Navigate back into the directory with `cd CAB230-AS2-main`.
4. Start the file with `sudo npm start`, then enter the VM's password. The server should start on port 443.
5. Navigate to the VM's IP address from another device connected to the QUT VPN, and you'll be greeted with the Swagger docs!
