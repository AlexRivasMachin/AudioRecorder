import uuidv4 from '../utils/uuid/v4.js';
import Timer from './timer.js';
import shareBtn from '../js/shareButton.js';
import deleteBtn from '../js/deleteButton.js';
import recorderBtn from '../js/recorderButton.js'
import cloudActionsBtn from './cloudActionsButton.js';
import backToRecordingBtn from './backToRecordingButton.js';
import audioEntry from './audioEntry.js';

const timer = new Timer(document.getElementById('timer'));
const recordedTimeDiv = document.getElementById('recorded-time');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');
const cloudList = document.getElementById('cloud-list');
const statusButtons = document.getElementById('status-buttons');

let audioPlayer;
let mediaRecorder;
let audioChunks = [];
let uuid;

// cargar los botones de manera dinamica
const recorderBtnInstance = new recorderBtn();
const recorderBtnImg = recorderBtnInstance.getImg();

const backToRecordingBtnInstance = new backToRecordingBtn();
const backToRecordingBtnImg = backToRecordingBtnInstance.getImg();

const cloudActionsBtnInstance = new cloudActionsBtn();
const cloudActionsBtnImg = cloudActionsBtnInstance.getImg();

const deleteRecordingBtnInstance = new deleteBtn();
const deleteRecordingBtnImg = deleteRecordingBtnInstance.getImg();

const shareRecordingBtnInstance = new shareBtn();
const shareRecordingBtnImg = shareRecordingBtnInstance.getImg();

statusButtons.appendChild(backToRecordingBtnImg);
statusButtons.appendChild(cloudActionsBtnImg);
statusButtons.appendChild(deleteRecordingBtnImg);
statusButtons.appendChild(shareRecordingBtnImg);
document.getElementsByClassName('audio-recorder')[0].insertBefore(recorderBtnImg, recordedTimeDiv);


class App {
    constructor() {
        this.audio = undefined;
        this.blob = undefined;
        this.state = "recording";
    };

    init() { };

    initAudio() { };

    loadBlob() { };

    initRecord() { };

    record() { };

    stopRecording() { };

    playAudio() { };

    stopAudio() { };

    upload() { };

    deleteFile() { };
}


//generar uuid
if (!localStorage.getItem("uuid")) {

    localStorage.setItem("uuid", uuidv4());

}

uuid = localStorage.getItem("uuid");
console.log(uuid);

getRemoteAudioList();

//Ejercicio 5 del pdf, no eliminar
initAudio();
function initAudio() {
    audioPlayer = document.getElementById("audio");

    audioPlayer.addEventListener("loadedmetadata", () => {
        console.log("metadata lodaded");
    });
    audioPlayer.addEventListener("durationchange", () => {
        console.log("duration changed");
    });
    audioPlayer.addEventListener("timeupdate", () => {
        console.log("time updated");
    });
    audioPlayer.addEventListener("ended", () => {
        console.log("ended");
    });
}

//application state
let state = {
    recording: false,
    stoped: true,
    playing: false,
    paused: false
}

function setState(newState) {
    recordingImg.classList.remove("parpadea");

    state = Object.assign({}, state, newState);
    const { recording, stoped, playing, paused } = state;

    switch (true) {

        case recording:
            changeRecorderButtonAndRecordingImgAppearence('recording', 'microphone', 'red', 'recording', 'normal');
            disablePlayControls();
            timer.stopTimer();
            timer.reloadTimer();
            break;
        case stoped:
            timer.startTimer();
            changeRecorderButtonAndRecordingImgAppearence('stoped', 'stop', 'red', 'recording', "parpadea");
            break;
        case playing:
            timer.stopTimer();
            changeRecorderButtonAndRecordingImgAppearence('playing', 'play', 'green', 'playing', 'normal');
            enablePlayControls();
            break;
        case paused:
            timer.continueTimer(audioPlayer);
            changeRecorderButtonAndRecordingImgAppearence('paused', 'pause', 'green', 'playing', 'parpadea');
            break;
    }
}
function changeRecorderButtonAndRecordingImgAppearence(state, recorderIcon, color, imgIcon, imgClass) {
    recorderBtnInstance.changeRecorderButtonAppearence(state, recorderIcon, color);
    changeRecordingImgAppearence(imgIcon, imgClass);
}

