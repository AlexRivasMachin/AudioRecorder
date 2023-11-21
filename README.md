# AudioRecorder
## BY Sertis:
+ AlexRivasMachín 🌶️
+ gomezBc 🥥
+ MartinLopezDeIpina 🍍
## Documentación 📃
### ¿Que hace nuestra app?
+ Nuestra aplicación es una herramienta para la grabacíon y reproducción de audio.
### ¿Que elementos tiene?
+ Tiene un menu de navegación vertical para tener información del audio y todo lo que pasa en todo momento. También el menu de reproducción es intercactivo y bla bla bla

### Index.hmtl 🏗️
### Style.css 💟
### script.js 🐷
Elementos que vamos a utilizar:
+ audioPlayer
+ timer
+ recorder
+ recordedTime
+ recordingImg
+ recentList
+ likedList
+ buttonRecordState
+ buttonSaveRecording
+ buttonDeleteRecording

Variables que vamos a usar:
+ mediaRecorder
+ audioChunks
+ startTime
+ timerInterval
+ lastAudios
+ RecordState:
```JS
const recorderState = {
    Record: 'record button',
    Stop: 'stop button',
    Play: 'play button',
    Pause: 'pause button',
}
```
## Funciones
### 1. getRecorderState:
```JS
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

```

### 2. setRecorderState:
```JS
function setRecorderState(state) {
    if (state != null) {
        switch (state) {
            case recorderState.Record: {
                recorder.setAttribute('src', "icons/microphone.svg");
                recorder.setAttribute('alt', state);
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'red-animated-button', 'rounded-button');
                recordingImg.removeAttribute('class');
                recordingImg.setAttribute('src', "icons/recording.svg");
                return;
            };
            case recorderState.Stop: {
                recorder.setAttribute('src', "icons/stop.svg");
                recorder.setAttribute('alt', state);
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'red-animated-button', 'rounded-button');
                timer.removeAttribute('class');
                recordingImg.setAttribute('class', "parpadea");
                return;
            };
            case recorderState.Play: {
                recorder.setAttribute('src', "icons/play.svg");
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'green-animated-button', 'rounded-button');
                recorder.setAttribute('alt', state);
                recordingImg.removeAttribute('class');
                recordingImg.setAttribute('src', "icons/playing.svg");
                return;
            };
            case recorderState.Pause: {
                recorder.setAttribute('src', "icons/pause.svg");
                recorder.removeAttribute('class');
                recorder.classList.add('animated-button', 'green-animated-button', 'rounded-button');
                recorder.setAttribute('alt', state);
                recordingImg.setAttribute('class', "parpadea");
                return;
            };
        };
    };
}
```
### 3. deleteRecording:
```JS
function deleteRecording(audioEntry) {
    recordingImg.removeAttribute('class');
    audioEntry.parentNode.removeChild(audioEntry);
    stopTimer();
    timer.textContent = '00:00:00';
    setRecorderState(recorderState.Record);
}
```
### 4. publishRecording:
```JS
function publishRecording(audioEntry) {
    audioEntry.parentNode.removeChild(audioEntry);
    likedList.appendChild(audioEntry);
    stopTimer();
    timer.textContent = '00:00:00';
    setRecorderState(recorderState.Record);
}
```

### 5. startRecording:
```JS
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
```
### 6. sleep:
```JS
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

### 7. stopRecording:
```JS
async function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        await mediaRecorder.stop();
        // Si no espero un poco no actualiza la lista, no se porq falla el await anterior
        await sleep(200);
        // Detenemos el temporizador
        stopTimer();
        if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            audioBlob.name = new Date().toUTCString().slice(5, 16);
            addToLastRecordings(audioBlob);
        }
        timer.textContent = "00:00:00";
    }
}
```


### 8. startTimer:
```JS
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

```


### 9. stopTimer:
```JS
function stopTimer() {
    // Detiene el temporizador
    clearInterval(timerInterval);
}
```


### 10. addToLastRecordings:
```JS
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
    } catch (error) {
        console.error('Error updating last recordings:', error);
    }
}
```

## 11. enableAudioPlay:
```JS
function enableAudioPlay(audioUrl) {
    setRecorderState(recorderState.Play);
    audioPlayer.src = audioUrl;
}
```

## 12. updateTimerWhilePlaying:
```JS
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
```














