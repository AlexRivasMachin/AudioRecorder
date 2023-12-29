const express = require('express');
const mongojs = require('mongojs');
const db = mongojs('mongodb://localhost:27017/grabaciones', ['grabaciones']);
const app = express();
const path = require('path');
const fs = require('fs'); //npm install fs
const multer = require('multer'); //npm install multer
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

app.get('/list', handleList);

app.get('/api/list/:name', async (req, res) => {
    const id = req.params.name;

    await handleList(id)
        .then((files) => res.json(files))
        .catch((err) => res.sendStatus(500));
});

/*
app.post('/upload/:name', (req, res) => {
    const audio = req.body;
    db.grabaciones.insert(audio, (err, doc) => {
        if (err) {
            res.send(err);
        } else {
            res.json(doc);
        }
    });
});
*/

app.post("/upload/:name", (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            res.send(err);
        } else {
            const audio = {
                name: req.params.name,
                filename: req.file.filename, 
                date: Date.now(),
                accessed: 0 
            };

            db.grabaciones.insert(audio, (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                    handleList(req, res); 
                }
            });
        }
    });
});


app.get('/api/play/:filename', (req, res) => {
    //pillamos el id del audio
    const filename = req.params.filename;

    //buscamos el audio en la base de datos
    db.grabaciones.findOne({ filename: filename }, (err, doc) => {
        if (err) {
            res.send(err);
        }
        //si no lo encontramos, devolvemos un 404
         else if (!doc) {
            res.json({redirectUrl : 'error404.html'});
        }
        //si lo encontramos, devolvemos el fichero de audio
        else {
            console.log("enviando: " + doc);
            res.json(doc);
        }
    });
});

app.get('/api/delete/:filename', async (req, res,next) => {
    // Esta función borrara :filename de la carpeta recordings TO-DO
    // además, lo borrará también de la base de datos. Erabiltzailearen :check
    // Devolverá como respuesta las últimas 5 grabaciones del usuario :check
    const filename = req.params.filename;
    db.grabaciones.findOne({ filename: filename }, (err, doc) => {
        if (err) {
            res.send(err);
        }
        else if(!doc){
            res.json({redirectUrl : 'error404.html'});
        }
        else{
            db.grabaciones.remove({ filename: filename }, (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                    // Elimina el archivo del sistema de archivos (no se si esta bien)
                    //he puesto un require fs arriba pero no se si esta bien
                    fs.unlink(path.join(__dirname, 'recordings', filename), (err) => {
                        if (err) {
                            console.error(`Error al eliminar el archivo: ${err}`);
                        } else {
                            handleList(req, res);
                        }
                    });
                }
            });
        }
    });
});

app.listen(port, () => console.log(`Listening on port ${port}!`));

/**
 * Desde la base de datos obtener los últimos 5 audios del presente usuario (id),
 * las grabaciones ordenadas por fecha(primero las más actuales)
 * crea el objeto json solicitado
 * o [] si el usuario no tiene grabaciones asociadas y devuelve
 */
async function handleList(id) {
    //en mongo date-1 es para ponerlo en orden descendente para que pille los 5 últimos :)
    // TODO actualizar el accessed
    return new Promise((resolve, reject) => {
        let files = { files: [] };
        db.grabaciones.find({ _id: mongojs.ObjectId(id) }).sort({ date: -1 }).limit(5, (err, docs) => {
            if (err) {
                reject(err);
            } else {
                docs.forEach(doc => {
                    const fileToAdd = {
                        filename: doc.filename,
                        date: doc.date
                    };
                    files.files.push(fileToAdd);
                });
                resolve(files);
            }
        });
    });
}

const upload = multer({
    limits: {
        fileSize: 2500000
    },
    fileFilter: function(req, file, cb) {
        if (file.mimetype !== 'audio/ogg') {
            return cb(new Error('Solo se permiten archivos de audio en formato ogg'));
        }
        cb(null, true);
    }
//single para que siempre maneje un solo archivo
}).single("recording");

