// Projektstruktur: Einfaches Backend in Node.js (Express)
// Installiere zuerst Node.js und dann die folgenden Pakete: npm install express cors dotenv body-parser

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const app = express();

dotenv.config(); // Zum Laden von Umgebungsvariablen

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mock-Datenbank (später durch echte Datenbank ersetzen)
const users = []; // [{ id, email, password }]
const parameters = {}; // { userId: [{ name, value }] }
const ideas = {}; // { userId: [{ idea, timestamp }] }

// Routen

// Registrierung
app.post('/register', (req, res) => {
    const { email, password } = req.body;
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'Benutzer existiert bereits!' });
    }
    const userId = users.length + 1;
    users.push({ id: userId, email, password });
    res.status(201).json({ message: 'Benutzer erstellt!', userId });
});

// Login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email && user.password === password);
    if (!user) {
        return res.status(401).json({ message: 'Ungültige Anmeldedaten!' });
    }
    res.status(200).json({ message: 'Erfolgreich angemeldet!', userId: user.id });
});

// Parameter speichern
app.post('/parameters', (req, res) => {
    const { userId, parameterName, value } = req.body;
    if (!parameters[userId]) parameters[userId] = [];
    parameters[userId].push({ name: parameterName, value });
    res.status(201).json({ message: 'Parameter gespeichert!' });
});

// Parameter abrufen
app.get('/parameters/:userId', (req, res) => {
    const userId = req.params.userId;
    res.status(200).json(parameters[userId] || []);
});

// Ideen generieren
app.post('/ideas', (req, res) => {
    const { userId, idea } = req.body;
    if (!ideas[userId]) ideas[userId] = [];
    ideas[userId].push({ idea, timestamp: new Date() });
    res.status(201).json({ message: 'Trading-Idee erstellt!' });
});

// Ideen abrufen
app.get('/ideas/:userId', (req, res) => {
    const userId = req.params.userId;
    res.status(200).json(ideas[userId] || []);
});

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});
