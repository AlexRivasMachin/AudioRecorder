export default class backToRecordingButton {
    constructor() {
        this.img = document.createElement('img');
        this.img.id = "imageBackToRecording";
        this.img.src = "icons/back-to-record.svg";
        this.img.classList.add('state-button', 'green-animated-button', 'rounded-button', 'disabled');
    }

    getImg() {
        return this.img;
    }

    disable() {
        this.img.classList.add('disabled');
    }

    enable() {
        this.img.classList.remove('disabled');
    }
};