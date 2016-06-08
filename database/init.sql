
DROP TABLE IF EXISTS gyms CASCADE;
CREATE TABLE gyms(
        id SERIAL,
        street VARCHAR(40) NOT NULL,
        city VARCHAR(30) NOT NULL,
        zip_code INT NOT NULL,
        pt POINT NOT NULL,
        earth_pt EARTH,
        PRIMARY KEY(id)
        );

INSERT INTO gyms (street, city, zip_code, pt) VALUES
        ('9080 Derp Ln.', 'Hebron', 60034, 
         POINT(42.45148, -88.413548));

DROP TABLE IF EXISTS users;
CREATE TABLE users(
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL,
        salt VARCHAR(20) NOT NULL,
        password VARCHAR(128) NOT NULL,
        street VARCHAR(40) NOT NULL,
        city VARCHAR(30) NOT NULL,
        zip_code INT NOT NULL,
        gym_id INT,
        pt POINT NOT NULL,
        earth_pt EARTH,
        exer_swimming BOOLEAN NOT NULL,
        exer_cycling BOOLEAN NOT NULL,
        exer_lifting BOOLEAN NOT NULL,
        exer_yoga BOOLEAN NOT NULL,
        exer_outdoor_sports BOOLEAN NOT NULL,
        exer_indoor_sports BOOLEAN NOT NULL,
        mon BOOLEAN NOT NULL,
        tues BOOLEAN NOT NULL,
        wed BOOLEAN NOT NULL,
        thurs BOOLEAN NOT NULL,
        fri BOOLEAN NOT NULL,
        sat BOOLEAN NOT NULL,
        sun BOOLEAN NOT NULL,
        mon_start_time TIME NOT NULL,
        tues_start_time TIME NOT NULL,
        wed_start_time TIME NOT NULL,
        thurs_start_time TIME NOT NULL,
        fri_start_time TIME NOT NULL,
        sat_start_time TIME NOT NULL,
        sun_start_time TIME NOT NULL,
        mon_end_time TIME NOT NULL,
        tues_end_time TIME NOT NULL,
        wed_end_time TIME NOT NULL,
        thurs_end_time TIME NOT NULL,
        fri_end_time TIME NOT NULL,
        sat_end_time TIME NOT NULL,
        sun_end_time TIME NOT NULL
        );

INSERT INTO users VALUES (1, 'AzureDiamond', 'dota2', 'hunter2', '8617 Kemman Road.', 'Hebron', 60034, NULL, POINT(40.12432, -86.432234), 
        NULL, False, False, True, False, True, True, False, False, False, True, True, True, False,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time,
         '08:00:00'::time
         );
