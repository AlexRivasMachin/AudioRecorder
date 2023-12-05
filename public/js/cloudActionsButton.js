const cloudActionState = {
    Upload: 'upload button',
    Download: 'download button',
}

export default class cloudActionsButton {
    constructor() {
        this.img = document.createElement('img');
        this.state = 'upload button';
        this.img.id = "imageCloudActions";
        this.img.src = "icons/cloud-upload.svg";
        this.img.classList.add('state-button', 'green-animated-button', 'rounded-button', 'disabled');
    }

    getState() {
        switch (this.state) {
            case 'upload button': return cloudActionState.Upload;
            case 'download button': return cloudActionState.Download;
            default: return null;
        }
    }

    setState(state) {
        if (state == null) {
            return;
        }

        switch (state) {
            case cloudActionState.Upload:
                this.state = cloudActionState.Upload;
                this.img.setAttribute('src', 'icons/cloud-upload.svg')
                break;
            case cloudActionState.Download:
                this.state = cloudActionState.Download;
                this.img.setAttribute('src', 'icons/cloud-download.svg')
                break;
        }
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