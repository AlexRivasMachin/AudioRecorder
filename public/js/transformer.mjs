import { pipeline } from '@xenova/transformers';
import mongojs from 'mongojs';


const MONGO_URI = 'mongodb://localhost:27017/grabaciones';
const db = mongojs(MONGO_URI, ['grabaciones']);

function transcribe(nomAudio){
    // Obtener el audio de la base de datos
    db.grabaciones.findOne({ filename: `${nomAudio}` }, (err, doc) => {
        if (err) {
            console.error(err);
        } else if (doc) {
            pipeline(doc.audio.buffer)
                .then(transcription => {
                    console.log(transcription);
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
        console.log('Audio no encontrado');        }
    });
}

export { transcribe };