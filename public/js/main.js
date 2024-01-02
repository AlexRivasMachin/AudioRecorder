import Timer from './timer.js';
import shareBtn from '../js/shareButton.js';
import deleteBtn from '../js/deleteButton.js';
import recorderBtn from '../js/recorderButton.js'
import cloudActionsBtn from './cloudActionsButton.js';
import backToRecordingBtn from './backToRecordingButton.js';
import audioEntry from './audioEntry.js';
import cloudActionsButton from './cloudActionsButton.js';

const timer = new Timer(document.getElementById('timer'));
const recordedTimeDiv = document.getElementById('recorded-time');
const recordingImg = document.getElementById('recording-img');
const recentList = document.getElementById('recent-list');
const cloudList = document.getElementById('cloud-list');
const statusButtons = document.getElementById('status-buttons');
const divPrincipal = document.querySelector('.audio-area');
const divAudios = document.querySelector('.audio-toolbar');
const divAudioElements = document.querySelector('.audioElements');
const url = window.location.origin;

let user_id;
let app;

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

const playMode = new URLSearchParams(window.location.search).get("play");
console.log(playMode);


statusButtons.appendChild(backToRecordingBtnImg);
statusButtons.appendChild(cloudActionsBtnImg);
statusButtons.appendChild(deleteRecordingBtnImg);
statusButtons.appendChild(shareRecordingBtnImg);
document.getElementsByClassName('audio-recorder')[0].insertBefore(recorderBtnImg, recordedTimeDiv);


class App {
    constructor() {
        this.stream = null;
        this.audio = undefined;
        this.blob = undefined;
        this.audioPlayer = document.getElementById("audio");
        this.mediaRecorder = undefined;
        this.audioChunks = [];
    };

    init() {
        this.#getPermisosMicrofono();
        this.initAudio();
        this.setPlayModeIfNeeded();
    };

    #getPermisosMicrofono() {
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                this.stream = stream;
            })
            .catch(function (error) {
                console.error("Microphone not allowed error", error);
            });
    }

    initAudio() {
        onloadedmetadata = () => { console.log("metadata loaded") };
        ondurationchange = () => { console.log("duration changed") };
        ontimeupdate = () => { console.log("time updated") };
        onended = () => { console.log("ended") };
    };

    async initRecord(stream) {
        this.mediaRecorder = new MediaRecorder(stream, {});
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.blob = new Blob(this.audioChunks, { type: 'audio/wav' });
            this.loadBlob(this.blob);
        };

        this.record();
    };

    loadBlob(blob) {
        this.audio = new Audio(URL.createObjectURL(blob));
    };


    record() {
        this.mediaRecorder.start();
    };

    async stopRecording() {
        if (this.isRecording()) {
            this.mediaRecorder.stop();
            await sleep(30);
            if (this.audioChunks.length > 0) {
                this.#createAndSaveRecording();
            }
        }
    };

    isRecording() {
        return this.mediaRecorder && this.mediaRecorder.state === 'recording';
    }

    #createAndSaveRecording() {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        audioBlob.date = new Date().getTime();
        addToLastRecordings(URL.createObjectURL(audioBlob), audioBlob.date);
    }

    setAudio(audioURL) {
        setState({ playing: true, paused: false, stoped: false, recording: false });
        this.audioPlayer.src = audioURL;
    }

    changeAudioUrl(audioURL) {
        this.audioPlayer.src = audioURL;
    }

    playAudio() {
        this.audioPlayer.play();
    };

    pauseAudio() {
        this.audioPlayer.pause();
    };

    stopAudio() {
        this.audioPlayer.stop();
    };

    async upload() {
        const fileNum = cloudList.childElementCount;
        const body = new FormData(); // Mediante FormData podremos subir el audio al servidor
        let audioBlob = await this.getAudioBlob();

        body.append("recording", audioBlob, `${user_id}_Audio${fileNum}`); // en el atributo recording de formData guarda el audio para su posterior subida

        fetch(`${url}/api/upload/${user_id}`, {
            method: "POST", // usaremos el método POST para subir el audio
            headers: {},
            body: body
        }).then((res) => {
            switch (res.status) {
                case 200:
                    return res.json();
                case 403:
                    Snackbar.show({ pos: 'bottom-center', text: 'Inicia session para poder subir audios', actionText: 'Ocultar' });
                    break;
                case 409:
                    Snackbar.show({ pos: 'bottom-center', text: 'El audio ya esta en la nube', actionText: 'Ocultar' });
                    break;
                case 500:
                    Snackbar.show({ pos: 'bottom-center', text: 'Algo a ido mal, vuelve a probar más tarde', actionText: 'Ocultar' });
                    break;
            }
        }).then((data) => {
            // el servidor, una vez recogido el audio, devolverá la lista de todos los ficheros a nombre del presente usuario(inlcuido el que se acaba de subir)
            Snackbar.show({ pos: 'bottom-center', text: 'El audio se ha subido correctamente', actionText: 'Ocultar' });
            actualizarServidorVisual(data.files);
        }).catch((err) => {
            Snackbar.show({ pos: 'bottom-center', text: 'Algo ha ido mal, prueba de nuevo dentro de unos minutos', actionText: 'Ocultar' });
        });
    };

    getAudioBlob() {
        let audioPlayer = this.getAudioPlayer();
        let audioSrc = audioPlayer.src;
        return fetch(audioSrc)
            .then((res) => res.blob());
    }

    deleteFile() {
    };

    getAudioPlayer() {
        return this.audioPlayer;
    };

    setPlayModeIfNeeded() {
        if (playMode != null) {
            this.setPlayMode();
        }
    }

    async setPlayMode() {
        divPrincipal.removeChild(divAudios);
        divAudioElements.removeChild(statusButtons);

        try{
            const data = await fetch(`/api/play/${playMode}`).then(response => response.json());
            const audioUrl = await fetch(`${url}/getRecordingUrl/${encodeURIComponent(data.filename)}`).then(response => response.json()).then(data => data.url);
            this.setAudio(audioUrl);
        }catch (error) {
            window.location.replace(`${url}/error404`);
        }
    }

    uploadAudio(audioUrl) {
        app.changeAudioUrl(audioUrl);
        app.upload();
    }
}

