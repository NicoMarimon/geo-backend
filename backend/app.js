const express = require('express');
const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());

const port = 3000;

// Conexión a la base de datos SQLite
const db = new sqlite3.Database('./gps_data.db');

// Crear tabla si no existe (timestamp en texto para hora local)
db.run(`CREATE TABLE IF NOT EXISTS gps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL,
  lon REAL,
  timestamp TEXT
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

    // Obtener la hora actual en hora de Madrid (Europe/Madrid) como string
    const now = new Date().toLocaleString('sv-SE', {
      timeZone: 'Europe/Madrid'
    }).replace(',', ''); // formato: "2025-04-27 14:17:00"

    db.run(
      `INSERT INTO gps (lat, lon, timestamp) VALUES (?, ?, ?)`,
      [lat, lon, now],
      function (err) {
        if (err) {
          return console.error(err.message);
        }
        console.log(`Coordenadas guardadas: ${lat}, ${lon} a las ${now}`);
      }
    );
  } catch (err) {
    console.error('Error parseando JSON:', err);
  }
});

// API REST para obtener todos los datos guardados o filtrados
app.get('/gps', (req, res) => {
	const { start, end } = req.query;
  
	let query = `SELECT * FROM gps`;
	const params = [];
  
	if (start && end) {
	  query += ` WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC`;
	  params.push(start, end);
	} else {
	  query += ` ORDER BY timestamp DESC`;
	}
  
	db.all(query, params, (err, rows) => {
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
