const targetFrameInput = document.getElementById("targetFrame");
const preTimerInput = document.getElementById("preTimer");
const calibrationInput = document.getElementById("calibration");
const frameHitInput = document.getElementById("frameHit");
const mainTimerLabel = document.getElementById("mainTimer");
const subTimerLabel = document.getElementById("subTimer");
const startButton = document.getElementById("startButton");
const consoleFps = 59.6555;

const audioContext = new (window.AudioContext || window.webkitAudioContext)(); // Create AudioContext

// Path to your local beep sound
const beepSoundPath = "resources/sounds/beep.wav"; // Adjust the path based on your folder structure

// Function to load the beep sound
let beepBuffer = null;
fetch(beepSoundPath)
  .then((res) => res.arrayBuffer()) // Fetch the sound file as an array buffer
  .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer)) // Decode the array buffer to audio data
  .then((buffer) => {
    beepBuffer = buffer; // Store the decoded audio buffer for later playback
  })
  .catch((err) => console.error("Audio load error:", err));

// Function to play the beep sound
const playBeep = () => {
  if (beepBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = beepBuffer;
    source.connect(audioContext.destination); // Connect the source to the destination (speakers)
    source.start(); // Play the sound
  }
};

let preTimerMillis = +preTimerInput.value;
let targetMillis = 0;
let frameHitMillis = 0;
let adjustedTargetMillis = 0;
let timerInterval = null;

const onInputSubmit = (input, func) => {
  func()
};

const framesToMillis = (f) => Math.floor(f * 1000 / consoleFps); //Converts frames for ms
const millisToFrames = (ms) => Math.floor(ms / 1000 * consoleFps);

const getAdjustedTargetMillis = (target, hit) => {
  if (hit <= 0) {
    return target;
  }

  const offset = target - hit;
  calibration.value = offset;
  return target + offset;
};

onInputSubmit(targetFrameInput, () => {
  const targetFrame = +targetFrameInput.value;
  targetMillis = framesToMillis(targetFrame);
  if (targetMillis > 0) {
    adjustedTargetMillis = getAdjustedTargetMillis(targetMillis, frameHitMillis);
    subTimer.textContent = formatTime(adjustedTargetMillis);
  }
});

onInputSubmit(preTimerInput, () => {
  preTimerMillis = +preTimerInput.value;
  mainTimer.textContent = formatTime(preTimerMillis);
});

onInputSubmit(frameHitInput, () => {
  const frameHit = +frameHitInput.value;
  if (frameHit > 0) {
    frameHitMillis = framesToMillis(frameHit);
    adjustedTargetMillis = getAdjustedTargetMillis(targetMillis, frameHitMillis);
    subTimer.textContent = formatTime(adjustedTargetMillis);
  }
});

const formatTime = (millis) => { //Converts ms to s/ms
  const seconds = Math.floor(millis / 1000);
  millis -= seconds*1000;
  return String(seconds) + ":" + String(millis).padStart(3, "0");
};

const resetTimer = () => {
  window.clearInterval(timerInterval);
  mainTimer.textContent = formatTime(preTimerMillis);
  mainTimer.style.backgroundColor = "";
  subTimer.textContent = formatTime(adjustedTargetMillis);
  startButton.disabled = false;
  targetFrameInput.disabled = false;
  preTimerInput.disabled = false;
  frameHitInput.disabled = false;
  calibrationInput.disabled = false;
};

const startTimer = (millis, onComplete) => {
  audioContext.resume(); // Make sure AudioContext is resumed
  let beepCount = 5;
  const targetDate = Date.now() + millis;

  timerInterval = window.setInterval(() => {
    const now = Date.now();

    if (targetDate - now < beepCount * 500) {
      playBeep(); // Play beep sound
      beepCount--;
    }

    if (now > targetDate) {
      window.clearInterval(timerInterval);
      onComplete();
      return;
    }

    mainTimer.textContent = formatTime(targetDate - now);
  }, 1);
};

startButton.onclick = () => {
  startButton.disabled = true;
  targetFrameInput.disabled = true;
  preTimerInput.disabled = true;
  frameHitInput.disabled = true;
  calibrationInput.disabled = true;

  startTimer(preTimerMillis, () => {
    subTimer.textContent = formatTime(0);
    startTimer(adjustedTargetMillis, resetTimer);
  });
};

mainTimer.textContent = formatTime(preTimerMillis);
subTimer.textContent = formatTime(resetTimer);
