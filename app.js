const express = require('express');
const mongojs = require('mongojs');
const db = mongojs('app:r9aqBsP3I4Byyrib@cluster0.wnzdkvb.mongodb.net/grabaciones', ['grabaciones']);
const app = express();
const path = require('path');
const port = 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/list/:user_id', (req, res) => {
    const user_id = req.params.user_id;
    db.users.findOne({ _id: mongojs.ObjectId(user_id) }, (err, doc) => {
        if (err) {
            res.send(err);
        } else {
            res.json(doc);
        }
    });
    res.sendFile(path.join(__dirname, 'api/list/index.html'));
});

app.listen(port, () => console.log(`Listening on port ${port}!`));