const playButton = document.getElementById('play');
const audioPlayer = document.getElementById('audio');
const timer = document.getElementById('timer');
const myCheckbox = document.getElementById('like');
const recorder = document.getElementById('recorder-status');
const recordedTime = document.getElementById('recorded-time');
const recordingImg = document.getElementById('recording-img');

let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let lastAudios = [];

// Mapping image alt with their state
const recorderState = {
    Record: 'record button',
    Stop: 'stop button',
}

function getRecorderState() {
    let alt = recorder.getAttribute('alt');
    switch (alt) {
        case 'record button': return recorderState.Record;
        case 'stop button': return recorderState.Stop;
        default: return null;
    }
}

recorder.addEventListener('click', async () => {
    let state = getRecorderState();
    if (state != null) {
        switch (state) {
            case recorderState.Record: {
                recorder.setAttribute('src', "icons/stop.svg");
                recorder.setAttribute('alt', recorderState.Stop);
                timer.removeAttribute('class');
                recordingImg.setAttribute('class', "parpadea");
                await startRecording();
                return;
            };
            case recorderState.Stop: {
                recorder.setAttribute('src', "icons/microphone.svg");
                recorder.setAttribute('alt', recorderState.Record);
                recordingImg.removeAttribute('class');
                await stopRecording();
                return;
            };
        };
    };
});

playButton.addEventListener('click', () => {
    if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.play();
    }
});

async function startRecording() {
    timer.textContent = '00:00:00';
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
            stopTimer();
        };

        mediaRecorder.start();

        // Iniciamos el temporizador
        startTimer();
    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
    }
}


async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        await mediaRecorder.stop();
        // Detenemos el temporizador
        stopTimer();
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            lastAudios.push(audioBlob);
        }
    }
}

function startTimer() {
    // Inicia el temporizador
    timerInterval = setInterval(() => {
        timer.textContent = '00:00:00';
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            const currentTime = new Date().getTime();
            const elapsedTime = Math.floor((currentTime - startTime) / 1000);
            const hours = Math.floor(elapsedTime / 3600);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const formattedHours = hours < 10 ? `0${hours}` : hours;
            timer.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
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

function updateLastRecordings() {

}