CREATE TABLE IF NOT EXISTS Users (
    username VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS PasswordHistory (
    username VARCHAR(255) NOT NULL,
    element_id VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    time_changed TIMESTAMP NOT NULL,
    PRIMARY KEY (element_id, time_changed, password),
    FOREIGN KEY (username) REFERENCES Users(username)
);
