DROP TABLE IF EXISTS BuddeRequests;
CREATE TABLE BuddeRequests(
    notif_id SERIAL PRIMARY KEY,
    owner_user_id INT REFERENCES users (user_id) ON DELETE CASCADE NOT NULL,
    time_created TIMESTAMP DEFAULT now() NOT NULL,
    message VARCHAR(500) NOT NULL,
    sender_name VARCHAR(50) NOT NULL,
    other_user_id INT REFERENCES users (user_id) ON DELETE CASCADE NOT NULL,
    link VARCHAR(256)
    );
CREATE INDEX ON BuddeRequests (owner_user_id);

INSERT INTO BuddeRequests (owner_user_id, sender_name, other_user_id, message) VALUES (1, 'Jak Daxter', 6, 'Jak Daxter would like to be your Budde!');
INSERT INTO BuddeRequests (owner_user_id, sender_name, message) VALUES (6, 'WorkoutBuddeWebsite', 'How Are You Doing?');
INSERT INTO BuddeRequests (owner_user_id, sender_name, other_user_id, message) VALUES (2, 'Jak Daxter', 891480, 'Jak Daxter would like to be your Budde!');
INSERT INTO BuddeRequests (owner_user_id, sender_name, other_user_id, message) VALUES (1, 'Vinay Johnson', 8967, 'Vinay Johnson would like to be your Budde!');

GRANT ALL PRIVILEGES ON BuddeRequests TO app;
GRANT ALL PRIVILEGES ON budderequests_notif_id_seq TO app;

DROP TABLE IF EXISTS Buddes;
--Always have user_1 be the user with the smaller user_id (the ordering is arbitrary)
CREATE TABLE Buddes(
    user_1 INT REFERENCES users (user_id) ON DELETE CASCADE,
    user_2 INT REFERENCES users (user_id) ON DELETE CASCADE,
    time_created TIMESTAMP DEFAULT now() NOT NULL,
    PRIMARY KEY (user_1, user_2)
    );

GRANT ALL PRIVILEGES ON Buddes TO app;

DROP TABLE IF EXISTS ContactInfo;
CREATE TABLE ContactInfo(
    user_id INT PRIMARY KEY REFERENCES users (user_id) ON DELETE CASCADE,
    email VARCHAR(50),
    phone_num VARCHAR(20)
    );

INSERT INTO ContactInfo (user_id, phone_num) VALUES (1, '630-479-4012');
INSERT INTO ContactInfo (user_id, phone_num) VALUES (3, '815-867-5309');
INSERT INTO ContactInfo (user_id, phone_num, email) VALUES (2, '847-987-8652', 'cnelson@gmail.com');

GRANT ALL PRIVILEGES ON ContactInfo TO app;