function changeRecordingImgAppearence(icon, imgClass) {
    recordingImg.setAttribute('src', `icons/${icon}.svg`);
    if (imgClass == "parpadea") {
        recordingImg.classList.add(imgClass);
    }
}

recorderBtnImg.addEventListener('click', async () => {

    const { recording, stoped, paused, playing } = state;
    switch (true) {
        case recording: {
            try {
                await startRecording();
                recorderBtnInstance.unBlock();
                setState({ recording: false, stoped: true });
            } catch {
                recorderBtnInstance.block();
                alert('Porfavor permite que podamos usar el microfono');
            }
            return;
        };
        case stoped: {
            setState({ stoped: false, recording: true });
            await stopRecording();
            return;
        };
        case playing: {
            setState({ playing: false, paused: true });
            audioPlayer.play();
            return;
        };
        case paused: {
            setState({ paused: false, playing: true });
            audioPlayer.pause();
            return;
        };
    };
});

backToRecordingBtnImg.addEventListener('click', () => {
    if (!isRecording()) {
        setState({ recording: true, playing: false, paused: false });
        if (existsAudioWithPlayingClass()) {
            removeAudioWithPlayingClass();
        }

    }
    else {
        setState({ recording: false, playing: false, paused: false });
        stopRecording();
    }
});

const cloudActionState = {
    Upload: 'upload button',
    Download: 'download button',
}

cloudActionsBtnImg.addEventListener('click', () => {
    const state = cloudActionsBtnInstance.getState();
    if (existsAudioWithPlayingClass() && state == cloudActionState.Upload) {
        removeAudioWithPlayingClass();
    } else {
        donwloadAudioFromNode(getAudiosWithPlayingClass()[0]);
        setState({ recording: true, paused: false, playing: false });
    }
});

deleteRecordingBtnImg.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        deleteRecording(getAudiosWithPlayingClass()[0]);
        removeAudioWithPlayingClass();
    }
});

shareRecordingBtnImg.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        const audioEntryDiv = getAudiosWithPlayingClass()[0];
        const audioEntryHttpUrl = getAudioEntryDivAudioURL(audioEntryDiv).substring(5);
        shareRecordingBtnInstance.copyUrlToClipboard(audioEntryHttpUrl);
    }
})

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

function deleteRecording(audioEntryDiv) {
    recordingImg.classList.remove("parpadea");
    audioEntryDiv.parentNode.removeChild(audioEntryDiv);
    setState({ recording: true, paused: false, playing: false });
}

//sube visualmente un audioEntry al servidor
function publishRecording(audioEntryDiv) {
    audioEntryDiv.parentNode.removeChild(audioEntryDiv);
    Array.from(audioEntryDiv.children).forEach(c => {
        if (c.classList.contains('publish-button')) {
            c.parentNode.removeChild(c);
        }
    });

    const download = document.createElement('img');
    download.src = 'icons/cloud-download.svg';
    download.classList.add('download-button');
    audioEntryDiv.appendChild(download);

    cloudList.appendChild(audioEntryDiv);
    setState({ recording: true, paused: false, playing: false, stoped: false });
}

//sube el audioEntry indicado al api/list y trás recibir la lista de audios los publica visualmente
function upload() {
    setState({ uploading: true }); // estado actual: uploading
    const body = new FormData(); // Mediante FormData podremos subir el audio al servidor
    body.append("recording", this.blob); // en el atributo recording de formData guarda el audio para su posterior subida
    fetch("/api/upload/" + this.uuid, {
        method: "POST", // usaremos el método POST para subir el audio
        body,
    })
        .then((res) => res.json()) // el servidor, una vez recogido el audio, devolverá la lista de todos los ficheros a nombre del presente usuario(inlcuido el que se acaba de subir)
        .then((json) => {
            setState({
                files: json.files, // todos los ficheros del usuario
                uploading: false, // actualizar el estado actual
                uploaded: true, // actualizar estado actual
            });
        })
        .catch((err) => {
            this.setState({ error: true });
        });
}

