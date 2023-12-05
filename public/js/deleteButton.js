export default class deleteButton {
    constructor() {
        this.img = document.createElement('img');
        this.img.id = "imageDeleteRecording";
        this.img.src = "icons/delete.svg";
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