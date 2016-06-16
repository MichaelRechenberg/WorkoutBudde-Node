
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
        state VARCHAR(30) NOT NULL,
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
        mon_start_time TIME,
        tues_start_time TIME,
        wed_start_time TIME,
        thurs_start_time TIME,
        fri_start_time TIME,
        sat_start_time TIME,
        sun_start_time TIME,
        mon_end_time TIME,
        tues_end_time TIME,
        wed_end_time TIME,
        thurs_end_time TIME,
        fri_end_time TIME,
        sat_end_time TIME,
        sun_end_time TIME,
        intensity VARCHAR(1) NOT NULL
        );

/**
  The following INSERT's create dummy users to test queries on 
  They all have the same login, but different exercises, location, etc
  Do a y9 on each one to yank it
  */
INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, coord, earth_coord, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity) 
    VALUES ('AzureDiamond', '7a365de276c45ad70d16', 
            '0c13d9eb8c87513334a6f075796434353cdae33de8496f88012b7894550530481605f5c37e0863f8aff2f7ec34fb7e8b5730082a14ec1aa20002f41aefee2169',
            'Michael', 'Rechenberg', '8617 Kemman Road.', 'Hebron', 'IL', 60034, 
         POINT(42.452107, -88.413442), 
         ll_to_earth(42.452107, -88.413442),
         False, False, True, False, True, True, False, False, False, True, True, True, True, False,
         '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time,
         'C'
         );

--Cody Nelson: Route 173 Hebron
INSERT INTO users (username, salt, password, firstname, lastname, street, city, state, zip_code, coord, earth_coord, exer_swimming, exer_cycling, exer_lifting, exer_running, exer_yoga, exer_outdoor_sports, exer_indoor_sports, mon, tues, wed, thurs, fri, sat, sun, mon_start_time, tues_start_time, wed_start_time, thurs_start_time, fri_start_time, sat_start_time, sun_start_time, mon_end_time, tues_end_time, wed_end_time, thurs_end_time, fri_end_time, sat_end_time, sun_end_time, intensity) 
    VALUES ('BigNelly', '7a365de276c45ad70d16', 
            '0c13d9eb8c87513334a6f075796434353cdae33de8496f88012b7894550530481605f5c37e0863f8aff2f7ec34fb7e8b5730082a14ec1aa20002f41aefee2169',
            'Cody', 'Nelson', '13376 Route 173', 'Hebron', 'IL', 60034, 
         POINT(42.464775, -88.457035), 
         ll_to_earth(42.464775, -88.457035),
         False, False, True, False, True, True, False, False, False, True, True, True, True, False,
         '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time, '08:00'::time,
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

