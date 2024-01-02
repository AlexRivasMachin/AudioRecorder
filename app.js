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
const cors = require('cors');
const port = 5000;

const authRouter = require('./routes/auth');

/*
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
*/

app.use(session({
    secret: 'your-secret-key',
    cookie: { maxAge: 60 * 60 * 1000 },
    resave: false,
    saveUninitialized: false,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());

/**
 * This middlewhere checks if the user is authenticated
 * if it is, it will call the next middleware
 * use it in any route you want to protect
*/
function ensureAuthenticated(req, res, next) {
    // Si el usuario quiere reproducir un audio anonimo, no es necesario que este autenticado
    if(req.query.play){
        return next();
    }
    if (req.user) {
        return next();
    } else {
        res.redirect('/login');
    }
}

/**
 * Se asegura que en los enpoint delete y upload el usuario este autenticado
 * si lo esta, devuelve el estado 403
 */
function ensureAuthenticatedEnpoint(req, res, next) {
    if (req.user) {
        return next();
    } else {
        res.sendStatus(403).end();
    }
}

app.get('/', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
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

app.get('/session', ensureAuthenticated, (req, res) => {
    res.json(req.user._id);
});

app.get('/list', handleList);

app.get('/api/list/:name', async (req, res) => {
    const id = req.params.name;

    await handleList(id)
        .then((files) => res.json(files))
        .catch((err) => res.sendStatus(500));
});


// Configuración de almacenamiento personalizada
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(path.join(__dirname, 'multerTemp'))) {
            fs.mkdirSync(path.join(__dirname, 'multerTemp'));
        }
        // Especifica el directorio de destino
        cb(null, path.join(__dirname, 'multerTemp'));
    },
    filename: function (req, file, cb) {
        // Especifica el nombre del archivo
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2500000
    },
    fileFilter: function(req, file, cb) {
        if (file.mimetype !== 'audio/wav') {
            return cb(new Error('Solo se permiten archivos de audio en formato wav'));
        }
        cb(null, true);
    }
//single para que siempre maneje un solo archivo
}).single("recording");


app.post("/api/upload/:name", ensureAuthenticatedEnpoint, (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            res.status(500).send(err);
            return; // Cancel the insert if an error occurs
        } else {
            const userId = req.params.name;
            const audio = {
                userId: userId,
                filename: req.file.originalname,
                date: Date.now(),
                accessed: 0
            };
            if (!fs.existsSync(path.join(__dirname, 'recordings'))) {
                fs.mkdirSync(path.join(__dirname, 'recordings'));
            }
            const destinationPath = path.join(__dirname, 'recordings', audio.filename);

            // Mueve el archivo de la carpeta temporal a la carpeta recordings
            fs.rename(req.file.path, destinationPath, (err) => {
                if (err) {
                    res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                    return; // Cancel the insert if there's an error
                }
            });
            /*
            const audioSinElNombreDelFinal = audio.filename.split('_')[0];
            console.log(audioSinElNombreDelFinal);
            // busca un audio que comienza con audioSinElNombreDelFinal
            db.grabaciones.findOne({ filename: new RegExp('^' + audioSinElNombreDelFinal) }, (err, doc) => {
                if (err) {
                    console.error(err);
                } else if (doc) {
                    console.log('Ya existe un audio que comienza con ' + audioSinElNombreDelFinal);
                } else {
                    // si no se encontró ningún audio, inserta el nuevo audio
                    db.grabaciones.insert(audio, async (err, doc) => {
                        if (err) {
                         res.status(409).send('El audio ya esta en la nube').end();
                        } else {
                            console.log('Audio insertado:', doc);
                        }
                        await handleList(userId)
                            .then((files) => res.json(files))
                            .catch((err) => res.status(500).send('Algo a ido mal, vuelve a probar más tarde handle list'));
                        });
                }
            });
            */
            db.grabaciones.insert(audio, async (err, doc) => {
                if (err) {
                    res.status(409).send('El audio ya esta en la nube').end();
                } 

                await handleList(userId)
                    .then((files) => res.json(files))
                    .catch((err) => res.status(500).send('Algo a ido mal, vuelve a probar más tarde handle list'));
            });
        }
    });
});

app.use('/recordings', express.static(path.join(__dirname, 'recordings')));
app.get('/getRecordingUrl/:nombreArchivo', (req, res) => {
    const nombreArchivoDecodificado = decodeURIComponent(req.params.nombreArchivo);

    const urlArchivo = `${req.protocol}://${req.get('host')}/recordings/${nombreArchivoDecodificado}`;

    res.json({ url: urlArchivo });
});

app.get('/api/play/:filename', (req, res) => {
    //pillamos el id del audio
    const filename = req.params.filename;

    //buscamos el audio en la base de datos
    db.grabaciones.findOne({ filename: filename }, (err, doc) => {
        if (err) {
            res.send(err);
        }
        else if (!doc) {
            res.sendFile(path.join(__dirname, 'public/error404.html'));
        }
        // if found, send the audio file
        else {
            console.log("enviando: " + doc);
            res.json(doc);
        }
    });
});


app.get('/api/delete/:filename', ensureAuthenticatedEnpoint, async (req, res,next) => {
    // Esta función borrara :filename de la carpeta recordings TO-DO
    // además, lo borrará también de la base de datos. Erabiltzailearen :check
    // Devolverá como respuesta las últimas 5 grabaciones del usuario :check
    const filename = req.params.filename;
    db.grabaciones.findOne({ filename: filename }, (err, doc) => {
        if (err) {
            res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
        }
        else if(!doc){
            res.status(404).send('No se ha encontrado el audio').end();
        }
        else{
            fs.unlink(path.join(__dirname, 'recordings', filename), (err) => {
                if (err) {
                    res.sendStatus(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                } else {
                    db.grabaciones.remove({ filename: filename }, (err, doc) => {
                        if (err) {
                            res.sendStatus(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                        } else {
                            handleList()
                            .then((files) => res.json(files))
                            .catch((err) => res.sendStatus(500).send('No se ha podido obtener la lista de audios recientes'));
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

module.exports = app;