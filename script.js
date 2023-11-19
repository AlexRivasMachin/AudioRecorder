const audioPlayer = document.getElementById('audio');
const timer = document.getElementById('timer');
const recorder = document.getElementById('recorder-status');
const recordedTime = document.getElementById('recorded-time');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');

let mediaRecorder;
let audioChunks = [];
let startTime;
let timerInterval;
let lastAudios = [];

// Mapping image alt with their state
const recorderState = {
    Record: 'record button',
    Stop: 'stop button',
    Play: 'play button',
    Pause: 'pause button',
}

function getRecorderState() {
    let alt = recorder.getAttribute('alt');
    switch (alt) {
        case 'record button': return recorderState.Record;
        case 'stop button': return recorderState.Stop;
        case 'play button': return recorderState.Play;
        case 'pause button': return recorderState.Pause;
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
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'red-animated-button', 'rounded-button');
                timer.removeAttribute('class');
                recordingImg.setAttribute('class', "parpadea");
                await startRecording();
                return;
            };
            case recorderState.Stop: {
                recorder.setAttribute('src', "icons/microphone.svg");
                recorder.setAttribute('alt', recorderState.Record);
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'red-animated-button', 'rounded-button');
                recordingImg.removeAttribute('class');
                await stopRecording();
                return;
            };
            case recorderState.Play: {
                recorder.setAttribute('src', "icons/pause.svg");
                recorder.setAttribute('alt', recorderState.Pause);
                recordingImg.setAttribute('class', "parpadea");
                updateTimerWhilePlaying();
                audioPlayer.play();
                return;
            };
            case recorderState.Pause: {
                recorder.setAttribute('src', "icons/play.svg");
                recorder.setAttribute('alt', recorderState.Play);
                recordingImg.removeAttribute('class');
                stopTimer();
                audioPlayer.pause();
                return;
            };
        };
    };
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
            stopTimer();
        };

        mediaRecorder.start();

        // Iniciamos el temporizador
        startTimer();
    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        await mediaRecorder.stop();
        // Si no espero un poco no actualiza la lista, no se porq falla el await anterior
        await sleep(200);
        // Detenemos el temporizador
        stopTimer();
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioBlob.name = timer.textContent;
            addToLastRecordings(audioBlob);
        }
        timer.textContent = "00:00:00";
    }
}

function startTimer() {
    // Inicia el temporizador
    timer.textContent = '00:00:00';
    timerInterval = setInterval(() => {
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

function addToLastRecordings(audio) {
    try {
        const audioEntry = document.createElement('div');
        audioEntry.setAttribute('class', 'audio-entry');
        const play = document.createElement('img');
        play.setAttribute('src', 'icons/play-audio-list.svg');
        play.setAttribute('class', 'play-button');
        play.setAttribute('data-audio', URL.createObjectURL(audio));
        audioEntry.appendChild(play);
        const name = document.createElement('p');
        name.innerHTML = audio.name;
        audioEntry.appendChild(name);
        const publish = document.createElement('img');
        publish.setAttribute('src', 'icons/cloud-upload.svg');
        publish.setAttribute('class', 'publish-button');
        audioEntry.appendChild(publish);
        const remove = document.createElement('img');
        remove.setAttribute('src', 'icons/delete.svg');
        remove.setAttribute('class', 'remove-button');
        audioEntry.appendChild(remove);
        recentList.append(audioEntry);
    } catch (error) {
        console.error('Error updating last recordings:', error);
    }
}

recentList.addEventListener('click', (e) => {
    // Check if the clicked element is an img with the class play-button
    if (e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) {
        const audioEntry = e.target.closest('.audio-entry');
        // Remove the 'playing' class from all audio entries
        document.querySelectorAll('.audio-entry').forEach(entry => {
            entry.classList.remove('playing');
        });
        audioEntry.classList.add('playing');
        const audioUrl = e.target.dataset.audio;
        recordingImg.removeAttribute('class');
        enableAudioPlay(audioUrl);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
        const audioEntry = e.target.closest('.audio-entry');
        recordingImg.removeAttribute('class');
        audioEntry.parentNode.removeChild(audioEntry);
    }
});

function enableAudioPlay(audioUrl) {
    recorder.setAttribute('alt', recorderState.Play);
    recorder.setAttribute('src', 'icons/play.svg');
    recorder.removeAttribute('class');
    recorder.classList.add('animated-button', 'green-animated-button', 'rounded-button');
    audioPlayer.src = audioUrl;
    recordingImg.setAttribute('src', 'icons/playing.svg');
}

function updateTimerWhilePlaying() {
    timer.textContent = '00:00:00';
    // Inicia el temporizador
    timerInterval = setInterval(() => {
        const elapsedTime = Math.floor(audioPlayer.currentTime);
        const hours = Math.floor(elapsedTime / 3600);
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = elapsedTime % 60;
        const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
        const formattedHours = hours < 10 ? `0${hours}` : hours;
        timer.textContent = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }, 100);
}