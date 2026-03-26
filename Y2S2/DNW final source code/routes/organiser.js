const express = require('express');
const router = express.Router();

// Prevent logged-in attendee from accessing organiser routes
router.use((req, res, next) => {
  if (req.session.attendeeId) {
    return res.redirect('/attendee/conflict');
  }
  next();
});

// Login authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.organiser) {
    return next();
  } else {
    return res.redirect('/organiser/login');
  }
}

/**
 * GET /organiser
 * Purpose: Render the organiser dashboard with site info and events
 */
router.get('/', isAuthenticated, (req, res) => {
  // Get site settings
  global.db.get('SELECT name, description FROM site_settings LIMIT 1', [], (err, siteSettings) => {
    if (err) return res.status(500).send("Error fetching site settings");

    // Get all events (published and draft)
    const eventsSql = `
      SELECT 
        e.*,
        COALESCE(SUM(b.full_tickets), 0) AS full_booked,
        COALESCE(SUM(b.concession_tickets), 0) AS concession_booked
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      GROUP BY e.id
      ORDER BY e.date ASC
    `;

    global.db.all(eventsSql, [], (err, events) => {
      if (err) return res.status(500).send("Error fetching events");

      // Add this part inside the callback
      events.forEach(event => {
        event.full_remaining = event.full_quantity - event.full_booked;
        event.concession_remaining = event.concession_quantity - event.concession_booked;
        event.total_remaining = event.full_remaining + event.concession_remaining;
      });

      const publishedEvents = events.filter(e => e.status === 'published');
      const draftEvents = events.filter(e => e.status === 'draft');

      res.render('organiser/home', {
        title: siteSettings.name || "Organiser Dashboard",
        description: siteSettings.description || "",
        publishedEvents,
        draftEvents
      });
    });
  });
});

/**
 * GET /organiser/create
 * Purpose: Create a new draft event and redirect to its edit page
 */
router.get('/create', isAuthenticated, (req, res) => {
  const sql = `
    INSERT INTO events (title, description, date, status, created_at)
    VALUES (?, ?, ?, 'draft', datetime('now'))
  `;
  const defaultTitle = 'Untitled Event';
  const defaultDescription = '';
  const defaultDate = '';

  global.db.run(sql, [defaultTitle, defaultDescription, defaultDate], function (err) {
    if (err) {
      console.error("Error creating event:", err);
      return res.status(500).send("Unable to create event");
    }
    // Redirect to the edit page for the new event
    res.redirect(`/organiser/event/${this.lastID}`);
  });
});

/**
 * GET /organiser/event/:id
 * Purpose: Render the edit form for a specific event
 */
router.get('/event/:id', isAuthenticated, (req, res) => {
  const eventId = req.params.id;
  global.db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, event) => {
    if (err || !event) {
      return res.status(404).send("Event not found");
    }

    res.render('organiser/edit-event', { event });
  });
});

/**
 * POST /organiser/event/:id
 * Purpose: Save changes to an existing event
 */
router.post('/event/:id', isAuthenticated, (req, res) => {
  const eventId = req.params.id;
  const {
    title,
    description,
    date,
    full_price,
    full_quantity,
    concession_price,
    concession_quantity
  } = req.body;

  const sql = `
    UPDATE events SET
      title = ?, description = ?, date = ?, full_price = ?, full_quantity = ?,
      concession_price = ?, concession_quantity = ?, updated_at = datetime('now')
    WHERE id = ?
  `;

  const values = [
    title,
    description,
    date,
    full_price,
    full_quantity,
    concession_price,
    concession_quantity,
    eventId
  ];

  global.db.run(sql, values, function (err) {
    if (err) {
      console.error("Error updating event:", err);
      return res.status(500).send("Failed to update event");
    }

    res.redirect('/organiser');
  });
});

/**
 * POST /organiser/publish/:id
 * Purpose: Set event status to 'published'
 */
router.post('/publish/:id', isAuthenticated, (req, res) => {
  const eventId = req.params.id;

  const sql = `UPDATE events SET status = 'published', updated_at = datetime('now') WHERE id = ?`;

  global.db.run(sql, [eventId], function (err) {
    if (err) {
      console.error("Error publishing event:", err);
      return res.status(500).send("Failed to publish event");
    }

    res.redirect('/organiser');
  });
});

/**
 * POST /organiser/delete/:id
 * Purpose: Permanently delete an event
 */
router.post('/delete/:id', isAuthenticated, (req, res) => {
  const eventId = req.params.id;

  const sql = `DELETE FROM events WHERE id = ?`;

  global.db.run(sql, [eventId], function (err) {
    if (err) {
      console.error("Error deleting event:", err);
      return res.status(500).send("Failed to delete event");
    }

    res.redirect('/organiser');
  });
});

/**
 * GET /organiser/settings
 * Purpose: Show the site settings edit form
 */
router.get('/settings', isAuthenticated, (req, res) => {
  global.db.get('SELECT * FROM site_settings LIMIT 1', [], (err, settings) => {
    if (err) return res.status(500).send("Unable to load settings");
    res.render('organiser/settings', { settings });
  });
});

/**
 * POST /organiser/settings
 * Purpose: Save new site settings
 */
router.post('/settings', isAuthenticated, (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).send("Both name and description are required.");
  }

  const sql = `UPDATE site_settings SET name = ?, description = ?`;
  global.db.run(sql, [name, description], function (err) {
    if (err) {
      console.error("Error updating site settings:", err);
      return res.status(500).send("Failed to update settings");
    }

    res.redirect('/organiser');
  });
});

// GET /organiser/bookings — View all attendee bookings
router.get('/bookings', isAuthenticated, (req, res) => {
  const sql = `
    SELECT b.id, b.attendee_name, b.full_tickets, b.concession_tickets, b.created_at, e.title AS event_title
    FROM bookings b
    JOIN events e ON b.event_id = e.id
    ORDER BY b.created_at DESC
  `;

  global.db.all(sql, [], (err, bookings) => {
    if (err) return res.status(500).send("Failed to load bookings");
    res.render('organiser/bookings', { bookings });
  });
});

// GET Login form
router.get('/login', (req, res) => {
  if (req.session.organiser) {
    return res.redirect('/organiser');
  }
  res.render('organiser/login', { error: null });
});

// POST Login form
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Clear attendee session if exists
  if (req.session.attendeeId) {
    req.session.attendeeId = null;
    req.session.attendeeName = null;
  }

  if (username === 'admin' && password === 'pass123') {
    req.session.organiser = username;
    return res.redirect('/organiser');
  }

  res.render('organiser/login', { error: 'Invalid credentials' });
});


// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Conflict routing 
router.get('/conflict', (req, res) => {
  res.render('organiser/conflict');
});

module.exports = router;