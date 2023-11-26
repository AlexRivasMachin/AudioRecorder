export { addFunctionalityRecordButton, changeRecorderButtonAppareance };

let boton;

function addFunctionalityRecordButton(app){
    boton = document.getElementById('buttonRecord');

    boton.addEventListener('click', () => {

        const {recording, waiting, playing, paused} = app.state;

        switch(true){
            case recording:
                app.setState({recording: false, waiting: true});
                break;
            case waiting:
                app.setState({waiting: false, recording: true});
                break;
            case playing:
                app.setState({playing: false, paused: true});
                break;
            case paused:
                app.setState({paused: false, playing: true});
                break;
        }
    })
}

function changeRecorderButtonAppareance(state, icon, color) {
    boton.setAttribute('src', `icons/${icon}.svg`);
    boton.setAttribute('alt', state);
    boton.removeAttribute('class');
    boton.classList.add('animated-button', `${color}-animated-button`, 'rounded-button');
}

