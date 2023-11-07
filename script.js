const audio = document.getElementById("audio");
const playPauseButton = document.getElementById("play-pause");
const seekBar = document.getElementById("seek-bar");

playPauseButton.addEventListener("click", function () {
    if (audio.paused) {
        audio.play();
        playPauseButton.innerText = "Pause";
    } else {
        audio.pause();
        playPauseButton.innerText = "Play";
    }
});

audio.addEventListener("timeupdate", function () {
    seekBar.value = (audio.currentTime / audio.duration) * 100;
});

seekBar.addEventListener("input", function () {
    const seekTime = (audio.duration / 100) * seekBar.value;
    audio.currentTime = seekTime;
});
