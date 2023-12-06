const express = require('express');
const app = express();
const path = require('path');
const port = 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/list', (req, res) => {
    res.sendFile(path.join(__dirname, 'api/list/index.html'));
});

app.listen(port, () => console.log(`Listening on port ${port}!`));