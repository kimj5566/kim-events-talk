const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for talks
app.get('/api/talks', (req, res) => {
    fs.readFile(path.join(__dirname, 'data', 'talks.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading talks.json:', err);
            return res.status(500).send('Error loading talk data');
        }
        res.json(JSON.parse(data));
    });
});

// Catch-all to serve index.html for any other routes (SPA-like behavior)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
