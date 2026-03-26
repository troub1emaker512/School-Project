const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Prevent logged-in organiser from accessing attendee routes
router.use((req, res, next) => {
  if (req.session.organiser) {
    return res.redirect('/organiser/conflict');
  }
  next();
});

// Middleware to protect authenticated users' dashboard
function isAuthenticated(req, res, next) {
  if (req.session && req.session.attendeeId) {
    return next();
  }
  res.redirect('/attendee/login');
}

// GET /attendee — attendee homepage (list of published events)
router.get('/', (req, res) => {
  const siteSql = 'SELECT * FROM site_settings LIMIT 1';
  const eventsSql = `
    SELECT 
      e.*,
      COALESCE(SUM(b.full_tickets), 0) AS full_booked,
      COALESCE(SUM(b.concession_tickets), 0) AS concession_booked
    FROM events e
    LEFT JOIN bookings b ON e.id = b.event_id
    WHERE e.status = 'published'
    GROUP BY e.id
    ORDER BY e.date ASC
  `;

  global.db.get(siteSql, [], (err, siteSettings) => {
    if (err) return res.status(500).send("Failed to load site settings");

    global.db.all(eventsSql, [], (err, events) => {
      if (err) return res.status(500).send("Failed to load events");

      events.forEach(event => {
        event.full_remaining = event.full_quantity - event.full_booked;
        event.concession_remaining = event.concession_quantity - event.concession_booked;
        event.total_remaining = event.full_remaining + event.concession_remaining;
      });

      const isLoggedIn = req.session && req.session.attendeeId;
      res.render('attendee/home', {
        title: siteSettings.name,
        description: siteSettings.description,
        events,
        isLoggedIn,
        userName: req.session.attendeeName || null
      });
    });
  });
});

// GET /attendee/event/:id — event detail page
router.get('/event/:id', (req, res) => {
  const eventId = req.params.id;
  const sql = `SELECT * FROM events WHERE id = ? AND status = 'published'`;

  global.db.get(sql, [eventId], (err, event) => {
    if (err || !event) return res.status(404).send("Event not found");

    const bookingSql = `
      SELECT 
        COALESCE(SUM(full_tickets), 0) AS full_booked,
        COALESCE(SUM(concession_tickets), 0) AS concession_booked
      FROM bookings
      WHERE event_id = ?
    `;

    global.db.get(bookingSql, [eventId], (err, bookingSummary) => {
      if (err) return res.status(500).send("Failed to load bookings");

      event.full_remaining = event.full_quantity - bookingSummary.full_booked;
      event.concession_remaining = event.concession_quantity - bookingSummary.concession_booked;

      res.render('attendee/event', {
        event,
        error: req.query.error || null
      });
    });
  });
});

// POST /attendee/event/:id/book — submit booking
router.post('/event/:id/book', (req, res) => {
  const eventId = req.params.id;
  const { name, full_tickets = 0, concession_tickets = 0 } = req.body;

  const full = parseInt(full_tickets);
  const concession = parseInt(concession_tickets);

  if (!name || (full + concession <= 0)) {
    return res.redirect(`/attendee/event/${eventId}?error=Please enter your name and at least one ticket.`);
  }

  const ticketSql = `
    SELECT 
      full_quantity,
      concession_quantity,
      (SELECT COALESCE(SUM(full_tickets), 0) FROM bookings WHERE event_id = ?) AS full_booked,
      (SELECT COALESCE(SUM(concession_tickets), 0) FROM bookings WHERE event_id = ?) AS concession_booked
    FROM events WHERE id = ?
  `;

  global.db.get(ticketSql, [eventId, eventId, eventId], (err, row) => {
    if (err || !row) {
      return res.redirect(`/attendee/event/${eventId}?error=Event not found or unavailable.`);
    }

    const full_remaining = row.full_quantity - row.full_booked;
    const concession_remaining = row.concession_quantity - row.concession_booked;

    if (full > full_remaining || concession > concession_remaining) {
      return res.redirect(`/attendee/event/${eventId}?error=Not enough tickets available. Please try fewer tickets or another event.`);
    }

    // All good, insert booking
    const insertSql = `
      INSERT INTO bookings (event_id, attendee_name, full_tickets, concession_tickets)
      VALUES (?, ?, ?, ?)
    `;
    global.db.run(insertSql, [eventId, name.trim(), full, concession], function (err) {
      if (err) return res.redirect(`/attendee/event/${eventId}?error=Booking failed. Please try again.`);
      res.redirect(`/attendee/confirmation?name=${encodeURIComponent(name.trim())}`);
    });
  });
});


// GET /attendee/confirmation — Show confirmation page
router.get('/confirmation', (req, res) => {
  const name = req.query.name;
  res.render('attendee/confirmation', { name });
});

// Middleware to protect dashboard
function isAuthenticated(req, res, next) {
  if (req.session && req.session.attendeeId) {
    return next();
  }
  res.redirect('/attendee/login');
}

// GET: Register
router.get('/register', (req, res) => {
  res.render('attendee/register');
});

// POST: Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).send("All fields required.");

  const hashedPassword = bcrypt.hashSync(password, 10);

  const sql = `INSERT INTO registered_attendees (name, email, password) VALUES (?, ?, ?)`;
  global.db.run(sql, [name, email, hashedPassword], function (err) {
    if (err) return res.status(400).send("Email already registered.");
    req.session.attendeeId = this.lastID;
    req.session.attendeeName = name;
    res.redirect('/attendee/dashboard');
  });
});

// GET: Login
router.get('/login', (req, res) => {
  if (req.session.attendeeId) {
    return res.redirect('/attendee/dashboard');
  }
  res.render('attendee/login');
});


// POST: Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Clear organiser session if exists
  if (req.session.organiser) {
    req.session.organiser = null;
  }

  const sql = `SELECT * FROM registered_attendees WHERE email = ?`;
  global.db.get(sql, [email], (err, user) => {
    if (err || !user) return res.status(401).send("Invalid login.");

    if (bcrypt.compareSync(password, user.password)) {
      req.session.attendeeId = user.id;
      req.session.attendeeName = user.name;
      res.redirect('/attendee/dashboard');
    } else {
      res.status(401).send("Invalid login.");
    }
  });
});

// GET: Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  const name = req.session.attendeeName;
  const userId = req.session.attendeeId;

  const sql = `
    SELECT b.*, e.title, e.date FROM bookings b
    JOIN events e ON e.id = b.event_id
    WHERE b.attendee_name = ?
    ORDER BY e.date ASC
  `;

  global.db.all(sql, [name], (err, bookings) => {
    if (err) return res.status(500).send("Error loading bookings");
    res.render('attendee/dashboard', { name, bookings });
  });
});

// GET: Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Conflict routing 
router.get('/conflict', (req, res) => {
  res.render('attendee/conflict');
});

module.exports = router;
