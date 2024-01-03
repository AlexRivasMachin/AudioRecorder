const audioInput = document.getElementById("audio-link");
const audioButton = document.getElementById("transform-button");
const pElement = document.getElementById("salida");

audioButton.addEventListener('click', async () => {
    const audioLink = audioInput.value;
    // Divide la URL utilizando el carácter "=" como separador
    const partesUrl = audioLink.split('=');

    // Accede al último elemento del array resultante
    const codigoAudio = partesUrl[partesUrl.length - 1];
    console.log(codigoAudio);

    try {
        // Hacer una solicitud al servidor para obtener la URL del archivo de audio
        const responseUrl = await fetch(`/getRecordingUrl/${codigoAudio}`);
        const dataUrl = await responseUrl.json();
        const audioURL = dataUrl.url;
        console.log(audioURL);
        //pilla el audio, pero no es wav ni nada es opus hay que convertirlo a wav

        // Realiza una solicitud al servidor para transcribir el audio
        const response = await fetch(`/transcribe/${audioURL}`);
        const data = await response.json();

        // Actualiza el elemento de salida con la transcripción
        pElement.innerText = data;

    } catch (error) {
        console.error(error);
        pElement.innerText = 'Error al transcribir el audio';
    }
});
