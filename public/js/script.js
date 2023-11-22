import uuidv4 from '../utils/uuid/v4.js';
import Timer from './timer.js';

const audioPlayer = document.getElementById('audio');
const timer = new Timer(document.getElementById('timer'));
const recorder = document.getElementById('recorder-status');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');
const likedList = document.getElementById('liked-list');
const buttonRecordState = document.getElementById('imageBackToRecording');
const buttonSaveRecording = document.getElementById('imageSaveRedocrding');
const buttonDeleteRecording = document.getElementById('imageDeleteRecording');

let mediaRecorder;
let audioChunks = [];
let uuid;

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

function setRecorderState(state) {
    if (state == null) {
        return;
    }

    recordingImg.removeAttribute('class');

    switch (state) {

        case recorderState.Record:
            changeRecorderButtonAndRecordingImgAppearence(state, 'microphone', 'red', 'recording', 'normal');
            break;
        case recorderState.Stop:
            changeRecorderButtonAndRecordingImgAppearence(state, 'stop', 'red', 'recording', "parpadea");
            break;
        case recorderState.Play:
            changeRecorderButtonAndRecordingImgAppearence(state, 'play', 'green', 'playing', 'normal');
            break;
        case recorderState.Pause:
            changeRecorderButtonAndRecordingImgAppearence(state, 'pause', 'green', 'playing', 'parpadea');
            break;
    }
}
function changeRecorderButtonAndRecordingImgAppearence(state, recorderIcon, color, imgIcon, imgClass){
    changeRecorderButtonAppareance(state, recorderIcon, color);
    changeRecordingImgAppareance(imgIcon, imgClass);
}

function changeRecorderButtonAppareance(state, icon, color) {
    recorder.setAttribute('src', `icons/${icon}.svg`);
    recorder.setAttribute('alt', state);
    recorder.removeAttribute('class');
    recorder.classList.add('animated-button', `${color}-animated-button`, 'rounded-button');
}

function changeRecordingImgAppareance(icon, imgClass) {
    recordingImg.setAttribute('src', `icons/${icon}.svg`);
    if (imgClass == "parpadea") {
        recordingImg.setAttribute('class', "parpadea");
    }
}

recorder.addEventListener('click', async () => {
    
    let state = getRecorderState();
    if (state != null) {
        switch (state) {
            case recorderState.Record: {
                setRecorderState(recorderState.Stop);
                timer2.startTimer();
                await startRecording();
                return;
            };
            case recorderState.Stop: {
                setRecorderState(recorderState.Record);
                timer2.stopTimer();
                timer2.reloadTimer();
                await stopRecording();
                return;
            };
            case recorderState.Play: {
                setRecorderState(recorderState.Pause);
                timer2.continueTimer(audioPlayer);
                audioPlayer.play();
                return;
            };
            case recorderState.Pause: {
                setRecorderState(recorderState.Play);
                timer2.stopTimer();
                audioPlayer.pause();
                return;
            };
        };
    };
});

buttonRecordState.addEventListener('click', () => {
    if(isRecording()){
    
    }
    else{
    setRecorderState(recorderState.Record);
    if(existsAudioWithPlayingClass()){
        removeAudioWithPlayingClass();
    }
}
});

buttonSaveRecording.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        publishRecording(getAudiosWithPlayingClass()[0]);
        removeAudioWithPlayingClass();
    }
});

buttonDeleteRecording.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        deleteRecording(getAudiosWithPlayingClass()[0]);
        removeAudioWithPlayingClass();
    }
});

function existsAudioWithPlayingClass() {
    return getAudiosWithPlayingClass().length > 0;
}

function removeAudioWithPlayingClass() {
    getAudiosWithPlayingClass().forEach(audio => {
        audio.classList.remove('playing');
    })
}

function getAudiosWithPlayingClass() {
    return document.querySelectorAll('.playing');
}

function deleteRecording(audioEntry) {
    recordingImg.removeAttribute('class');
    audioEntry.parentNode.removeChild(audioEntry);
    timer.stopTimer();
    timer.reloadTimer();
    setRecorderState(recorderState.Record);
}

function publishRecording(audioEntry) {
    audioEntry.parentNode.removeChild(audioEntry);
    likedList.appendChild(audioEntry);
    timer.stopTimer();
    timer.reloadTimer();
    setRecorderState(recorderState.Record);
}

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
        };

        mediaRecorder.start();
    } catch (error) {
        console.error('Error al acceder al micrófono:', error);
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function stopRecording() {
    if (isRecording()) {
        await mediaRecorder.stop();
        await sleep(30);
        if (audioChunks.length > 0) {
            stopTimerRecord();
        }
    }
}

function isRecording() {
    return mediaRecorder && mediaRecorder.state === 'recording';
}

function stopTimerRecord() {
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    audioBlob.name = new Date().toUTCString().slice(4, 22);
    addToLastRecordings(audioBlob);
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
        name.setAttribute('class', 'audio-name');
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

    }
    catch (error) {
        console.error('Error updating last recordings:', error);
    }
}

recentList.addEventListener('click', (e) => {
    if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-name')) {
        const audioEntry = e.target.closest('.audio-entry');

        timer.stopTimer();
        timer.reloadTimer();

        if (mediaRecorder && mediaRecorder.state === 'recording') {
        }

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
        deleteRecording(audioEntry);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('publish-button')) {
        const audioEntry = e.target.closest('.audio-entry');
        publishRecording(audioEntry)
    }
});


function enableAudioPlay(audioUrl) {
    setRecorderState(recorderState.Play);
    audioPlayer.src = audioUrl;
}

if (!localStorage.getItem("uuid")) {

    localStorage.setItem("uuid", uuidv4()); // genera y gaurda el uuid

} // si no está almacenado en localStorage

uuid = localStorage.getItem("uuid"); // logra el uuid desdelocalStorage
console.log(uuid);
