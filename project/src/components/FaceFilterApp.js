import { HandDetector } from '../utils/HandDetector.js';

export class FaceFilterApp {
  constructor() {
    this.video = null;
    this.audioContext = null;
    this.micStream = null;
    this.analyser = null;
    this.voiceLevel = 0;
    this.voiceAnimationId = null;
    this.handDetector = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.lastPinch = false;
    this.pinchCooldown = false;
    this.buttonHoverStates = {
      startRecording: false,
      stopRecording: false
    };
    
    // Tutorial system
    this.tutorialActive = false;
    this.currentTutorialStep = 0;
    this.tutorialSteps = [
      {
        title: "Welcome to Face Filter App! 🎥",
        description: "Let's learn how to use this amazing AR recording app",
        target: null,
        duration: 3000
      },
      {
        title: "Step 1: Enable Camera & Microphone 📷",
        description: "Click this button to start your camera and microphone",
        target: "#open-camera",
        duration: 4000
      },
      {
        title: "Step 2: Hand Detection 👋",
        description: "Show your hand to the camera - it will be tracked in real-time!",
        target: "#canvas",
        duration: 5000
      },
      {
        title: "Step 3: Try Hand Gestures ✋",
        description: "Make these gestures:\n• Open Palm ✋\n• Thumbs Up 👍\n• Finger Point 👉\n• Pinch 👌",
        target: "#gesture-label",
        duration: 6000
      },
      {
        title: "Step 4: Voice Level Monitor 🎤",
        description: "Speak to see your voice level - the bar shows your audio input",
        target: "#voice-bar-container",
        duration: 4000
      },
      {
        title: "Step 5: Start Recording 🎬",
        description: "Make a PINCH gesture 👌 over this button to start recording",
        target: "#start-recording-zone",
        duration: 5000
      },
      {
        title: "Step 6: Stop Recording ⏹️",
        description: "Make a PINCH gesture 👌 over this button to stop and save your recording",
        target: "#stop-recording-zone",
        duration: 5000
      },
      {
        title: "Tutorial Complete! 🎉",
        description: "You're ready to create amazing AR videos! Try pinching over the buttons to control recording.",
        target: null,
        duration: 4000
      }
    ];
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    this.showTutorialPrompt();
  }

