export default class shareButton {
    constructor() {
        this.img = document.createElement('img');
        this.img.id = "imageShareRecording";
        this.img.src = "icons/share.svg";
        this.img.classList.add('state-button', 'green-animated-button', 'rounded-button', 'disabled');
        return this;
    }

    disable() {
        this.img.classList.add('disabled');
    }

    enable() {
        this.img.classList.remove('disabled');
    }

    copyUrlToClipboard(audioUrl) {
        navigator.clipboard.writeText(audioUrl);
        Snackbar.show({ pos: 'bottom-center', text: 'Link del audio copiado al portapapeles', actionText: 'Ocultar' });
    }
};