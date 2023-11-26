export { removeClassAtributeFromChangeToRecordButton, addFunctionalityChangeToRecordButton, disableChangeToRecordButton, enableChangeToRecordButton};

let boton;

function addFunctionalityChangeToRecordButton(app){
    boton = document.getElementById('imageBackToRecording');

    boton.addEventListener('click', () => {

        const {recording, waiting, playing, paused} = app.state;

        app.removeAudioWithPlayingClassIfExists();

        switch(true){
            case playing:
                app.setState({playing: false, paused: true});
                break;
            case paused:
                app.setState({paused: false, playing: true});
                break;
        }
    })
}

function removeClassAtributeFromChangeToRecordButton(){
    boton.removeAtribute('class');
}

function disableChangeToRecordButton(){
    boton.classList.add('disabled');
}
function enableChangeToRecordButton(){
    boton.classList.remove('disabled');
}


