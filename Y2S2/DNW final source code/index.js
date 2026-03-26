/**
* index.js
* This is your main app entry point
*/

// Set up express, bodyparser and EJS
const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const session = require('express-session');

// Login auth for organiser
app.use(session({
  secret: 'char-secret-key', 
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files

// Set up SQLite
// Items in the global namespace are accessible throught out the node application
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
    }
});

// Handle requests to the home page 
app.get('/', (req, res) => {
    global.db.get('SELECT name, description FROM site_settings LIMIT 1', [], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Error loading site settings");
        }

        res.render('home', {
            title: row?.name || 'Event Manager',
            description: row?.description || 'Your go-to platform for events'
        });
    });
});


// Add all the route handlers in usersRoutes to the app under the path /users
const usersRoutes = require('./routes/users');
app.use('/users', usersRoutes);

const organiserRoutes = require('./routes/organiser');
app.use('/organiser', organiserRoutes);

const attendeeRoutes = require('./routes/attendee');
app.use('/attendee', attendeeRoutes);

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

