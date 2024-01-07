const port = 5000;
const port_socket = 5001;

const express = require('express');
const mongojs = require('mongojs');
const MONGO_URI = 'mongodb://mongodb:27017/grabaciones';
const db = mongojs(MONGO_URI, ['grabaciones']);
const app = express();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const wavefile = require('wavefile');
const ffmpeg = require('fluent-ffmpeg');

const cors = require('cors');
app.use(cors());

//Para socket.io
const socketIO = require('socket.io');
const http = require('http');
const server = http.createServer(app);
server.listen(port_socket, () => {
    console.log('socket.io escuchando en el puerto ' + port_socket);
});
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: false
    }
});


const maxAudioAge = 1000 * 60 * 60 * 24 * 5; // 5 dias
const intervaloCleanup = 1000 * 60 * 60; // 1 hora

const authRouter = require('./routes/auth');

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
            fs.renameSync(req.file.path, destinationPath, (err) => {
                if (err) {
                    res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                    return; // Cancel the insert if there's an error
                }
            });
            
            const newDestinationPath = path.join(__dirname, 'recordings', audio.filename + '.wav');

            ffmpeg(destinationPath)
                .output(newDestinationPath)
                .on('end', () => {
                    console.log('Conversion finished');
                    // You can now use newDestinationPath as the path to the WAV file
                })
                .on('error', err => {
                    console.error('An error occurred: ' + err.message);
                    res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                    return;
                })
                .run();

            audio.filename = audio.filename + '.wav';

            db.grabaciones.insert(audio, async (err, doc) => {
                if (err) {
                    res.status(409).send('El audio ya esta en la nube').end();
                } 

                await handleList(userId)
                    .then((files) => res.json(files))
                    .catch((err) => res.sendStatus(500));
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
            db.grabaciones.update({ filename: doc.filename }, { $set: { accessed: Date.now() } });
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
            const id = doc.userId;
            fs.unlink(path.join(__dirname, 'recordings', filename), (err) => {
                if (err) {
                    res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                } else {
                    db.grabaciones.remove({ filename: filename }, (err, doc) => {
                        if (err) {
                            res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
                        } else {
                            handleList(id)
                            .then((files) => res.json(files))
                            .catch((err) => res.sendStatus(500).send('No se ha podido obtener la lista de audios recientes'));
                        }
                    });
                }
            });
        }
    });
});

app.get('/error404', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/error404.html'));
});

app.listen(port, () => console.log(`Listening on port ${port}`));

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

setInterval(cleanup, intervaloCleanup);

function cleanup(){

    const horaActual = Date.now();
    const horaLimite = horaActual - maxAudioAge;

    db.grabaciones.find({date: {$lt: horaLimite}}, (err, docs) => {
        if(err){
            console.log(err);
        }
        else{
            docs.forEach(doc => {
                eliminarAudio(doc);
                console.log("eliminando audio: " + doc.filename);
            });
        }
    });
}

function eliminarAudio(doc){
    fs.unlink(path.join(__dirname, 'recordings', doc.filename), (err) => {
        if (err) {
            console.log(err);
        } else {
            eliminarAudioDeBd(doc);
            acutalizarListaDeAudiosDeClientes();
        }
    });
}

function eliminarAudioDeBd(doc){
    console.log("eliminando audio de la bd: " + doc.filename);
    db.grabaciones.remove({ filename: doc.filename }, (err, doc) => {
        if (err) {
            console.log(err);
        }
    });
}

function acutalizarListaDeAudiosDeClientes(){
    io.emit('actualizarListaDeAudios');
}

module.exports = app;

// Ruta para transcribir el audio
// Ruta para transcribir el audio
app.get('/transcribe/:fileName', async (req, res) => {
    const filename = req.params.fileName;

    const audioURL = `${req.protocol}://${req.get('host')}/recordings/${filename}`;

    // Load audio data
    let buffer = Buffer.from(await fetch(audioURL).then(x => x.arrayBuffer()));

    // Read .wav file and convert it to required format
    let audioData;
    try{
        let wav = new wavefile.WaveFile(buffer);
        wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
        wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000
        audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            if (audioData.length > 1) {
                const SCALING_FACTOR = Math.sqrt(2);

                // Merge channels (into first channel to save memory)
                for (let i = 0; i < audioData[0].length; ++i) {
                audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
                }
            }

            // Select first channel
            audioData = audioData[0];
        }
    }catch(err){
        console.log(err.message)
        if(err.message == 'Not a supported format.'){
            res.status(409).send('Tienes que subir el audio para poder transcribirlo').end();
            return;
        }
        res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
        return;
    }
    

    // Importar dinámicamente el módulo ESM
    const { pipeline,env } = await import('@xenova/transformers');

    // Configurar el modelo
    env.allowLocalModels = false;

    // Transcribir el audio
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');

    const output = await transcriber(audioData);
    res.json(output);
});

// Ruta para transcribir el audio en Español
app.get('/transcribeESP/:fileName', async (req, res) => {
    const filename = req.params.fileName;

    const audioURL = `${req.protocol}://${req.get('host')}/recordings/${filename}`;

    // Load audio data
    let buffer = Buffer.from(await fetch(audioURL).then(x => x.arrayBuffer()));

    // Read .wav file and convert it to required format
    let audioData;
    try{
        let wav = new wavefile.WaveFile(buffer);
        wav.toBitDepth('32f'); // Pipeline expects input as a Float32Array
        wav.toSampleRate(16000); // Whisper expects audio with a sampling rate of 16000
        audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
            if (audioData.length > 1) {
                const SCALING_FACTOR = Math.sqrt(2);

                // Merge channels (into first channel to save memory)
                for (let i = 0; i < audioData[0].length; ++i) {
                audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
                }
            }

            // Select first channel
            audioData = audioData[0];
        }
    }catch(err){
        console.log(err.message)
        if(err.message == 'Not a supported format.'){
            res.status(409).send('Tienes que subir el audio para poder transcribirlo').end();
            return;
        }
        res.status(500).send('Algo a ido mal, vuelve a probar más tarde').end();
        return;
    }
    

    // Importar dinámicamente el módulo ESM
    const { pipeline,env } = await import('@xenova/transformers');

    // Configurar el modelo
    env.allowLocalModels = false;

    // Transcribir el audio
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');

    // Transcribir el audio y si lo queremos traducir a otro idioma con task: 'translate'
    const output = await transcriber(audioData, { language: 'spanish' , task: 'transcribe'});
    res.json(output);
});

