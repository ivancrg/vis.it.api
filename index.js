const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
});

const PORT = 3001;

app.set("port", process.env.PORT || 3000);

app.use(cors());

app.use(express.json()); //grabbing info from frontend as json
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/getUsers", (req, res) => {
  const sqlSelect = "SELECT * FROM users";

  db.query(sqlSelect, (err, result) => {
    if (err) {
      // Database error

      console.log("Error: " + err);

      return;
    }

    res.send(result);
    return;
  });
});

app.get("/getUser", (req, res) => {
  const username = req.query.username;
  const sqlSelect = "SELECT * FROM users WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      // Database error

      console.log("Error: " + err);

      return;
    }

    if (result[0]) {
      // {...obj1, ...obj2} combines two JSON objects into one
      res.send({ ...result[0], ...{ feedback: "user_found" } });
    } else {
      res.send({ feedback: "user_not_found" });
    }

    return;
  });
});

/*app.put("/api/updateQueryExample", (req, res) => {
  console.log("Running on 3001/api/updateQueryExample");

  const id = req.body.username;
  const sqlUpdate = "UPDATE table_x SET variable_x = 5 WHERE id = ?; ";

  res.send({ valid: id });
  // db.query(sqlUpdate, [id], (err, result) => {
  //   if (err) {
  //     res.send({ valid: false });
  //     console.log("Error: " + err);
  //   } else {
  //     res.send({ valid: true });
  //   }
  // });
});*/

app.patch("/updateUser/:username", (req, res) => {
  const username = req.params.username;
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;

  const sqlSelect = "SELECT * FROM users WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      // Database error

      res.send({ feedback: "database_error" });
      return;
    } else if (result[0]) {
      // User found

      const sqlUpdate =
        "UPDATE users SET email = ?, first_name = ?, last_name = ? WHERE username = ?";

      db.query(
        sqlUpdate,
        [email, first_name, last_name, username],
        (err, result) => {
          if (err) {
            // Database error while updating user

            res.send({ feedback: "database_error" });

            return;
          } else {
            // No error in sqlInsert query, user updated

            res.send({ feedback: "user_updated" });

            return;
          }
        }
      );

      return;
    } else {
      // User not found, no error in sqlSelect query

      res.send({ feedback: "user_not_found" });
      return;
    }
  });
});

app.patch("/updatePassword/:username", (req, res) => {
  const username_param = req.params.username;
  const username = req.body.username;
  const password = req.body.password;

  if (username.localeCompare(username_param) != 0) {
    res.send({ feedback: "username_mismatch" });

    return;
  }

  const sqlSelect = "SELECT * FROM users WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      // Database error

      res.send({ feedback: "database_error" });
      return;
    } else if (result[0]) {
      // User found

      const sqlUpdate = "UPDATE users SET password = ? WHERE username = ?";

      // HASH THE PASSWORD!

      db.query(sqlUpdate, [password, username], (err, result) => {
        if (err) {
          // Database error while updating user

          res.send({ feedback: "database_error" });

          return;
        } else {
          // No error in sqlInsert query, user updated

          res.send({ feedback: "password_updated" });

          return;
        }
      });

      return;
    } else {
      // User not found, no error in sqlSelect query

      res.send({ feedback: "user_not_found" });
      return;
    }
  });
});

app.post("/login", (req, res) => {
  const username = req.body.username;

  const sqlSelect = "SELECT * FROM users WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      res.send({
        feedback: "database_error",
        password: "",
      });

      return;
    } else {
      if (result[0]) {
        res.send({
          feedback: "user_found",
          password: result[0].password,
        });

        return;
      } else {
        res.send({
          feedback: "user_not_found",
          password: "",
        });

        return;
      }
    }
  });
});

app.post("/register", (req, res) => {
  const first_name = req.body.first_name;
  const last_name = req.body.last_name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  const sqlSelect = "SELECT * FROM users WHERE username = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      // Database error

      res.send({ feedback: "database_error" });
      return;
    } else if (result[0]) {
      // User found, username unavailable

      res.send({ feedback: "username_unavailable" });
      return;
    } else {
      // User not found, no error in sqlSelect query

      const sqlInsert =
        "INSERT INTO users (username, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)";

      db.query(
        sqlInsert,
        [username, email, password, first_name, last_name],
        (err, result) => {
          if (err) {
            // Database error while inserting user

            res.send({ feedback: "database_error" });

            return;
          } else {
            // No error in sqlInsert query, user inserted

            res.send({ feedback: "user_registered" });

            return;
          }
        }
      );
    }
  });
});

app.post("/insertTrip", (req, res) => {
  const country = req.body.country;
  const city = req.body.city;
  const location = req.body.location;
  const travelling_mode = req.body.travelling_mode;
  const date_of_departure = req.body.date_of_departure;
  const necessities = req.body.necessities;
  const participants_description = req.body.participants_description;
  const creator = req.body.creator;

  const sqlInsert =
    "INSERT INTO trips (country, city, location, travelling_mode, date_of_departure, necessities, participants_description, creator) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    sqlInsert,
    [
      country,
      city,
      location,
      travelling_mode,
      date_of_departure,
      necessities,
      participants_description,
      creator,
    ],
    (err, result) => {
      if (err) {
        // Database error while inserting trip data
        res.send({ feedback: "database_error" });
        console.log(err);

        return;
      } else {
        // No error in sqlInsert query, trip inserted successfully
        res.send({ feedback: "trip_inserted" });

        return;
      }
    }
  );
});

app.get("/getUsersTrips", (req, res) => {
  const username = req.query.username;
  const sqlSelect = "SELECT * FROM trips WHERE creator = ?";

  db.query(sqlSelect, [username], (err, result) => {
    if (err) {
      // Database error
      res.send({ feedback: "database_error" });
      console.log("Error: " + err);

      return;
    }
    if (result[0]) {
      // {...obj1, ...obj2} combines two JSON objects into one
      res.send({ ...{ trips: result }, ...{ feedback: "trips_found" } });
    } else {
      res.send({ ...{ trips: result }, ...{ feedback: "trips_not_found" } });
    }

    return;
  });
});

app.listen(process.env.PORT || PORT, () => {
  console.log(`Running on port ${PORT}`);
});
