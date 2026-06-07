const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

// -------------------------
// Middleware
// -------------------------
app.use(cors());
app.use(express.json());
require("dotenv").config();

// -------------------------
// IMAGE AUTO RENAMING
// -------------------------
const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    const artist = (req.body.artist_name || "unknown")
      .toLowerCase()
      .replace(/\s+/g, "");

    let folder = "";

  if (req.body.item_name) {
    // ALBUMS
    folder = `public/images/${artist}/albums`;

  } else {

    // PHOTOCARDS
    if (file.fieldname === "image_front") {
      folder = `public/images/${artist}/photocards/front`;
    }

    if (file.fieldname === "image_back") {
      folder = `public/images/${artist}/photocards/back`;
    }
  }

    fs.mkdirSync(folder, { recursive: true });

    cb(null, folder);
  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname);

    if (req.body.item_name) {

      // Album naming
      const safeItem = (req.body.item_name || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      cb(null, `${safeItem}${ext}`);

    } else {

      // Photocard naming
      const safeMember = (req.body.member || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      const safeVersion = (req.body.pc_version || "unknown")
        .toLowerCase()
        .replace(/\s+/g, "_");

      cb(null, `${safeMember}_${safeVersion}${ext}`);
    }
  }
});

const upload = multer({ storage });

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
app.post(
  "/api/ownedItems",
  requireAdmin,
  upload.single("image_front"),
  (req, res) => {
  const {
    item_type, item_name, artist_name, pb_label,
    komca_number, release_date, item_rarity, purchase_location, condition, est_marketprice, notes, image_front
  } = req.body;

  const frontPath = req.file
    ? req.file.path.replace("public", "").replace(/\\/g, "/")
    : existingItem.image_front_url;

  db.run(
    `
    INSERT INTO ownedItems
    (item_type, item_name, artist_name, publishing_label, komca_number, release_date, item_rarity, purchase_location,
    condition, est_marketprice, notes, image_front_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [item_type, item_name, artist_name, pb_label, komca_number, release_date,
     item_rarity, purchase_location, condition, est_marketprice, notes, frontPath],
    () => res.json({ success: true })
  );
});
app.post(
  "/api/ownedPhotocards",
  requireAdmin,
  upload.fields([
    { name: "image_front", maxCount: 1 },
    { name: "image_back", maxCount: 1 }
  ]),
  (req, res) => {
  const {
    artist_name, member, pc_source, version,
    pc_rarity, purchase_location, condition, trade_value, notes, image_front, image_back
  } = req.body;


  db.run(
    `
    INSERT INTO ownedPhotocards
    (artist_name, member, pc_source, pc_version, pc_rarity,
     purchase_location, condition, trade_value, notes, image_front_url, image_back_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [artist_name, member, pc_source, version,
     pc_rarity, purchase_location, condition, trade_value, notes, frontPath, backPath],
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
app.put("/api/ownedPhotocards/:id", upload.fields([
  { name: "image_front" },
  { name: "image_back" }
]), (req, res) => {

const { id } = req.params;


db.get(
  "SELECT * FROM ownedPhotocards WHERE id = ?",
  [id],
  (err, existingCard) => {

    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!existingCard) {
      return res.status(404).json({ error: "Photocard not found" });
    }

    // FRONT IMAGE
    const frontPath = req.files?.image_front
      ? req.files.image_front[0].path
          .replace("public", "")
          .replace(/\\/g, "/")
      : existingCard.image_front_url;

    // BACK IMAGE
    const backPath = req.files?.image_back
      ? req.files.image_back[0].path
          .replace("public", "")
          .replace(/\\/g, "/")
      : existingCard.image_back_url;

    const updated = {
      artist_name: req.body.artist_name || existingCard.artist_name,
      member: req.body.member || existingCard.member,
      pc_source: req.body.pc_source || existingCard.pc_source,
      pc_version: req.body.pc_version || existingCard.pc_version,
      pc_rarity: req.body.pc_rarity || existingCard.pc_rarity,
      purchase_location: req.body.purchase_location || existingCard.purchase_location,
      condition: req.body.condition || existingCard.condition,
      trade_value: req.body.trade_value || existingCard.trade_value,
      notes: req.body.notes || existingCard.notes,
      image_front_url: frontPath,
      image_back_url: backPath
    };

    db.run(
      `
      UPDATE ownedPhotocards
      SET
        artist_name = ?,
        member = ?,
        pc_source = ?,
        pc_version = ?,
        pc_rarity = ?,
        purchase_location = ?,
        condition = ?,
        trade_value = ?,
        notes = ?,
        image_front_url = ?,
        image_back_url = ?
      WHERE id = ?
      `,
      [
        updated.artist_name,
        updated.member,
        updated.pc_source,
        updated.pc_version,
        updated.pc_rarity,
        updated.purchase_location,
        updated.condition,
        updated.trade_value,
        updated.notes,
        updated.image_front_url,
        updated.image_back_url,
        id
      ],
      function(err) {

        if (err) {
          console.error(err);
          return res.status(500).json({
            error: "Update failed"
          });
        }

        res.json({
          success: true
        });

      }
    );

  }
);

}
);

// -------------------------
// Albums update (for admin edit)
// -------------------------
app.put(
  "/api/ownedItems/:id",
  upload.single("image_front"),
  (req, res) => {

    const { id } = req.params;

    db.get("SELECT * FROM ownedItems WHERE id = ?", [id], (err, existing) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!existing) return res.status(404).json({ error: "Item not found" });

const file = req.file;
const imagePath = file
  ? file.path.replace("public", "").replace(/\\/g, "/")
  : existing.image_front_url;

      db.run(
        `
        UPDATE ownedItems
        SET
          item_type = ?,
          item_name = ?,
          artist_name = ?,
          publishing_label = ?,
          komca_number = ?,
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
          req.body.item_type,
          req.body.item_name,
          req.body.artist_name,
          req.body.publishing_label,
          req.body.komca_number,
          req.body.release_date,
          req.body.item_rarity,
          req.body.purchase_location,
          req.body.condition,
          req.body.est_marketprice,
          req.body.notes,
          imagePath,
          id
        ],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Update failed" });
          }

          res.json({ success: true });
        }
      );
    });
  }
);



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