  createUI() {
    const container = document.getElementById('face-filter-app');
    container.innerHTML = `
      <div style="position:relative; width:100%; max-width:800px; margin:40px auto; background:rgba(30,30,40,0.9); border-radius:20px; box-shadow:0 8px 32px rgba(0,0,0,0.18); padding:32px 0;">
        <!-- Tutorial Prompt -->
        <div id="tutorial-prompt" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); z-index:1000; background:rgba(0,0,0,0.95); padding:40px; border-radius:20px; text-align:center; color:#fff; box-shadow:0 10px 50px rgba(0,0,0,0.5); max-width:400px;">
          <h2 style="color:#4ecdc4; font-size:2rem; margin-bottom:20px; font-weight:bold;">🎓 Tutorial Available!</h2>
          <p style="font-size:1.2rem; margin-bottom:30px; line-height:1.6;">Would you like to learn how to use this AR Face Filter app?</p>
          <div style="display:flex; gap:20px; justify-content:center;">
            <button id="start-tutorial" style="padding:15px 30px; font-size:1.1rem; border-radius:12px; background:#4ecdc4; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">Yes, Show Me! 🚀</button>
            <button id="skip-tutorial" style="padding:15px 30px; font-size:1.1rem; border-radius:12px; background:#666; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">Skip Tutorial</button>
          </div>
        </div>

        <!-- Tutorial Overlay -->
        <div id="tutorial-overlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:999; display:none; backdrop-filter:blur(5px);">
          <div id="tutorial-content" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); background:#fff; padding:40px; border-radius:20px; text-align:center; max-width:500px; box-shadow:0 20px 80px rgba(0,0,0,0.3);">
            <div id="tutorial-step-counter" style="position:absolute; top:15px; right:20px; background:#4ecdc4; color:#fff; padding:5px 12px; border-radius:15px; font-size:0.9rem; font-weight:bold;"></div>
            <h3 id="tutorial-title" style="color:#333; font-size:1.8rem; margin-bottom:20px; font-weight:bold;"></h3>
            <p id="tutorial-description" style="color:#666; font-size:1.1rem; line-height:1.6; margin-bottom:30px; white-space:pre-line;"></p>
            <div id="tutorial-progress" style="width:100%; height:4px; background:#eee; border-radius:2px; margin-bottom:20px; overflow:hidden;">
              <div id="tutorial-progress-bar" style="height:100%; background:#4ecdc4; width:0%; transition:width 0.3s ease;"></div>
            </div>
            <div style="display:flex; gap:15px; justify-content:center;">
              <button id="tutorial-prev" style="padding:12px 24px; font-size:1rem; border-radius:10px; background:#666; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">← Previous</button>
              <button id="tutorial-next" style="padding:12px 24px; font-size:1rem; border-radius:10px; background:#4ecdc4; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">Next →</button>
              <button id="tutorial-close" style="padding:12px 24px; font-size:1rem; border-radius:10px; background:#ff5252; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">Close</button>
            </div>
          </div>
        </div>

        <!-- Animated Tutorial Spotlight -->
        <div id="tutorial-spotlight" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:998; display:none;">
          <div id="spotlight-circle" style="position:absolute; width:200px; height:200px; border:4px solid #4ecdc4; border-radius:50%; background:rgba(78,205,196,0.1); box-shadow:0 0 0 9999px rgba(0,0,0,0.7); animation:pulse-spotlight 2s infinite;"></div>
        </div>

        <!-- Tutorial Hand Animation -->
        <div id="tutorial-hand" style="position:absolute; z-index:997; display:none; pointer-events:none;">
          <div style="font-size:3rem; filter:drop-shadow(0 0 10px rgba(78,205,196,0.8)); animation:float-hand 2s ease-in-out infinite;">👌</div>
        </div>

        <button id="open-camera" style="margin:0 auto 24px auto; display:block; padding:20px 48px; font-size:2rem; border-radius:16px; background:#4ecdc4; color:#fff; border:4px solid #ff0000; cursor:pointer; font-weight:bold; transition:all 0.3s ease;">Open Camera</button>
        <div style="position:relative; width:100%; aspect-ratio:16/9; max-width:760px; margin:0 auto;">
          <video id="video" autoplay muted playsinline style="width:100%; height:100%; border-radius:16px; background:#222; display:none; object-fit:cover; transform:scaleX(-1);"></video>
          <canvas id="canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; display:none; transform:scaleX(-1);"></canvas>
          
          <!-- Gesture and coordinate display -->
          <div id="gesture-label" style="position:absolute; top:24px; left:24px; color:#fff; font-size:1.8rem; font-family:Arial,sans-serif; font-weight:bold; text-shadow:0 2px 8px #000,0 0 2px #000; z-index:10; pointer-events:none; text-align:left; letter-spacing:1px; display:none; background:rgba(0,0,0,0.6); padding:8px 16px; border-radius:8px;"></div>
          
          <div id="coordinates-display" style="position:absolute; top:24px; right:24px; color:#4ecdc4; font-size:1.2rem; font-family:monospace; font-weight:bold; text-shadow:0 2px 8px #000; z-index:10; pointer-events:none; text-align:right; display:none; background:rgba(0,0,0,0.6); padding:8px 16px; border-radius:8px;"></div>
          
          <!-- Interactive buttons with hover zones -->
          <div id="start-recording-zone" style="position:absolute; bottom:20px; left:25%; transform:translateX(-50%); width:120px; height:80px; z-index:20; display:none; cursor:pointer;">
            <button id="start-recording" style="width:100%; height:100%; padding:12px 20px; font-size:1.2rem; border-radius:12px; background:#ff5252; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease; box-shadow:0 4px 16px rgba(255,82,82,0.4);">▶️ Start</button>
          </div>
          
          <div id="stop-recording-zone" style="position:absolute; bottom:20px; right:25%; transform:translateX(50%); width:120px; height:80px; z-index:20; display:none; cursor:pointer;">
            <button id="stop-recording" style="width:100%; height:100%; padding:12px 20px; font-size:1.2rem; border-radius:12px; background:#4ecdc4; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease; box-shadow:0 4px 16px rgba(78,205,196,0.4);">⏹️ Stop</button>
          </div>
          
          <!-- Recording status -->
          <div id="recording-status" style="position:absolute; top:24px; left:50%; transform:translateX(-50%); color:#ff5252; font-size:1.5rem; font-weight:bold; z-index:30; display:none; background:rgba(255,82,82,0.2); padding:8px 16px; border-radius:8px; border:2px solid #ff5252; animation:pulse 2s infinite;">● Recording...</div>
          
          <!-- Pinch instruction -->
          <div id="pinch-instruction" style="position:absolute; bottom:100px; left:50%; transform:translateX(-50%); color:#4ecdc4; font-size:1.1rem; font-weight:bold; z-index:10; display:none; background:rgba(0,0,0,0.7); padding:8px 16px; border-radius:8px; text-align:center;">👌 Pinch over buttons to activate</div>
        </div>
        
        <!-- Voice level display -->
        <div id="voice-bar-container" style="width:90%; max-width:600px; height:32px; background:#222; border-radius:8px; margin:32px auto 0 auto; display:none; box-shadow:0 2px 8px #0002;">
          <div id="voice-bar" style="height:100%; width:0%; background:linear-gradient(90deg, #4ecdc4, #44a08d); border-radius:8px; transition:width 0.1s ease;"></div>
        </div>
        <div id="voice-level-label" style="text-align:center; color:#4ecdc4; font-size:1.5rem; margin-top:8px; display:none; font-weight:bold;">Voice Level: 0</div>
        
        <!-- Error display -->
        <div id="camera-error" style="color:#ff5252; margin-top:24px; text-align:center; font-weight:bold;"></div>
        
        <!-- Tutorial restart button -->
        <button id="restart-tutorial" style="position:absolute; top:20px; right:20px; padding:10px 15px; font-size:0.9rem; border-radius:8px; background:#4ecdc4; color:#fff; border:none; cursor:pointer; font-weight:bold; transition:all 0.3s ease; display:none;">📚 Tutorial</button>
      </div>
      
      <style>
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        @keyframes pulse-spotlight {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes float-hand {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes slideInFromTop {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideInFromBottom {
          0% { transform: translateY(100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        #start-recording-zone:hover #start-recording,
        #start-recording-zone.pinch-hover #start-recording {
          background: #ff6b6b !important;
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(255,82,82,0.6);
        }
        
        #stop-recording-zone:hover #stop-recording,
        #stop-recording-zone.pinch-hover #stop-recording {
          background: #5dd8d0 !important;
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(78,205,196,0.6);
        }
        
        .button-active {
          transform: scale(0.95) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        
        .tutorial-highlight {
          animation: pulse-spotlight 2s infinite;
          box-shadow: 0 0 20px #4ecdc4 !important;
        }
      </style>
    `;
  }

