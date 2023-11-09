const recordButton = document.getElementById('record');
const stopButton = document.getElementById('stop');
const playButton = document.getElementById('play');
const audioPlayer = document.getElementById('audio');
const timer = document.getElementById('timer');
const myCheckbox = document.getElementById('like');

let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;

recordButton.addEventListener('click', async () => {
    timer.textContent = '0:00';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        startTime = new Date().getTime();

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            playButton.disabled = false;
            // Detenemos el temporizador al finalizar la grabación
            stopTimer();
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
        playButton.disabled = true;

        // Iniciamos el temporizador
        startTimer();
    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
    }
});

stopButton.addEventListener('click', async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        await mediaRecorder.stop();
        recordButton.disabled = false;
        stopButton.disabled = true;
        // Detenemos el temporizador al presionar el botón de detener
        stopTimer();
    }
});

playButton.addEventListener('click', () => {
    if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    }
});

function startTimer() {
    // Inicia el temporizador y guarda la referencia al intervalo
    timerInterval = setInterval(() => {
        timer.textContent = '0:00';
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            const currentTime = new Date().getTime();
            const elapsedTime = Math.floor((currentTime - startTime) / 1000);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
            timer.textContent = `${minutes}:${formattedSeconds}`;
        }
    }, 1000);
}

function stopTimer() {
    // Detiene el temporizador
    clearInterval(timerInterval);
}

myCheckbox.addEventListener('change', () => {
    if (myCheckbox.checked) {
        console.log('Checkbox marcado');
    } else {
        console.log('Checkbox desmarcado');
    }
});
