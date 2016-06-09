
DROP TABLE IF EXISTS gyms CASCADE;
CREATE TABLE gyms(
        id SERIAL,
        street VARCHAR(40) NOT NULL,
        city VARCHAR(30) NOT NULL,
        zip_code INT NOT NULL,
        coord POINT NOT NULL,
        earth_coord EARTH,
        PRIMARY KEY(id)
        );

INSERT INTO gyms (street, city, zip_code, coord) VALUES
        ('9080 Derp Ln.', 'Hebron', 60034, 
         POINT(42.45148, -88.413548));

DROP TABLE IF EXISTS users;
CREATE TABLE users(
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(30) NOT NULL,
        salt VARCHAR(20) NOT NULL,
        password VARCHAR(128) NOT NULL,
        firstname VARCHAR(50) NOT NULL,
        lastname VARCHAR(50) NOT NULL,
        street VARCHAR(40) NOT NULL,
        city VARCHAR(30) NOT NULL,
        zip_code INT NOT NULL,
        gym_id INT,
        coord POINT NOT NULL,
        earth_coord EARTH,
        exer_swimming BOOLEAN NOT NULL,
        exer_cycling BOOLEAN NOT NULL,
        exer_lifting BOOLEAN NOT NULL,
        exer_running BOOLEAN NOT NULL,
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
        sun_end_time TIME NOT NULL,
        intensity VARCHAR(1) NOT NULL
        );

INSERT INTO users (username, salt, password, firstname, lastname, street, city, zip_code, coord, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity) 
    VALUES ('AzureDiamond', 'dota2', 'hunter2', 'Michael', 'Rechenberg', '8617 Kemman Road.', 'Hebron', 60034, POINT(40.12432, -86.432234), 
         False, False, True, False, True, True, False, False, False, True, True, True, True, False,
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
         '08:00:00'::time,
         'C'
         );
DROP TABLE IF EXISTS test;
CREATE TABLE test(
        derp POINT NOT NULL,
        asdf TIME NOT NULL
        );
GRANT ALL PRIVILEGES ON users TO app;
GRANT ALL PRIVILEGES ON users_user_id_seq TO app;
GRANT ALL PRIVILEGES ON gyms TO app;
GRANT ALL PRIVILEGES ON gyms_id_seq TO app;
GRANT ALL PRIVILEGES ON test TO app;