  setupEventListeners() {
    document.getElementById('open-camera').addEventListener('click', () => this.startCameraAndMic());
    
    // Tutorial event listeners
    document.getElementById('start-tutorial').addEventListener('click', () => this.startTutorial());
    document.getElementById('skip-tutorial').addEventListener('click', () => this.skipTutorial());
    document.getElementById('tutorial-next').addEventListener('click', () => this.nextTutorialStep());
    document.getElementById('tutorial-prev').addEventListener('click', () => this.prevTutorialStep());
    document.getElementById('tutorial-close').addEventListener('click', () => this.closeTutorial());
    document.getElementById('restart-tutorial').addEventListener('click', () => this.restartTutorial());
    
    // Setup recording button listeners with delay
    setTimeout(() => {
      const startZone = document.getElementById('start-recording-zone');
      const stopZone = document.getElementById('stop-recording-zone');
      const startBtn = document.getElementById('start-recording');
      const stopBtn = document.getElementById('stop-recording');
      
      if (startBtn) {
        startBtn.addEventListener('click', () => this.startRecording());
        startZone.addEventListener('mouseenter', () => this.buttonHoverStates.startRecording = true);
        startZone.addEventListener('mouseleave', () => this.buttonHoverStates.startRecording = false);
      }
      
      if (stopBtn) {
        stopBtn.addEventListener('click', () => this.stopRecording());
        stopZone.addEventListener('mouseenter', () => this.buttonHoverStates.stopRecording = true);
        stopZone.addEventListener('mouseleave', () => this.buttonHoverStates.stopRecording = false);
      }
    }, 100);
  }

  showTutorialPrompt() {
    document.getElementById('tutorial-prompt').style.display = 'block';
  }

