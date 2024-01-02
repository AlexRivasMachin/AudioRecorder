const cloudActionState = {
    Upload: 'upload button',
    Download: 'download button',
}

const dateFormats = {
    sameDay: '[hoy] h:mm A',
    nextDay: '[mañana] h:mm A',
    nextWeek: 'dddd h:mm A',
    lastDay: '[ayer] h:mm A',
    lastWeek: 'dddd h:mm A',
    sameElse: 'DD/MM/YYYY h:mm A'
};

export default class audioEntry {
    constructor(audioUrl, audioDate, buttonState) {
        this.div = document.createElement('div');
        this.audiURL = audioUrl;
        this.div.classList.add('audio-entry');

        const play = document.createElement('img');
        play.src = 'icons/play-audio-list.svg';
        play.classList.add('play-button');
        play.setAttribute('data-audio', this.audiURL);
        this.div.appendChild(play);

        const date = document.createElement('p');
        date.classList.add('audio-date');
        moment.locale('es');
        // Check if audioDate matches any of the formats
        let isValidDate = false;
        for (let format of Object.values(dateFormats)) {
            if (moment(audioDate, format, true).isValid()) {
                isValidDate = true;
            }
        }
        if(isValidDate){
            date.innerHTML = audioDate;
        }else{
            date.innerHTML = moment(audioDate).calendar(null, dateFormats);
        }
        this.div.appendChild(date);

        switch(buttonState) {
            case cloudActionState.Upload :
                const publish = document.createElement('img');
                publish.src = 'icons/cloud-upload.svg';
                publish.classList.add('publish-button','audio-entry-button');
                publish.alt = buttonState;
                this.div.appendChild(publish);
                break;
            case cloudActionState.Download:
                const download = document.createElement('img');
                download.setAttribute('src', 'icons/cloud-download.svg');
                download.classList.add('download-button', 'audio-entry-button');
                download.alt = buttonState;
                this.div.appendChild(download);
                break;
        }

        const remove = document.createElement('img');
        remove.src = 'icons/delete.svg';
        remove.classList.add('remove-button','audio-entry-button');
        this.div.appendChild(remove);
        return this;
    }

    getDiv() {
        return this.div;
    }

    getAudioURL() {
        return this.audiURL;
    }
}