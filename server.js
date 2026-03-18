const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
require("dotenv").config();

// -------------------------
//using environment variable for security
// -------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// -------------------------
//these webpages require administrator privilleges to access/modify database information
// -------------------------
app.get("/add-item.html", requireAdmin, (req, res) => {
  res.sendFile(__dirname + "/public/add-item.html");
});

app.get("/edit-item.html", requireAdmin, (req, res) => {
  res.sendFile(__dirname + "/public/edit-item.html");
});

// -------------------------
//default webpage visitor
// -------------------------
app.use(express.static("public"));

// -------------------------
//authorization admin check
// -------------------------
function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.redirect("/login.html");
  }
  console.log("Session:", req.session);
  next();
}

// -------------------------
// CONNECT TO DATABASE
// -------------------------
const db = new sqlite3.Database("./collection.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// -------------------------
//API Route to SQL
//(Inserts Add-Item form information into database)
// -------------------------
app.post("/api/ownedItems", requireAdmin, (req, res) => {
  const {
    item_type, item_name, artist_name, pb_label,
    komca_number, release_date, item_rarity, purchase_location, condition, est_marketprice, notes, image_front_url
  } = req.body;

  db.run(
    `
    INSERT INTO ownedItems
    (item_type, item_name, artist_name, publishing_label, komca_number, release_date, item_rarity, purchase_location,
    condition, est_marketprice, notes, image_front_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [item_type, item_name, artist_name, pb_label, komca_number, release_date,
     item_rarity, purchase_location, condition, est_marketprice, notes, image_front_url],
    () => res.json({ success: true })
  );
});
app.post("/api/ownedPhotocards", requireAdmin, (req, res) => {
  const {
    artist_name, member, pc_source, version,
    pc_rarity, purchase_location, condition, trade_value, notes, image_front_url, image_back_url
  } = req.body;

  db.run(
    `
    INSERT INTO ownedPhotocards
    (artist_name, member, pc_source, pc_version, pc_rarity,
     purchase_location, condition, trade_value, notes, image_front_url, image_back_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [artist_name, member, pc_source, version,
     pc_rarity, purchase_location, condition, trade_value, notes, image_front_url, image_back_url],
    () => res.json({ success: true })
  );
});


// -------------------------
//API to read items from database
//(fetches information from database to be used and displayed on the webpage)
// -------------------------
app.get("/api/ownedItems", (req, res) => {
  db.all("SELECT * FROM ownedItems ORDER BY item_name COLLATE NOCASE", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.get("/api/ownedPhotocards", (req, res) => {
  db.all("SELECT * FROM ownedPhotocards ORDER BY artist_name, member COLLATE NOCASE", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// -------------------------
// Get single photocard by ID 
//(for id search in museum page)
// -------------------------
app.get("/api/ownedPhotocards/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get(
    "SELECT * FROM ownedPhotocards WHERE id = ?",
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!row) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(row);
    }
  );
});

// -------------------------
// Get a single album by ID (must be before the "all items" route)
// -------------------------
app.get("/api/ownedItems/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM ownedItems WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Album not found" });
    res.json(row);
  });
});

// -------------------------
//Orders photocards by artists name
//finds null values in database table, replaces those values on the website ONLY with filler title "unknown"
// -------------------------
app.get("/api/ownedPhotocards", requireAdmin, (req, res) => {
  db.all(
    `
      SELECT 
        id,
        COALESCE(artist_name, '') ||
        ' - ' ||
        COALESCE(member, 'Unknown') ||
        ' (' ||
        COALESCE(pc_version, 'Unknown Source') ||
        ')' AS display_name
      FROM ownedPhotocards
      ORDER BY artist_name COLLATE NOCASE
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// -------------------------
// Update photocard (for admin edit)
// -------------------------
app.put("/api/ownedPhotocards/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    pc_source,
    pc_version,
    pc_rarity,
    purchase_location,
    condition,
    trade_value,
    image_front_url,
    image_back_url,
    notes
  } = req.body;

  db.run(
    `
    UPDATE ownedPhotocards
    SET
      pc_source = ?,
      pc_version = ?,
      pc_rarity = ?,
      purchase_location = ?,
      condition = ?,
      trade_value = ?,
      image_front_url = ?,
      image_back_url = ?,
      notes = ?
    WHERE id = ?
    `,
    [
      pc_source,
      pc_version,
      pc_rarity,
      purchase_location,
      condition,
      trade_value,
      image_front_url,
      image_back_url,
      notes,
      id
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// -------------------------
// Albums update (for admin edit)
// -------------------------
app.put("/api/ownedItems/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const {
    item_type,
    item_name,
    artist_name,
    publishing_label,
    komca_number,
    release_date,
    item_rarity,
    purchase_location,
    condition,
    est_marketprice,
    notes,
    image_front_url
  } = req.body;

  db.run(
    `
    UPDATE ownedItems
    SET
      item_type = ?,
      item_name = ?,
      artist_name = ?,
      publishing_label = ?,
      komca_number = ?,      -- ✅ FIXED
      release_date = ?,
      item_rarity = ?,
      purchase_location = ?,
      condition = ?,
      est_marketprice = ?,
      notes = ?,
      image_front_url = ?
    WHERE id = ?
    `,
    [
      item_type,
      item_name,
      artist_name,
      publishing_label,
      komca_number,
      release_date,
      item_rarity,
      purchase_location,
      condition,
      est_marketprice,
      notes,
      image_front_url,
      id
    ],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database update failed" });
      }
      res.json({ success: true });
    }
  );
});



// -------------------------
//Login to Session
// -------------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM admins WHERE username = ?",
    [username],
    (err, admin) => {
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      bcrypt.compare(password, admin.password_hash, (err, match) => {
        if (!match) {
          return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.adminId = admin.id;
        res.json({ success: true });
      });
    }
  );
});

// -------------------------
//Logout of session
// -------------------------
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    return res.redirect("/login.html");
  });
});

// -------------------------
// Start server (type "node server.js")
// -------------------------
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});