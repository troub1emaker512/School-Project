
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

-- USERS & EMAIL ACCOUNTS

-- Table: users
-- Stores basic user information (for email account associations)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique identifier for each user
    user_name TEXT NOT NULL -- User's name
);

-- Table: email_accounts
-- Stores email addresses linked to users
CREATE TABLE IF NOT EXISTS email_accounts (
    email_account_id INTEGER PRIMARY KEY AUTOINCREMENT, 
    email_address TEXT NOT NULL, 
    user_id  INT, --the user that the email account belongs to
    FOREIGN KEY (user_id) REFERENCES users(user_id) 
);

-- Insert default data (if necessary here)

-- Table: site_settings
-- Stores site-wide configurable settings like name and description
CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Table: events
-- Stores all event details, including status, pricing, and ticket availability
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  status TEXT CHECK(status IN ('draft', 'published')) NOT NULL DEFAULT 'draft',
  full_price REAL DEFAULT 0,
  full_quantity INTEGER DEFAULT 0,
  concession_price REAL DEFAULT 0,
  concession_quantity INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- Table: bookings
-- Tracks bookings made for events, anonymous or registered
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  attendee_name TEXT NOT NULL,
  full_tickets INTEGER DEFAULT 0,
  concession_tickets INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Attendee Registration details
CREATE TABLE IF NOT EXISTS registered_attendees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Default homepage settings
INSERT INTO site_settings (name, description)
VALUES ('My Events Hub', 'Welcome to your personalised event manager!');

-- Sample users for email accounts
INSERT INTO users ('user_name') VALUES ('Simon Star');
INSERT INTO users ('user_name') VALUES ('Dianne Dean');
INSERT INTO users ('user_name') VALUES ('Harry Hilbert');

-- Sample email accounts linked to users
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@gmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@hotmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('dianne@yahoo.co.uk', 2); 

COMMIT;

