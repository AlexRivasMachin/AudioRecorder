const express = require('express');
const mongojs = require('mongojs');
const db = mongojs('mongodb://localhost:27017/grabaciones', ['grabaciones']);
const app = express();
const path = require('path');
const port = 5000;

//para meterlos en mongo aunque sea solo una vez
const audioFiles = [
    {
        "filename": "57dcdae8dea1270bb922eb53c0c1d58a",
        "date": 1694187731170
    },
    {
        "filename": "7f85adaba7d9a9e178e8a1bd8fefa9ce",
        "date": 1694170942916
    },
    {
        "filename": "44ecc096c58ec33c0ee6156dd9024e4c",
        "date": 1693776011113
    }
];

audioFiles.forEach(file => {
    db.grabaciones.findOne({ filename: file.filename }, (err, doc) => {
        if (err) {
            console.log(err);
        } else if (!doc) {
            db.grabaciones.insert(file, (err, doc));
        } else {
            console.log('File already exists:', doc);
        }
    });
});

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

app.post('uploadAudio', (req, res) => {
    const audio = req.body;
    db.grabaciones.insert(audio, (err, doc) => {
        if (err) {
            res.send(err);
        } else {
            res.json(doc);
        }
    });
});

app.get('/api/play/:id_', (req, res) => {
    //pillamos el id del audio
    const id_ = req.params.id_;

    //buscamos el audio en la base de datos
    db.grabaciones.findOne({ filename: id_ }, (err, doc) => {
        if (err) {
            res.send(err);
        }
        //si no lo encontramos, devolvemos un 404
         else if (!doc) {
            res.status(404).send('No se encontró el fichero de audio');
        }
        //si lo encontramos, devolvemos el fichero de audio
        else {
            res.json(doc);
        }
    });
});
app.listen(port, () => console.log(`Listening on port ${port}!`));