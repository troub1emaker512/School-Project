# Event Manager Application

## Setup Instructions
1. Run `npm install` to install dependencies.
2. Run `npm run build-db` to set up the database.
3. Run `npm start` to launch the server at http://localhost:3000/

## Additional Packages Used
- express-session
- body-parser
- sqlite3
- bcrypt
- ejs

## Features
- Organiser and Attendee user flows
- Session-based login/logout for both user types
- Booking system with ticket availability tracking
- Conflict resolution between organiser/attendee login sessions
- Styled pages with dynamic routing and validations
- Admin login for organiser, Username: admin, Password: pass123

## Note:
- This project uses Bootstrap 5 for styling via CDN at: https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css. 
- Internet connection would be required to load Bootstrap styles from the CDN.