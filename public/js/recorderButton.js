export default class recorderButton {
    constructor() {
        this.img = document.createElement('img');
        this.img.id = "recorder-status";
        this.img.src = "icons/microphone.svg";
        this.img.classList.add('animated-button', 'red-animated-button', 'rounded-button');
        this.img.alt = "record button";
    }

    getImg() {
        return this.img;
    }

    changeRecorderButtonAppearence(state, recorderIcon, color) {
        this.img.setAttribute('src', `icons/${recorderIcon}.svg`);
        this.img.setAttribute('alt', state);
        this.img.removeAttribute('class');
        this.img.classList.add('animated-button', `${color}-animated-button`, 'rounded-button');
    }

    block() {
        this.img.classList.add('blocked');
    }

    unBlock() {
        this.img.classList.remove('blocked');
    }
};