export { addFunctionalityDeleteRecordingButton, enableDeleteRecordingButton, disableDeleteRecordingButton };

let boton;

function addFunctionalityDeleteRecordingButton(app){
    boton = document.getElementById('imageBackToRecording');

    boton.addEventListener('click', () => {

        app.removeAudioWithPlayingClassIfExists();
        app.setState({playing: false, paused: false, waiting: true});

    });
}

function disableDeleteRecordingButton(){
    boton.classList.add('disabled');
}
function enableDeleteRecordingButton(){
    boton.classList.remove('disabled');
}


