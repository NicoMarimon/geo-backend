const express = require('express');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());

const port = 3000;

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./gps_data.db');

// Crear tabla si no existe
db.run(`CREATE TABLE IF NOT EXISTS gps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL,
    lon REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Conectar al broker MQTT
const client = mqtt.connect('mqtt://test.mosquitto.org');

// Suscribirse al topic
client.on('connect', () => {
    console.log('Conectado al broker MQTT');
    client.subscribe('/nico/project/gps1', (err) => {
        if (!err) {
            console.log('Suscrito a /nico/project/gps1');
        }
    });
});

// Recibir mensajes
client.on('message', (topic, message) => {
    console.log(`Mensaje recibido: ${message.toString()}`);
    try {
        const data = JSON.parse(message.toString());
        const lat = data.lat;
        const lon = data.lon;

        db.run(`INSERT INTO gps (lat, lon) VALUES (?, ?)`, [lat, lon], function(err) {
            if (err) {
                return console.error(err.message);
            }
            console.log(`Coordenadas guardadas: ${lat}, ${lon}`);
        });
    } catch (err) {
        console.error('Error parseando JSON:', err);
    }
});

// API REST para obtener todos los datos guardados
app.get('/gps', (req, res) => {
    db.all(`SELECT * FROM gps ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Arrancar el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor web escuchando en http://0.0.0.0:${port}`);
});