  startTutorial() {
    document.getElementById('tutorial-prompt').style.display = 'none';
    document.getElementById('tutorial-overlay').style.display = 'block';
    document.getElementById('restart-tutorial').style.display = 'block';
    this.tutorialActive = true;
    this.currentTutorialStep = 0;
    this.showTutorialStep();
  }

  skipTutorial() {
    document.getElementById('tutorial-prompt').style.display = 'none';
    document.getElementById('restart-tutorial').style.display = 'block';
  }

  restartTutorial() {
    this.startTutorial();
  }

  showTutorialStep() {
    const step = this.tutorialSteps[this.currentTutorialStep];
    
    // Update tutorial content
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-description').textContent = step.description;
    document.getElementById('tutorial-step-counter').textContent = `${this.currentTutorialStep + 1}/${this.tutorialSteps.length}`;
    
    // Update progress bar
    const progressPercent = ((this.currentTutorialStep + 1) / this.tutorialSteps.length) * 100;
    document.getElementById('tutorial-progress-bar').style.width = progressPercent + '%';
    
    // Update navigation buttons
    document.getElementById('tutorial-prev').style.display = this.currentTutorialStep === 0 ? 'none' : 'inline-block';
    document.getElementById('tutorial-next').style.display = this.currentTutorialStep === this.tutorialSteps.length - 1 ? 'none' : 'inline-block';
    
    // Handle spotlight and animations
    this.showTutorialSpotlight(step.target);
    
    // Auto-advance after duration (except for last step)
    if (this.currentTutorialStep < this.tutorialSteps.length - 1) {
      setTimeout(() => {
        if (this.tutorialActive) {
          this.nextTutorialStep();
        }
      }, step.duration);
    }
  }

