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
        // Realiza una solicitud al servidor para transcribir el audio
        const response = await fetch(`/transcribe/${codigoAudio}`);
        const data = await response.json();

        // Actualiza el elemento de salida con la transcripción
        pElement.innerText = data;

    } catch (error) {
        console.error(error);
        pElement.innerText = 'Error al transcribir el audio';
    }
});
