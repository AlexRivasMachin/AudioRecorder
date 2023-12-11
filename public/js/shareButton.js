export default class shareButton {
    constructor() {
        this.img = document.createElement('img');
        this.img.id = "imageShareRecording";
        this.img.src = "icons/share.svg";
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

    copyUrlToClipboard(audioUrl) {
        const audioID = audioUrl.split('/').pop();
        const playURL = `${window.location.origin}/?play=${audioID}`;
        navigator.clipboard.writeText(playURL);
        Snackbar.show({ pos: 'bottom-center', text: 'Link del audio copiado al portapapeles', actionText: 'Ocultar' });
    }
};