//obtener id de usuario
async function getUserId() {
    try{
        const response = await fetch(`${url}/session`);
        const data = await response.json();
        user_id = data;
        console.log("user id", user_id);
        getRemoteAudioList();
        return user_id;
    }catch (error) {
        // Esta reproduciendo un audio de otro usuario
    }
}

getUserId();

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
            changeRecorderButtonAndRecordingImgAppearence('recording', 'stop', 'red', 'recording', 'parpadea');
            timer.startTimer();
            break;
        case stoped:
            changeRecorderButtonAndRecordingImgAppearence('stoped', 'microphone', 'red', 'recording', 'normal');
            disablePlayControls();
            timer.stopTimer();
            timer.reloadTimer();
            break;
        case playing:
            timer.stopTimer();
            changeRecorderButtonAndRecordingImgAppearence('playing', 'play', 'green', 'playing', 'normal');
            enablePlayControls();
            break;
        case paused:
            timer.continueTimer(app.getAudioPlayer());
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
            setState({ stoped: true, recording: false });
            await app.stopRecording();
            return;
        };
        case stoped: {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                await app.initRecord(stream);
                recorderBtnInstance.unBlock();
                setState({ recording: true, stoped: false });
            } catch {
                recorderBtnInstance.block();
                alert('Porfavor permite que podamos usar el microfono');
            }
            return;
        };
        case playing: {
            setState({ playing: false, paused: true });
            app.playAudio();
            return;
        };
        case paused: {
            setState({ paused: false, playing: true });
            app.pauseAudio();
            return;
        };
    };
});

backToRecordingBtnImg.addEventListener('click', () => {
    if (!app.isRecording()) {
        setState({ recording: false, stoped: true, playing: false, paused: false });
        if (existsAudioWithPlayingClass()) {
            removeAudioWithPlayingClass();
        }
    }
});

const cloudActionState = {
    Upload: 'upload button',
    Download: 'download button',
}

