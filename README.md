# PasswordManager

## Get Started

### Backend

1) Change directory to backend folder.
2) Install the required npm packages: `npm i`
3) Create a postgres database called example: passwordmanager and run the initpgdb.sql script [here](/backend/dbmanager/initpgdb.sql).
4) Create a .env file in the backend folder with the following variables as an example:
    - PGDBUSERNAME=postgres
    - PGDBHOST=localhost
    - PGDBNAME=passwordmanager
    - PGDBPASSWORD=password
    - PGDBPORT=5432
    - NEO4J_URI=bolt://localhost:7687
    - NEO4J_USERNAME=neo4j
    - NEO4J_PASSWORD=password
    - JWT_SECRET=I_Love_hack_@_roll_2024
    - WEBPORT=3600 
5) Start the backend server: `npm start`

### Frontend

1) Change directory to the frontend folder first.
2) Install the required npm packages: `npm i`
2) Start the frontend server: `npm run start`
