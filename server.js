require("dotenv").config(); // Laden von Umgebungsvariablen

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "dein_geheimes_jwt";

// PostgreSQL Database connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Test database connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("[ERROR] Fehler bei der Datenbankverbindung:", err);
  } else {
    console.log("[INFO] Datenbankverbindung erfolgreich:", res.rows[0]);
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Root Route
app.get("/", (req, res) => {
  res.send("Willkommen bei Market Minds API!");
});

// User Registration
app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "E-Mail und Passwort sind erforderlich" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (id, email, password, created_at) VALUES (gen_random_uuid(), $1, $2, now())",
      [email, hashedPassword]
    );
    res.status(201).json({ message: "Benutzer erfolgreich registriert" });
  } catch (error) {
    console.error("[ERROR] Registrierung fehlgeschlagen:", error);
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "E-Mail und Passwort sind erforderlich" });
  }
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Ungültige Anmeldedaten" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token, message: "Login erfolgreich" });
  } catch (error) {
    console.error("[ERROR] Login fehlgeschlagen:", error);
    res.status(500).json({ error: "Fehler beim Login" });
  }
});

// Save Parameters
app.post("/parameters", async (req, res) => {
  const { userId, parameterName, value } = req.body;
  if (!userId || !parameterName || value === undefined) {
    return res.status(400).json({ error: "Alle Felder sind erforderlich" });
  }
  try {
    await pool.query(
      "INSERT INTO parameters (id, user_id, parameter_name, value, created_at) VALUES (gen_random_uuid(), $1, $2, $3, now())",
      [userId, parameterName, value]
    );
    res.status(201).json({ message: "Parameter erfolgreich gespeichert" });
  } catch (error) {
    console.error("[ERROR] Parameter speichern fehlgeschlagen:", error);
    res.status(500).json({ error: "Fehler beim Speichern der Parameter" });
  }
});

// Get Trading Ideas
app.get("/ideas/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM ideas WHERE user_id = $1", [
      userId,
    ]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("[ERROR] Ideen abrufen fehlgeschlagen:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Ideen" });
  }
});

// Start the server
app.listen(port, (err) => {
  if (err) {
    console.error("[ERROR] Server konnte nicht gestartet werden:", err);
  } else {
    console.log(
      `[INFO] Market Minds Backend läuft unter http://localhost:${port}`
    );
  }
});
