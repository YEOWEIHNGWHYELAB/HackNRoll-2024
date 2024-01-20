# PasswordManager

## Get Started

### Backend

1) Install the required npm packages: `npm i`
2) Create a postgres database called example: passwordmanager and run the initpgdb.sql script [here](/backend/dbmanager/initpgdb.sql).
3) Create a .env file in the root directory with the following variables as an example:

    - PGDBUSERNAME=postgres
    - PGDBHOST=localhost
    - PGDBNAME=passwordmanager
    - PGDBPASSWORD=password
    - PGDBPORT=5432
    - JWT_SECRET=I_Love_hack_@_roll_2024
    - WEBPORT=3600
4) 
4) Start the backend server: `npm start`

### Frontend

1) Install the required npm packages: `npm i`
2) Start the frontend server: `npm run start`
