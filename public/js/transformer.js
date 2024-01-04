const audioInput = document.getElementById("audio-link");
const audioButton = document.getElementById("transform-button");
const pElement = document.getElementById("salida");
const langButtom = document.getElementById("language-button");

langButtom.addEventListener('click', async () => {
    if(langButtom.innerText == "ENG"){
        langButtom.innerText = "ESP";
    }else if(langButtom.innerText == "ESP"){
        langButtom.innerText = "ENG";
    }
    console.log(langButtom.innerText);
});

audioButton.addEventListener('click', async () => {
    const audioLink = audioInput.value;
    // Divide la URL utilizando el carácter "=" como separador
    const partesUrl = audioLink.split('=');

    // Accede al último elemento del array resultante
    const audioFileName = partesUrl[partesUrl.length - 1];
    pElement.innerText = 'Transcribiendo...';
    try {
        // Realiza una solicitud al servidor para transcribir el audio
        if(langButtom.innerText == "ENG"){
            var response = await fetch(`/transcribe/${audioFileName}`);
        }else if(langButtom.innerText == "ESP"){
            var response = await fetch(`/transcribeESP/${audioFileName}`);
        }
        else var response = await fetch(`/transcribe/${audioFileName}`);
        
        if(response.status !== 200) {
            pElement.innerText = await response.text();
            return;
        }

        const data = await response.json();

        // Actualiza el elemento de salida con la transcripción
        pElement.innerText = data.text;

    } catch (error) {
        console.error(error);
        pElement.innerText = 'Error al transcribir el audio';
    }
});
