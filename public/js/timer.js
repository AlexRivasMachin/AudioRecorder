class Timer {
    htmlElement;
    interval;
    startTime;

    constructor(htmlElement) {
        this.htmlElement = htmlElement;
    }

    reloadTimer() {
        this.setTextContent('00:00:00');
    }

    setTextContent(text) {
        this.htmlElement.textContent = text;
    }

    startTimer() {
        this.reloadTimer();
        this.startTime = new Date().getTime();
        this.createInterval(false);
    }

    continueTimer(audioPlayer) {
        this.createInterval(true, audioPlayer);
    }

    createInterval(isContinue, audioPlayer) {
        this.interval = setInterval(() => {
            let currentTime;
            let elapsedTime;
            if (isContinue) {
                elapsedTime = Math.floor(audioPlayer.currentTime);
            } else {
                currentTime = new Date().getTime();
                elapsedTime = Math.floor((currentTime - this.startTime) / 1000);
            }

            const hours = Math.floor(elapsedTime / 3600);
            const minutes = Math.floor(elapsedTime / 60);
            const seconds = elapsedTime % 60;
            const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
            const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            const formattedHours = hours < 10 ? `0${hours}` : hours;
            this.setTextContent(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
        }, 10);
    }

    stopTimer() {
        clearInterval(this.interval);
    }
}

export default Timer;