// script.js

// URLs der Audiodateien, die den jeweiligen Instrumenten zugeordnet sind
const audioUrls = {
    mic: "https://cdn.glitch.global/deaad1b3-c137-49a3-b9f1-f506e217d6d8/Michael%20Jackson%20Loop-vocals.mp3?v=1750764233292",
    guitar: "https://cdn.glitch.global/deaad1b3-c137-49a3-b9f1-f506e217d6d8/Michael%20Jackson%20Loop-bass.mp3?v=1750764228420",
    drums: "https://cdn.glitch.global/deaad1b3-c137-49a3-b9f1-f506e217d6d8/Michael%20Jackson%20Loop-drums.mp3?v=1750764225146",
  };
  
  // AudioContext initialisieren (Web Audio API)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioObjects = {};
  
  // Lädt und konfiguriert eine Audiodatei für ein Instrument
  async function loadAudio(name, modelSelector) {
    const response = await fetch(audioUrls[name]);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = await audioContext.decodeAudioData(arrayBuffer);
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.0;
    const panner = audioContext.createPanner();
    panner.panningModel = "HRTF";
    panner.distanceModel = "linear";
    panner.maxDistance = 10;
    panner.rolloffFactor = 1.5;
    const model = document.querySelector(modelSelector);
    const { x, y, z } = model.getAttribute("position");
    panner.setPosition(x, y, z);
    gainNode.connect(panner).connect(audioContext.destination);
    audioObjects[name] = { buffer, gainNode, model, panner };
  }
  
  // Schaltet Klang an/aus
  function toggleSound(name) {
    const obj = audioObjects[name];
    obj.gainNode.gain.value = obj.gainNode.gain.value > 0 ? 0.0 : 1.0;
  }
  
  // Startet alle Audios, nur eines ist zu Beginn hörbar
  async function startAllSounds(nameToUnmute) {
    if (audioContext.state === "suspended") await audioContext.resume();
    await Promise.all([
      loadAudio("mic", "#micModel"),
      loadAudio("guitar", "#guitarModel"),
      loadAudio("drums", "#drumsModel"),
    ]);
    const startTime = audioContext.currentTime + 0.1;
    Object.keys(audioObjects).forEach((name) => {
      const obj = audioObjects[name];
      const source = audioContext.createBufferSource();
      source.buffer = obj.buffer;
      source.loop = true;
      source.connect(obj.gainNode);
      source.start(startTime);
      obj.source = source;
      obj.gainNode.gain.value = name === nameToUnmute ? 1.0 : 0.0;
    });
  }
  
  let hasStarted = false;
  document.querySelectorAll(".interactive").forEach((model) => {
    model.addEventListener("click", async (e) => {
      const modelId = e.target.id;
      const name = modelId.replace("Model", "");
      if (!hasStarted) {
        hasStarted = true;
        await startAllSounds(name);
        sendStartAllSounds(modelId);
      } else {
        toggleSound(name);
        sendSoundToggle(modelId);
      }
    });
  });
  
  // Web-Rooms Kommunikation
  const webRoomsWebSocketServerAddr = "https://nosch.uber.space/web-rooms/";
  let clientId = null;
  let clientCount = 0;
  const socket = new WebSocket(webRoomsWebSocketServerAddr);
  
  function sendStartAllSounds(modelId) {
    sendRequest("*broadcast-message*", ["start-sound", modelId]);
  }
  function sendSoundToggle(modelId) {
    sendRequest("*broadcast-message*", ["sound-toggle", modelId]);
  }
  function sendRequest(...message) {
    socket.send(JSON.stringify(message));
  }
  
  socket.addEventListener("open", () => {
    sendRequest("*enter-room*", "hello-world");
    sendRequest("*subscribe-client-count*");
    sendRequest("*subscribe-client-enter-exit*");
    setInterval(() => socket.send(""), 30000);
  });
  
  socket.addEventListener("close", () => {
    clientId = null;
    document.body.classList.add("disconnected");
  });
  
  socket.addEventListener("message", (event) => {
    const data = event.data;
    if (!data) return;
    const incoming = JSON.parse(data);
    switch (incoming[0]) {
      case "*client-id*":
        clientId = incoming[1];
        break;
      case "*client-count*":
        clientCount = incoming[1];
        break;
      case "start-sound": {
        const name = incoming[1].replace("Model", "");
        if (!hasStarted) {
          hasStarted = true;
          startAllSounds(name);
        }
        break;
      }
      case "sound-toggle": {
        const name = incoming[1].replace("Model", "");
        toggleSound(name);
        break;
      }
      case "*error*":
        console.warn("Serverfehler:", incoming[1]);
        break;
      default:
        console.log("Unbekannte Nachricht:", incoming);
    }
  });
  


// Fragezeichen-Model und zugehörigen Text holen
const questionModel = document.querySelector('#question');
const questionText  = document.querySelector('#helptext-wrapper');

// Klick-Listener: sichtbaren Zustand umschalten
questionModel.addEventListener('click', () => {
  const isVisible = questionText.getAttribute('visible');
  questionText.setAttribute('visible', !isVisible);
});