function actualizarServidorVisual(filesJson) {
    while (cloudList.firstChild) {
        cloudList.removeChild(cloudList.firstChild);
    }
    filesJson.forEach(audio => {
        addToCloudRecordings('blob:http://localhost:5000/' + audio.filename, audio.date);
    });
}

function getRemoteAudioList() {
    fetch('/api/list')
        .then(response => response.json())
        .then(data => {
            actualizarServidorVisual(data.files);
        })
        .catch(error => console.error(error));
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
        if (error.name === 'NotAllowedError') {
            throw error;
        } else {
            console.error('Error accessing the microphone:', error);
        }
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
    audioBlob.date = new Date().getTime();
    addToLastRecordings(URL.createObjectURL(audioBlob), audioBlob.date);
}

function addToLastRecordings(audioUrl, audioDate) {
    try {
        const audioEntryDiv = new audioEntry(audioUrl, audioDate).getDiv();
        recentList.append(audioEntryDiv);
    }
    catch (error) {
        console.error('Error updating last recordings:', error);
    }
}

function addToCloudRecordings(audioUrl, audioDate) {
    try {
        const audioEntryDiv = new audioEntry(audioUrl, audioDate).getDiv();
        Array.from(audioEntryDiv.children).forEach(c => {
            if (c.classList.contains('publish-button')) {
                c.parentNode.removeChild(c);
            }
        });

        const download = document.createElement('img');
        download.setAttribute('src', 'icons/cloud-download.svg');
        download.setAttribute('class', 'download-button');
        audioEntryDiv.appendChild(download);

        cloudList.appendChild(audioEntryDiv);
    }
    catch (error) {
        console.error('Error updating cloud recordings:', error);
    }
}

function playTargetedAudio(audioEntryDiv, audioUrl) {
    // Remove the 'playing' class from all audio entries
    document.querySelectorAll('.audio-entry').forEach(entry => {
        entry.classList.remove('playing');
    });
    audioEntryDiv.classList.add('playing');
    recordingImg.classList.remove("parpadea");
    enableAudioPlay(audioUrl);
}

function getAudioEntryDivAudioURL(audioEntryDiv) {
    return audioEntryDiv.querySelector('[data-audio]').dataset.audio;
}

recentList.addEventListener('click', (e) => {
    const audioEntryDiv = e.target.closest('.audio-entry');
    if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-date') || e.target.classList.contains('audio-entry')) {
        const audioUrl = getAudioEntryDivAudioURL(audioEntryDiv);
        cloudActionsBtnInstance.setState(cloudActionState.Upload);
        playTargetedAudio(audioEntryDiv, audioUrl);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
        deleteRecording(audioEntryDiv);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('publish-button')) {
        //lo subirá al api/list y si no está en local lo publica
        upload();
    }
});

cloudList.addEventListener('click', (e) => {
    const audioEntryDiv = e.target.closest('.audio-entry');
    if (e.target.tagName === 'IMG' && e.target.classList.contains('play-button') || e.target.classList.contains('audio-date')) {
        const audioUrl = getAudioEntryDivAudioURL(audioEntryDiv);
        cloudActionsBtnInstance.setState(cloudActionState.Download);
        playTargetedAudio(audioEntryDiv, audioUrl);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
        deleteRecording(audioEntryDiv);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('download-button')) {
        donwloadAudioFromNode(audioEntryDiv);
    }
});

function donwloadAudioFromNode(audioEntryNode) {
    const audioDate = audioEntryNode.querySelector('.audio-date').innerHTML;
    const audioUrl = audioEntryNode.querySelector('.play-button').dataset.audio;
    addToLastRecordings(audioUrl, audioDate)
}

function enableAudioPlay(audioUrl) {
    setState({ playing: true, paused: false, stoped: false, recording: false });
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

document.addEventListener("DOMContentLoaded", function () {
    // Verificar si el navegador es compatible con WebRTC
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Solicitar permisos para acceder al micrófono
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(function (stream) {
          console.log("Permiso concedido para acceder al micrófono");
          // Aquí puedes realizar acciones adicionales si el permiso es concedido
        })
        .catch(function (error) {
          console.error("Error al obtener permisos de micrófono:", error);
        });
    } else {
      console.error("Tu navegador no es compatible con WebRTC");
    }
  });