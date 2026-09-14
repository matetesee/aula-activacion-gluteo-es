// Servidor estático simple para el funnel, listo para Railway.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Rutas explícitas para que /vsl y /rescate (sin barra final) también funcionen.
app.get('/vsl', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'vsl', 'index.html'));
});

app.get('/rescate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rescate', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
