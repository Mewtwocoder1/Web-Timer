const headerImg = document.getElementById("headerImg");
const targetFrameInput = document.getElementById("targetFrame");
const preTimerInput = document.getElementById("preTimer");
const frameHitInput = document.getElementById("frameHit");
const audioFeedbackInput = document.getElementById("audioFeedback");
const visualFeedbackInput = document.getElementById("visualFeedback");
const mainTimerLabel = document.getElementById("mainTimer");
const subTimerLabel = document.getElementById("subTimer");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");

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
let audioFeedback = true;
let visualFeedback = true;

const onInputSubmit = (input, func) => {
  input.onblur = func;
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      func();
    }
  });
};

const framesToMillis = (f) => Math.round(f * 1000 / 60);

const getAdjustedTargetMillis = (target, hit) => {
  if (hit <= 0) {
    return target;
  }

  const offset = target - hit;
  return target + offset;
};

onInputSubmit(targetFrameInput, () => {
  const targetFrame = +targetFrameInput.value;
  targetMillis = framesToMillis(targetFrame);
  if (targetMillis > 0) {
    startButton.disabled = false;
    frameHitInput.disabled = false;
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

onInputSubmit(audioFeedbackInput, () => {
   audioFeedback = audioFeedbackInput.checked;
});

onInputSubmit(visualFeedbackInput, () => {
  visualFeedback = visualFeedbackInput.checked;
});

const formatTime = (millis) => {
  const minutes = Math.floor(millis / (1000*60));
  millis -= minutes*1000*60;
  const seconds = Math.floor(millis / 1000);
  millis -= seconds*1000;
  return String(minutes).padStart(3, "0") + ":" + String(seconds).padStart(2, "0") + "." + String(millis).padStart(3, "0");
};

const resetTimer = () => {
  window.clearInterval(timerInterval);
  mainTimer.textContent = formatTime(preTimerMillis);
  mainTimer.style.backgroundColor = "";
  subTimer.textContent = formatTime(adjustedTargetMillis);
  startButton.disabled = false;
  resetButton.disabled = true;
  targetFrameInput.disabled = false;
  preTimerInput.disabled = false;
  frameHitInput.disabled = false;
};

const startTimer = (millis, onComplete) => {
  audioContext.resume(); // Make sure AudioContext is resumed
  let beepCount = 3;
  const targetDate = Date.now() + millis;
  let initialBeepSkipped = false;

  timerInterval = window.setInterval(() => {
    const now = Date.now();

    if (initialBeepSkipped && targetDate - now < beepCount * 1000) {
      playBeep(); // Play beep sound
      beepCount--;
    }

    if (now > targetDate) {
      window.clearInterval(timerInterval);
      onComplete();
      return;
    }

    mainTimer.textContent = formatTime(targetDate - now);

    if (!initialBeepSkipped) {
      initialBeepSkipped = true;
    }
  }, 1);
};

startButton.onclick = () => {
  startButton.disabled = true;
  resetButton.disabled = false;
  targetFrameInput.disabled = true;
  preTimerInput.disabled = true;
  frameHitInput.disabled = true;

  startTimer(preTimerMillis, () => {
    subTimer.textContent = formatTime(0);
    startTimer(adjustedTargetMillis, resetTimer);
  });
};

resetButton.onclick = resetTimer;

fetch("https://pokeapi.co/api/v2/pokemon/dialga/")
  .then((res) => res.json())
  .then((json) => headerImg.src = json.sprites.versions["generation-vii"].icons.front_default);
mainTimer.textContent = formatTime(preTimerMillis);
subTimer.textContent = formatTime(0);
startButton.disabled = true;
resetButton.disabled = true;
