import uuidv4 from '../utils/uuid/v4.js';
import Timer from './timer.js';

import { addFunctionalityRecordButton, changeRecorderButtonAppareance } from "./buttonRecord.js";
import { addFunctionalityChangeToRecordButton, removeClassAtributeFromChangeToRecordButton, enableChangeToRecordButton, disableChangeToRecordButton } from './buttonChangeToRecord.js';
import { addFunctionalityCloudButton, setCloudButtonState, enableCloudButton, disableCloudButton } from './buttonCloud.js';
import { addFunctionalityDeleteRecordingButton, enableDeleteRecordingButton, disableDeleteRecordingButton } from './buttonDeleteRecording.js';

class App{

    audio;
    blob;
    state;
    mediaRecorder;
    timer;
    recordingImg;
    recentList;
    linkedList;

    constructor(){
        this.init();
        this.state = {
            recording: false,
            playing: false,
            paused: false,
            waiting: true //en caso de que esté esperando a hacer record
        }
        this.recordingImg = document.getElementById('recording-img');
        this.recentList = document.getElementById('recent-list');
        this.likedList = document.getElementById('liked-list');
        this.timer = new Timer(document.getElementById('timer'));

        addFunctionalityRecordButton(this);
        addFunctionalityChangeToRecordButton(this);
        addFunctionalityCloudButton(this);
        addFunctionalityDeleteRecordingButton(this);

        this.addRecentListFunctionality();
        this.addRecentListFunctionality();
    }

    async init(){
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        this.initAudio();
        this.initRecord(stream);
    }

    initAudio(){
        this.audio = document.getElementById("audio");

        this.audio.addEventListener("loadedmetadata", () => {
            console.log("metadata lodaded");
        });
        this.audio.addEventListener("durationchange", () => {
            console.log("duration changed");
        });
        this.audio.addEventListener("timeupdate", () => {
            console.log("time updated");
        });
        this.audio.addEventListener("ended", () => {
            console.log("ended");
        });
    }

    initRecord(stream){
        this.mediaRecorder = new MediaRecorder(stream);
        let audioChuncks = [];
        console.log(`audio chunks actual: ${audioChuncks}`);

        this.mediaRecorder.addEventListener('dataavailable', (event) => {
            if(event.data.size > 0){
               audioChuncks.push(event.data); 
            }
        });

        this.mediaRecorder.addEventListener('stop', () => {
            let audioBlob = new Blob(audioChuncks, {type: 'audio/wav'});
            this.loadBlob(audioBlob);
        });
    }

    loadBlob(audioBlob){
        let audioURL = URL.createObjectURL(audioBlob);
        this.audio.src = audioURL;

        audioBlob.name = new Date().toUTCString().slice(4, 22);
        this.addToLastRecordings(URL.createObjectURL(audioBlob), audioBlob.name);
    }

    async record(){
        await this.init();
        await this.mediaRecorder.start();
    }

    async stopRecording(){
        if(this.state.recording == true){
            await this.mediaRecorder.stop(); 
        }
    }
    
    async playAudio(){
        await this.audio.play();
    }
    
    stopAudio(){
        this.audio.pause();
    }

    upload(){

    }

    deleteFile(){

    }

    async setState(state) {
        const {recording, waiting, playing, paused} = this.state;

        removeClassAtributeFromChangeToRecordButton();

        switch(true){
            case recording:
                changeRecorderButtonAppareance(state, 'microphone', 'red');
                this.changeRecordingImgAppareance('recording', 'normal');
                this.disablePlayControls();
                await this.reloadTimer();
                this.timer.stopTimer();
                this.timer.reloadTimer();
                break;
            case waiting:
                changeRecorderButtonAppareance(state, 'stop', 'red');
                this.changeRecordingImgAppareance('recording', 'parpadea');
                await this.record();
                this.timer.startTimer();
                break;
            case playing:
                changeRecorderButtonAppareance(state, 'play', 'green');
                this.changeRecordingImgAppareance('playing', 'normal');
                this.enablePlayControls();
                this.stopAudio();
                this.timer.continueTimer(this.audio);
                break;
            case paused:
                changeRecorderButtonAppareance(state, 'paused', 'green');
                this.changeRecordingImgAppareance('playing', 'parpadea');
                this.timer.stopTimer();
                await this.playAudio();
        }

        this.state = Object.assign({}, this.state, state);
    }

    enablePlayControls(){
        enableChangeToRecordButton();
        enableCloudButton();
        enableDeleteRecordingButton();
    }
    disablePlayControls(){
        disableChangeToRecordButton();
        disableCloudButton();
        disableDeleteRecordingButton();
    }

