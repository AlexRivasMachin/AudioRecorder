const express = require('express');
const mongojs = require('mongojs');
const MONGO_URI = 'mongodb://localhost:27017/grabaciones';
const db = mongojs(MONGO_URI, ['grabaciones']);
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const port = 5000;

const authRouter = require('./routes/auth');


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

app.use(session({
    secret: 'your-secret-key',
    cookie: { maxAge: 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

/**
 * This middlewhere checks if the user is authenticated
 * if it is, it will call the next middleware
 * use it in any route you want to protect
*/
function ensureAuthenticated(req, res, next) {
    if (req.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

app.get('/', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/login.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRouter);

app.get('/recorder', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

app.get('/list', handleList);

app.get('/api/list/:name', async (req, res) => {
    const id = req.params.name;

    await handleList(id)
        .then((files) => res.json(files))
        .catch((err) => res.sendStatus(500));
});


app.post("/recorder/upload/:name", (req, res) => {
    const userId = req.params.name;
    upload(req, res, async (err) => {
        if (err) {
            res.send(err);
        } else {
            const audio = {
                userId: userId,
                filename: req.file.filename,
                date: Date.now(),
                accessed: 0 
            };

            db.grabaciones.insert(audio, async (err, doc) => {
                if (err) {
                    res.send(err);
                } else {
                        await handleList(userId)
                            .then((files) => res.json(files))
                            .catch((err) => res.sendStatus(500));
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
                            handleList();
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
async function handleList(userId) {
    //en mongo date-1 es para ponerlo en orden descendente para que pille los 5 últimos :)
    // TODO actualizar el accessed
    return new Promise((resolve, reject) => {
        let files = { files: [] };
        db.grabaciones.find({ userId: userId }).sort({ date: -1 }).limit(5, (err, docs) => {
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
        if (file.mimetype !== 'audio/wav') {
            return cb(new Error('Solo se permiten archivos de audio en formato ogg'));
        }
        cb(null, true);
    }
//single para que siempre maneje un solo archivo
}).single("recording");


module.exports = app;