cloudActionsBtnImg.addEventListener('click', () => {
    const state = cloudActionsBtnInstance.getState();
    if (existsAudioWithPlayingClass() && state == cloudActionState.Upload) {
        let audioEntryDiv = getAudiosWithPlayingClass()[0];
        let audioUrl = getAudioEntryDivAudioURL(audioEntryDiv);

        app.uploadAudio(audioUrl);
        removeAudioWithPlayingClass();
    } else {
        donwloadAudioFromAudioEntryDiv(getAudiosWithPlayingClass()[0]);
        setState({ recording: false, stoped: true, paused: false, playing: false });
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
        const audioEntryHttpUrl = getAudioEntryDivAudioURL(audioEntryDiv).toString().substring(5);
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
    setState({ recording: false, stoped: true, paused: false, playing: false });
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

function actualizarServidorVisual(filesJson) {
    while (cloudList.firstChild) {
        cloudList.removeChild(cloudList.firstChild);
    }
    filesJson.forEach(audio => {
        fetch(`${url}/getRecordingUrl/${encodeURIComponent(audio.filename)}`)
            .then(response => response.json())
            .then(data => {
                const urlArchivo = data.url;
                addToCloudRecordings(urlArchivo, audio.date);
            })
            .catch(error => {
                console.error('Error al obtener la URL del archivo:', error);
            });
    });
}

async function getRemoteAudioList() {
    if (user_id == undefined || user_id == null) {
        user_id = await getUserId();
    }
    try {
        const response = await fetch(`${url}/api/list/${user_id}`);
        const data = await response.json();
        actualizarServidorVisual(data.files);
    } catch (error) {
        console.error(error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addToLastRecordings(audioUrl, audioDate) {
    try {
        const audioEntryDiv = new audioEntry(audioUrl, audioDate, cloudActionState.Upload).getDiv();
        recentList.append(audioEntryDiv);
    }
    catch (error) {
        console.error('Error updating last recordings:', error);
    }
}

function addToCloudRecordings(audioUrl, audioDate) {
    try {
        const audioEntryDiv = new audioEntry(audioUrl, audioDate, cloudActionState.Download).getDiv();
        Array.from(audioEntryDiv.children).forEach(c => {
            if (c.classList.contains('publish-button')) {
                c.parentNode.removeChild(c);
            }
        });

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
    app.setAudio(audioUrl);
}

function getAudioEntryDivAudioURL(audioEntryDiv) {
    return new URL(audioEntryDiv.querySelector('[data-audio]').dataset.audio);
}

recentList.addEventListener('click', (e) => {
    const audioEntryDiv = e.target.closest('.audio-entry');
    const audioUrl = getAudioEntryDivAudioURL(audioEntryDiv);
    if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-date') || e.target.classList.contains('audio-entry')) {
        cloudActionsBtnInstance.setState(cloudActionState.Upload);
        playTargetedAudio(audioEntryDiv, audioUrl);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
        deleteRecording(audioEntryDiv);
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('publish-button')) {
        //lo subirá al api/list y si no está en local lo publica
        app.uploadAudio(audioUrl);
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
        const audioUrl = audioEntryDiv.querySelector('.play-button').dataset.audio;
        const fileName = audioUrl.split('/').pop();
        fetch(`${url}/api/delete/${fileName}`)
        .then(response => {
            switch (response.status) {
                case 200:
                    Snackbar.show({ pos: 'bottom-center', text: 'El audio se ha eliminado correctamente', actionText: 'Ocultar' });
                    deleteRecording(audioEntryDiv);
                    return response.json();
                case 403:
                    Snackbar.show({ pos: 'bottom-center', text: 'Inicia session para poder eliminar audios', actionText: 'Ocultar' });
                    break;
                case 404:
                    Snackbar.show({ pos: 'bottom-center', text: 'El audio que quieres eliminar ya no existe', actionText: 'Ocultar' });
                    break;
                case 500:
                    Snackbar.show({ pos: 'bottom-center', text: 'Algo a ido mal, vuelve a probar más tarde', actionText: 'Ocultar' });
                    break;
            }
        })
        .then(data => actualizarServidorVisual(data.files))
        .catch(error => {
            Snackbar.show({ pos: 'bottom-center', text: 'Algo ha ido mal, prueba de nuevo dentro de unos minutos', actionText: 'Ocultar' });
        });
    }
    if (e.target.tagName === 'IMG' && e.target.classList.contains('download-button')) {
        donwloadAudioFromAudioEntryDiv(audioEntryDiv);
    }
});

function donwloadAudioFromAudioEntryDiv(audioEntryDiv) {
    const audioDate = audioEntryDiv.querySelector('.audio-date').innerHTML;
    const audioUrl = new URL(audioEntryDiv.querySelector('.play-button').dataset.audio);
    addToLastRecordings(audioUrl, audioDate)
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


document.addEventListener("DOMContentLoaded", async () => {
    app = new App();
    app.init();
});