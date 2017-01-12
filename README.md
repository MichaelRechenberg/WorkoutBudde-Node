# WorkoutBudde-Node
WorkoutBudde Repo

A pet-project (but no longer hosted) website where users can search for nearby workout partners that share similar interests by inputting their address, having it geocoded client-side, and then using the resulting latitude and longitude server-side to query the database of users using Postgres's earthdistance module.  Users can make an editable profile and send friend requests to other users in order to get their contact information and coordinate workouts with each other.

To run the website would require setting up a PostGres database with user 'app' (with ALL PRIVILEGES) and database 'workoutbudde', then running init.sql and notifications.sql via psql, npm install within this repo, then modifying constants in app.js to connect to PostGres and have Express listen locally rather than at appPrivIP.

