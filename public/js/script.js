import uuidv4 from '../utils/uuid/v4.js';
import Timer from './timer.js';
import ShareBtn from '../js/shareButton.js';

const timer = new Timer(document.getElementById('timer'));
const recorder = document.getElementById('recorder-status');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');
const cloudList = document.getElementById('cloud-list');
const buttonRecordState = document.getElementById('imageBackToRecording');
const buttonCloudActions = document.getElementById('imageCloudActions');
const buttonDeleteRecording = document.getElementById('imageDeleteRecording');
const buttonShareRecordingInstance = new ShareBtn();
const statusButtons = document.getElementById('status-buttons');

let audioPlayer;
let mediaRecorder;
let audioChunks = [];
let uuid;

// load buttons
const buttonShareRecording = statusButtons.appendChild(buttonShareRecordingInstance.img);

//fetch después de window onload para mostrar audios en api list


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
    recordingImg.removeAttribute('class');

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

    const { recording, stoped, paused, playing } = state;
    switch (true) {
        case recording: {
            try {
                await startRecording();
                setRecorderBtnUnBlocked();
                setState({ recording: false, stoped: true });
            } catch {
                setRecorderBtnBlocked();
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

function setRecorderBtnBlocked() {
    recorder.classList.add('blocked');
}

function setRecorderBtnUnBlocked() {
    recorder.classList.remove('blocked');
}

buttonRecordState.addEventListener('click', () => {
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
        removeAudioWithPlayingClass();
    } else {
        donwloadAudioFromNode(getAudiosWithPlayingClass()[0]);
        setState({ recording: true, paused: false, playing: false });
    }
});

buttonDeleteRecording.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        deleteRecording(getAudiosWithPlayingClass()[0]);
        removeAudioWithPlayingClass();
    }
});

buttonShareRecording.addEventListener('click', () => {
    if (existsAudioWithPlayingClass()) {
        const audioEntry = getAudiosWithPlayingClass()[0];
        const audioEntryHttpUrl = getAudioEntryAudioURL(audioEntry).substring(5);
        buttonShareRecordingInstance.copyUrlToClipboard(audioEntryHttpUrl);
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

function deleteRecording(audioEntry) {
    recordingImg.removeAttribute('class');
    audioEntry.parentNode.removeChild(audioEntry);
    setState({ recording: true, paused: false, playing: false });
}

//sube visualmente un audioEntry al servidor
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

    cloudList.appendChild(audioEntry);
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

function createAudioEntry(audioUrl, audioDate) {
    const audioEntry = document.createElement('div');
    audioEntry.setAttribute('class', 'audio-entry');

    const play = document.createElement('img');
    play.setAttribute('src', 'icons/play-audio-list.svg');
    play.setAttribute('class', 'play-button');
    play.setAttribute('data-audio', new URL(audioUrl));
    audioEntry.appendChild(play);

    const date = document.createElement('p');
    date.setAttribute('class', 'audio-date');
    moment.locale('es');
    date.innerHTML = moment(audioDate).calendar(null, {
        sameDay: '[hoy] h:mm A',
        nextDay: '[mañana] h:mm A',
        nextWeek: 'dddd h:mm A',
        lastDay: '[ayer] h:mm A',
        lastWeek: 'dddd h:mm A',
        sameElse: 'DD/MM/YYYY h:mm A'
    });
    audioEntry.appendChild(date);

    const publish = document.createElement('img');
    publish.setAttribute('src', 'icons/cloud-upload.svg');
    publish.setAttribute('class', 'publish-button');
    audioEntry.appendChild(publish);

    const remove = document.createElement('img');
    remove.setAttribute('src', 'icons/delete.svg');
    remove.setAttribute('class', 'remove-button');
    audioEntry.appendChild(remove);

    return audioEntry;
}

function addToLastRecordings(audioUrl, audioDate) {
    try {
        const audioEntry = createAudioEntry(audioUrl, audioDate);
        recentList.append(audioEntry);
    }
    catch (error) {
        console.error('Error updating last recordings:', error);
    }
}

function addToCloudRecordings(audioUrl, audioDate) {
    try {
        const audioEntry = createAudioEntry(audioUrl, audioDate);
        Array.from(audioEntry.children).forEach(c => {
            if (c.classList.contains('publish-button')) {
                c.parentNode.removeChild(c);
            }
        });

        const download = document.createElement('img');
        download.setAttribute('src', 'icons/cloud-download.svg');
        download.setAttribute('class', 'download-button');
        audioEntry.appendChild(download);

        cloudList.appendChild(audioEntry);
    }
    catch (error) {
        console.error('Error updating cloud recordings:', error);
    }
}

function playTargetedAudio(audioEntry, audioUrl) {
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

function getAudioEntryFilename(audioEntry) {
    const url = getAudioEntryAudioURL(audioEntry);
    return url.split('/').pop();
}

function getAudioEntryDate(audioEntry) {
    return audioEntry.querySelector('.audio-date').textContent;
}

recentList.addEventListener('click', (e) => {
    if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-date') || e.target.classList.contains('audio-entry')) {
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
        //lo subirá al api/list y si no está en local lo publica
        upload();
    }
});

cloudList.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('play-button') || e.target.classList.contains('audio-date')) {
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


