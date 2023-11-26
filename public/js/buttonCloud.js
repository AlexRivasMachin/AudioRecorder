
export { addFunctionalityCloudButton, setCloudButtonState, enableCloudButton, disableCloudButton};

let boton;
let state = {
   upload: false,
   download: false,
}

function addFunctionalityCloudButton(app){
    boton = document.getElementById('imageCloudActions');

    boton.addEventListener('click', () => {

        if (app.existsAudioWithPlayingClass() && state.upload == true) {
            app.publishFirstRecordingWithPlayingClass();
            app.removeAudioWithPlayingClass();
        } else {
            app.downloadFirstNodeWithPlayingClass();
            app.setState({playing: false, paused: false, waiting: true})
        }

    });
}

function setCloudButtonState(newState){
    state = Object.assign({}, newState, state);

    const{upload, download} = state

    switch(true){
        case upload:
            boton.setAttribute('src', 'icons/cloud-upload.svg')
            boton.setAttribute('alt', 'upload button');
            break;
        case download:
            boton.setAttribute('src', 'icons/cloud-download.svg')
            boton.setAttribute('alt', 'download button');
            break;
    }
}

function disableCloudButton(){
    boton.classList.add('disabled');
}
function enableCloudButton(){
    boton.classList.remove('disabled');
}



