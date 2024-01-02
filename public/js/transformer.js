// transformer.js
import { pipeline } from '@xenova/transformers';

const transformers = new Transformers();

export async function analyzeSentiment(text) {
    let pipe = await pipeline('sentiment-analysis');
    let out = await pipe(text);
    return out;
}

export function transcribe(nomAudio){
    // Obtener el audio de la base de datos
    db.grabaciones.findOne({ filename: `${nomAudio}` }, (err, doc) => {
        if (err) {
            console.error(err);
        } else if (doc) {
            // Guardar el audio en un archivo
            const filepath = path.join(__dirname, 'recordings', doc.filename);
            fs.writeFile(filepath, doc.audio.buffer, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    // Transcribir el audio
                    transformers.transcribe(filepath)
                        .then(transcription => {
                            console.log(transcription);
                        })
                        .catch(error => {
                            console.error(error);
                        });
                }
            });
        } else {
            console.log('Audio no encontrado');
        }
    });
}
