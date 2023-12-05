export default class audioEntry {
    constructor(audioUrl, audioDate) {
        this.div = document.createElement('div');
        this.audiURL = new URL(audioUrl);
        this.div.classList.add('audio-entry');

        const play = document.createElement('img');
        play.src = 'icons/play-audio-list.svg';
        play.classList.add('play-button');
        play.setAttribute('data-audio', this.audiURL);
        this.div.appendChild(play);

        const date = document.createElement('p');
        date.classList.add('audio-date');
        moment.locale('es');
        date.innerHTML = moment(audioDate).calendar(null, {
            sameDay: '[hoy] h:mm A',
            nextDay: '[mañana] h:mm A',
            nextWeek: 'dddd h:mm A',
            lastDay: '[ayer] h:mm A',
            lastWeek: 'dddd h:mm A',
            sameElse: 'DD/MM/YYYY h:mm A'
        });
        this.div.appendChild(date);

        const publish = document.createElement('img');
        publish.src = 'icons/cloud-upload.svg';
        publish.classList.add('publish-button');
        this.div.appendChild(publish);

        const remove = document.createElement('img');
        remove.src = 'icons/delete.svg';
        remove.classList.add('remove-button');
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