  showTutorialSpotlight(target) {
    const spotlight = document.getElementById('tutorial-spotlight');
    const circle = document.getElementById('spotlight-circle');
    const hand = document.getElementById('tutorial-hand');
    
    // Hide previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    if (target) {
      const targetEl = document.querySelector(target);
      if (targetEl) {
        // Show spotlight
        spotlight.style.display = 'block';
        
        // Position spotlight circle
        const rect = targetEl.getBoundingClientRect();
        const container = document.getElementById('face-filter-app');
        const containerRect = container.getBoundingClientRect();
        
        const relativeX = rect.left - containerRect.left + rect.width / 2;
        const relativeY = rect.top - containerRect.top + rect.height / 2;
        
        circle.style.left = (relativeX - 100) + 'px';
        circle.style.top = (relativeY - 100) + 'px';
        
        // Add highlight to target
        targetEl.classList.add('tutorial-highlight');
        
        // Show hand animation for pinch gestures
        if (target.includes('recording-zone')) {
          hand.style.display = 'block';
          hand.style.left = (relativeX - 25) + 'px';
          hand.style.top = (relativeY - 50) + 'px';
        } else {
          hand.style.display = 'none';
        }
      }
    } else {
      spotlight.style.display = 'none';
      hand.style.display = 'none';
    }
  }

  nextTutorialStep() {
    if (this.currentTutorialStep < this.tutorialSteps.length - 1) {
      this.currentTutorialStep++;
      this.showTutorialStep();
    }
  }

  prevTutorialStep() {
    if (this.currentTutorialStep > 0) {
      this.currentTutorialStep--;
      this.showTutorialStep();
    }
  }

  closeTutorial() {
    this.tutorialActive = false;
    document.getElementById('tutorial-overlay').style.display = 'none';
    document.getElementById('tutorial-spotlight').style.display = 'none';
    document.getElementById('tutorial-hand').style.display = 'none';
    
    // Remove highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  }

  async startCameraAndMic() {
    // Close tutorial if active
    if (this.tutorialActive) {
      this.closeTutorial();
    }
    
    const errorDiv = document.getElementById('camera-error');
    try {
      // Camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 }, 
        audio: true 
      });
      
      this.video = document.getElementById('video');
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.video.srcObject = stream;
      this.video.style.display = 'block';
      this.canvas.style.display = 'block';
      document.getElementById('open-camera').style.display = 'none';
      errorDiv.textContent = '';

      // Microphone setup
      this.micStream = stream;
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      // Show UI elements with animation
      const elements = [
        'voice-bar-container',
        'voice-level-label',
        'start-recording-zone',
        'stop-recording-zone',
        'pinch-instruction',
        'gesture-label',
        'coordinates-display'
      ];
      
      elements.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el) {
          setTimeout(() => {
            el.style.display = 'block';
            el.style.animation = 'slideInFromBottom 0.5s ease-out';
          }, index * 100);
        }
      });
      
      this.startVoiceLevelLoop();

      // Hand detection
      this.handDetector = new HandDetector();
      await this.handDetector.initialize();
      this.startHandLoop();
      
    } catch (err) {
      errorDiv.textContent = 'Unable to access camera or microphone: ' + (err?.message || err);
      console.error('Camera/Microphone error:', err);
    }
  }

  startVoiceLevelLoop() {
    const bar = document.getElementById('voice-bar');
    const label = document.getElementById('voice-level-label');
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const animate = () => {
      this.analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      this.voiceLevel = Math.min(1, rms * 3);
      
      bar.style.width = (this.voiceLevel * 100) + '%';
      label.textContent = `Voice Level: ${(this.voiceLevel * 100).toFixed(0)}`;
      
      this.voiceAnimationId = requestAnimationFrame(animate);
    };
    animate();
  }

  startHandLoop() {
    const gestureLabel = document.getElementById('gesture-label');
    const coordinatesDisplay = document.getElementById('coordinates-display');
    
    const animate = async () => {
      let hands = [];
      if (this.handDetector) {
        hands = await this.handDetector.detect(this.video);
      }
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      let gesture = '';
      let coordinates = '';
      let pinch = false;
      let pinchPosition = null;
      
      hands.forEach(hand => {
        if (hand.landmarks) {
          // Draw hand landmarks
          this.ctx.save();
          this.ctx.fillStyle = '#4ecdc4';
          this.ctx.strokeStyle = '#4ecdc4';
          this.ctx.lineWidth = 2;
          
          // Draw connections between landmarks
          const connections = [
            [0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]
          ];
          
          connections.forEach(connection => {
            this.ctx.beginPath();
            for (let i = 0; i < connection.length - 1; i++) {
              const pt1 = hand.landmarks[connection[i]];
              const pt2 = hand.landmarks[connection[i + 1]];
              this.ctx.moveTo(pt1.x, pt1.y);
              this.ctx.lineTo(pt2.x, pt2.y);
            }
            this.ctx.stroke();
          });
          
          // Draw landmarks
          hand.landmarks.forEach((pt, i) => {
            this.ctx.beginPath();
            this.ctx.arc(pt.x, pt.y, i === 0 ? 8 : 6, 0, 2 * Math.PI);
            this.ctx.fill();
          });
          
          this.ctx.restore();
          
          // Gesture recognition
          gesture = this.recognizeGesture(hand.landmarks);
          
          // Pinch detection
          const thumbTip = hand.landmarks[4];
          const indexTip = hand.landmarks[8];
          const pinchDistance = this.distance(thumbTip, indexTip);
          pinch = pinchDistance < 40;
          
          if (pinch) {
            pinchPosition = {
              x: (thumbTip.x + indexTip.x) / 2,
              y: (thumbTip.y + indexTip.y) / 2
            };
          }
          
          // Coordinates display (right side)
          const wrist = hand.landmarks[0];
          coordinates = `Hand: (${Math.round(wrist.x)}, ${Math.round(wrist.y)})`;
          if (pinch && pinchPosition) {
            coordinates += `\nPinch: (${Math.round(pinchPosition.x)}, ${Math.round(pinchPosition.y)})`;
          }
        }
      });
      
      // Handle pinch gestures on buttons
      this.handlePinchGesture(pinch, pinchPosition);
      
      // Update UI
      if (gesture) {
        gestureLabel.textContent = gesture;
        gestureLabel.style.display = 'block';
      } else {
        gestureLabel.style.display = 'none';
      }
      
      if (coordinates) {
        coordinatesDisplay.innerHTML = coordinates.replace('\n', '<br>');
        coordinatesDisplay.style.display = 'block';
      } else {
        coordinatesDisplay.style.display = 'none';
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    // Set canvas size to match video
    this.video.onloadedmetadata = () => {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
    };
    
    animate();
  }

  handlePinchGesture(pinch, pinchPosition) {
    if (pinch && pinchPosition && !this.pinchCooldown) {
      const startZone = document.getElementById('start-recording-zone');
      const stopZone = document.getElementById('stop-recording-zone');
      
      // Check if pinch is over start recording button
      if (this.isPointInButton(pinchPosition, startZone)) {
        this.activateButton(startZone, () => this.startRecording());
        this.pinchCooldown = true;
        setTimeout(() => this.pinchCooldown = false, 1000);
      }
      // Check if pinch is over stop recording button
      else if (this.isPointInButton(pinchPosition, stopZone)) {
        this.activateButton(stopZone, () => this.stopRecording());
        this.pinchCooldown = true;
        setTimeout(() => this.pinchCooldown = false, 1000);
      }
    }
  }

  isPointInButton(point, buttonElement) {
    if (!buttonElement || !point) return false;
    
    const rect = buttonElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    
    // Convert canvas coordinates to screen coordinates
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;
    
    // Mirror the X coordinate to match the flipped video
    const mirroredX = this.canvas.width - point.x;
    const screenX = canvasRect.left + (mirroredX * scaleX);
    const screenY = canvasRect.top + (point.y * scaleY);
    
    return screenX >= rect.left && 
           screenX <= rect.right && 
           screenY >= rect.top && 
           screenY <= rect.bottom;
  }

  updateButtonHoverStates(pinch, pinchPosition) {
    const startZone = document.getElementById('start-recording-zone');
    const stopZone = document.getElementById('stop-recording-zone');
    
    if (pinch && pinchPosition) {
      // Add hover effect if pinch is over button
      if (this.isPointInButton(pinchPosition, startZone)) {
        startZone.classList.add('pinch-hover');
      } else {
        startZone.classList.remove('pinch-hover');
      }
      
      if (this.isPointInButton(pinchPosition, stopZone)) {
        stopZone.classList.add('pinch-hover');
      } else {
        stopZone.classList.remove('pinch-hover');
      }
    } else {
      // Remove hover effects when not pinching
      startZone.classList.remove('pinch-hover');
      stopZone.classList.remove('pinch-hover');
    }
  }

  activateButton(buttonElement, callback) {
    const button = buttonElement.querySelector('button');
    if (button) {
      button.classList.add('button-active');
      setTimeout(() => button.classList.remove('button-active'), 200);
    }
    callback();
  }

  startRecording() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recordedChunks = [];
    
    const stream = this.video.srcObject;
    this.mediaRecorder = new MediaRecorder(stream, { 
      mimeType: 'video/webm;codecs=vp9,opus' 
    });
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordedChunks.push(e.data);
    };
    
    this.mediaRecorder.onstop = () => this.saveRecording();
    this.mediaRecorder.start();
    
    document.getElementById('recording-status').style.display = 'block';
    console.log('Recording started');
  }

  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    document.getElementById('recording-status').style.display = 'none';
    console.log('Recording stopped');
  }

  saveRecording() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `ar-recording-${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }

  recognizeGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return '';
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];
    
    // Pinch detection
    if (this.distance(thumbTip, indexTip) < 40) {
      return 'Pinch 👌';
    }
    
    // Open palm
    if ([indexTip, middleTip, ringTip, pinkyTip].every(tip => 
      this.distance(tip, wrist) > 120)) {
      return 'Open Palm ✋';
    }
    
    // Thumbs up
    if (thumbTip.y < wrist.y && 
        [indexTip, middleTip, ringTip, pinkyTip].every(tip => tip.y > wrist.y)) {
      return 'Thumbs Up 👍';
    }
    
    // Finger point
    if (this.distance(indexTip, wrist) > 120 &&
        [middleTip, ringTip, pinkyTip].every(tip => 
          this.distance(tip, wrist) < 110) &&
        indexTip.y < middleTip.y &&
        indexTip.y < ringTip.y &&
        indexTip.y < pinkyTip.y) {
      return 'Finger Point 👉';
    }
    // Finger point
    if (this.distance(middleTip, wrist) > 120 &&
        [middleTip, ringTip, pinkyTip].every(tip => 
          this.distance(tip, wrist) < 110) &&
        indexTip.y < middleTip.y &&
        indexTip.y < ringTip.y &&
        indexTip.y < pinkyTip.y) {
      return 'middle Finger Point 👉';
    }
    
    return '';
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // Cleanup method
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.voiceAnimationId) {
      cancelAnimationFrame(this.voiceAnimationId);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
  }
}