    changeRecordingImgAppareance(icon, imgClass) {
        recordingImg.setAttribute('src', `icons/${icon}.svg`);
        if (imgClass == "parpadea") {
            recordingImg.setAttribute('class', "parpadea");
        }
    }
        
    render(){
        //si eso en un futuro hacer que esto actualice lo visual y llamarlo desde setState
    }

    removeAudioWithPlayingClassIfExists(){
        if (this.existsAudioWithPlayingClass()) {
            this.removeAudioWithPlayingClass();
        }
    }
    existsAudioWithPlayingClass() {
        return this.getAudiosWithPlayingClass().length > 0;
    }

    removeAudioWithPlayingClass() {
        this.getAudiosWithPlayingClass().forEach(audio => {
            audio.classList.remove('playing');
        })
    }

    getAudiosWithPlayingClass() {
        return document.querySelectorAll('.playing');
    }

    publishFirstRecordingWithPlayingClass(){
        publishRecording(this.getAudiosWithPlayingClass[0]);
    }

    publishRecording(audioEntry) {
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
        setRecorderState(recorderState.Record);
    }

    downloadFirstNodeWithPlayingClass(){
        this.downloadAudioFromNode(this.getAudiosWithPlayingClass()[0]);
    }

    downloadAudioFromNode(audioEntryNode) {
        const audioName = audioEntryNode.querySelector('.audio-name').innerHTML;
        const audioUrl = audioEntryNode.querySelector('.play-button').dataset.audio;
        addToLastRecordings(audioUrl, audioName)
    }

    addToLastRecordings(audioUrl, audioName) {
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

    deleteFirstAudioWithPlayingClass(){
        deleteRecording(this.getAudiosWithPlayingClass()[0]);
    }

    deleteRecording(audioEntry) {
        recordingImg.removeAttribute('class'); //puede que me haya equivocado y que esto sea lo que hay que hacer en todos los casos del switch
        audioEntry.parentNode.removeChild(audioEntry);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addRecentListFunctionality(){
        this.recentList.addEventListener('click', (e) => {
            if ((e.target.tagName === 'IMG' && e.target.classList.contains('play-button')) || e.target.classList.contains('audio-name') || e.target.classList.contains('audio-entry')) {
                const audioEntry = e.target.closest('.audio-entry');
                const audioUrl = this.getAudioEntryAudioURL(audioEntry);
                setCloudButtonState({upload: true, download: false});
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
    }

    getAudioEntryAudioURL(audioEntry) {
        return audioEntry.querySelector('[data-audio]').dataset.audio;
    }

    playTargetedAudio(audioEntry, audioUrl) {
        // Remove the 'playing' class from all audio entries
        document.querySelectorAll('.audio-entry').forEach(entry => {
            entry.classList.remove('playing');
        });
        audioEntry.classList.add('playing');
        this.enableAudioPlay(audioUrl);
    }

    enableAudioPlay(audioUrl) {
        this.setState({playing: true, waiting: false, paused: false, recording: false});
        this.audio.src = audioUrl;
    }

    addLikedListFunctionality(){
        this.likedList.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.classList.contains('play-button') || e.target.classList.contains('audio-name')) {
                const audioEntry = e.target.closest('.audio-entry');
                const audioUrl = e.target.dataset.audio;
                setCloudButtonState({upload: false, download: true});
                this.playTargetedAudio(audioEntry, audioUrl);
            }
            if (e.target.tagName === 'IMG' && e.target.classList.contains('remove-button')) {
                const audioEntry = e.target.closest('.audio-entry');
                this.deleteRecording(audioEntry);
            }
            if (e.target.tagName === 'IMG' && e.target.classList.contains('download-button')) {
                const audioEntry = e.target.closest('.audio-entry');
                this.donwloadAudioFromNode(audioEntry);
            }
        });
    }
    
    donwloadAudioFromNode(audioEntryNode) {
        const audioName = audioEntryNode.querySelector('.audio-name').innerHTML;
        const audioUrl = audioEntryNode.querySelector('.play-button').dataset.audio;
        this.addToLastRecordings(audioUrl, audioName)
    }
    

}
let app = new App();

let uuid;

if (!localStorage.getItem("uuid")) {

    localStorage.setItem("uuid", uuidv4()); // genera y gaurda el uuid

} // si no está almacenado en localStorage

uuid = localStorage.getItem("uuid"); // logra el uuid desdelocalStorage
console.log(uuid);
