import uuidv4 from '../utils/uuid/v4.js';
import Timer from './timer.js';

const audioPlayer = document.getElementById('audio');
const timer = new Timer(document.getElementById('timer'));
const recorder = document.getElementById('recorder-status');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');
const likedList = document.getElementById('liked-list');
const buttonRecordState = document.getElementById('imageBackToRecording');
const buttonCloudActions = document.getElementById('imageCloudActions');
const buttonDeleteRecording = document.getElementById('imageDeleteRecording');
const statusButtons = document.getElementById('status-buttons');

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
            disablePlayControls();
            break;
        case recorderState.Stop:
            changeRecorderButtonAndRecordingImgAppearence(state, 'stop', 'red', 'recording', "parpadea");
            break;
        case recorderState.Play:
            changeRecorderButtonAndRecordingImgAppearence(state, 'play', 'green', 'playing', 'normal');
            enablePlayControls();
            break;
        case recorderState.Pause:
            changeRecorderButtonAndRecordingImgAppearence(state, 'pause', 'green', 'playing', 'parpadea');
            break;
    }
}
function changeRecorderButtonAndRecordingImgAppearence(state, recorderIcon, color, imgIcon, imgClass) {
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
                await startRecording();
                timer.startTimer();
                return;
            };
            case recorderState.Stop: {
                setRecorderState(recorderState.Record);
                timer.stopTimer();
                timer.reloadTimer();
                await stopRecording();
                return;
            };
            case recorderState.Play: {
                setRecorderState(recorderState.Pause);
                timer.continueTimer(audioPlayer);
                audioPlayer.play();
                return;
            };
            case recorderState.Pause: {
                setRecorderState(recorderState.Play);
                timer.stopTimer();
                audioPlayer.pause();
                return;
            };
        };
    };
});

buttonRecordState.addEventListener('click', () => {
    if (isRecording()) {

    }
    else {
        setRecorderState(recorderState.Record);
        if (existsAudioWithPlayingClass()) {
            removeAudioWithPlayingClass();
        }
    }
});

const cloudActionState = {
    Upload: 'upload button',
    Download: 'download button',
}

function getCloudActionsBtnState() {
    let alt = buttonCloudActions.getAttribute('alt');
    switch (alt) {
        case 'upload button': return cloudActionState.Upload;
        case 'download button': return cloudActionState.Download;
        default: return null;
    }
}

function setCloudActionsBtnState(state) {
    if (state == null) {
        return;
    }

    switch (state) {
        case cloudActionState.Upload:
            buttonCloudActions.setAttribute('src', 'icons/cloud-upload.svg')
            buttonCloudActions.setAttribute('alt', cloudActionState.Upload);
            break;
        case cloudActionState.Download:
            buttonCloudActions.setAttribute('src', 'icons/cloud-download.svg')
            buttonCloudActions.setAttribute('alt', cloudActionState.Download);
            break;
    }
}

buttonCloudActions.addEventListener('click', () => {
    const state = getCloudActionsBtnState();
    if (existsAudioWithPlayingClass() && state == cloudActionState.Upload) {
        publishRecording(getAudiosWithPlayingClass()[0]);
        removeAudioWithPlayingClass();
    } else {
        donwloadAudioFromNode(getAudiosWithPlayingClass()[0]);
        setRecorderState(recorderState.Record);
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
    Array.from(audioEntry.children).forEach(c => {
        if (c.classList.contains('publish-button')) {
            c.parentNode.removeChild(c);
        }
    });

    const download = document.createElement('img');
    download.setAttribute('src', 'icons/cloud-download.svg');
    download.setAttribute('class', 'download-button');
    audioEntry.appendChild(download);

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
    addToLastRecordings(URL.createObjectURL(audioBlob), audioBlob.name);
}


function addToLastRecordings(audioUrl, audioName) {
    try {
        const audioEntry = document.createElement('div');
        audioEntry.setAttribute('class', 'audio-entry');

        const play = document.createElement('img');
        play.setAttribute('src', 'icons/play-audio-list.svg');
        play.setAttribute('class', 'play-button');
        play.setAttribute('data-audio', new URL(audioUrl));
        audioEntry.appendChild(play);

        const name = document.createElement('p');
        name.setAttribute('class', 'audio-name');
        name.innerHTML = audioName;
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

function playTargetedAudio(audioEntry, audioUrl) {
    timer.stopTimer();
    timer.reloadTimer();

    // Remove the 'playing' class from all audio entries
    document.querySelectorAll('.audio-entry').forEach(entry => {
        entry.classList.remove('playing');
    });
    audioEntry.classList.add('playing');
    recordingImg.removeAttribute('class');
    enableAudioPlay(audioUrl);
}

function getAudioEntryAudioURL(audioEntry) {
    return audioEntry.querySelector('[data-audio]').dataset.audio;
}

recentList.addEventListener('click', (e) => {
    if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-name') || e.target.classList.contains('audio-entry')) {
        const audioEntry = e.target.closest('.audio-entry');
        const audioUrl = getAudioEntryAudioURL(audioEntry);
        setCloudActionsBtnState(cloudActionState.Upload);
        playTargetedAudio(audioEntry, audioUrl);
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

likedList.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('play-button') || e.target.classList.contains('audio-name')) {
        const audioEntry = e.target.closest('.audio-entry');
        const audioUrl = e.target.dataset.audio;
        setCloudActionsBtnState(cloudActionState.Download);
        playTargetedAudio(audioEntry, audioUrl);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
        const audioEntry = e.target.closest('.audio-entry');
        deleteRecording(audioEntry);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('download-button')) {
        const audioEntry = e.target.closest('.audio-entry');
        donwloadAudioFromNode(audioEntry);
    }
});

function donwloadAudioFromNode(audioEntryNode) {
    const audioName = audioEntryNode.querySelector('.audio-name').innerHTML;
    const audioUrl = audioEntryNode.querySelector('.play-button').dataset.audio;
    addToLastRecordings(audioUrl, audioName)
}

function enableAudioPlay(audioUrl) {
    setRecorderState(recorderState.Play);
    audioPlayer.src = audioUrl;
}

function enablePlayControls() {
    Array.from(statusButtons.children).forEach(c => {
        c.classList.remove('disabled');
    });
}

function disablePlayControls() {
    Array.from(statusButtons.children).forEach(c => {
        c.classList.add('disabled');
    });
}

if (!localStorage.getItem("uuid")) {

    localStorage.setItem("uuid", uuidv4()); // genera y gaurda el uuid

} // si no está almacenado en localStorage

uuid = localStorage.getItem("uuid"); // logra el uuid desdelocalStorage
console.log(uuid);
