import { HandDetector } from '../utils/HandDetector.js';

export class FaceFilterApp {
  constructor() {
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.handDetector = null;
    this.animationId = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.pinchCooldown = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  init() {
    this.createUI();
    this.setupEventListeners();
    this.startCameraAndMic();
  }

  createUI() {
    const container = document.getElementById('face-filter-app');
    container.innerHTML = `
      <div id="app-container" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        overflow: hidden;
        z-index: 1000;
      ">
        <!-- Loading Screen -->
        <div id="loading-screen" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #4ecdc4;
          font-size: 1.5rem;
          text-align: center;
          z-index: 10;
        ">
          <div style="margin-bottom: 20px;">🎥 Starting Camera...</div>
          <div style="width: 40px; height: 40px; border: 3px solid #4ecdc4; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
        </div>

        <!-- Video Container -->
        <div id="video-container" style="
          position: relative;
          width: 100%;
          height: 100%;
          display: none;
        ">
          <video id="video" autoplay muted playsinline style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            transform: scaleX(-1);
          "></video>
          
          <canvas id="canvas" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            transform: scaleX(-1);
          "></canvas>
          
          <!-- Mobile UI Overlay -->
          <div id="mobile-ui" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 5;
          ">
            <!-- Top Bar -->
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 80px;
              background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
              display: flex;
              align-items: center;
              padding: 0 20px;
              gap: 15px;
            ">
              <div id="gesture-label" style="
                color: #4ecdc4;
                font-size: 1.2rem;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0,0,0,0.8);
              "></div>
              
              <div id="recording-status" style="
                color: #ff5252;
                font-size: 1.1rem;
                font-weight: bold;
                display: none;
                animation: pulse 2s infinite;
              ">● REC</div>
            </div>
            
            <!-- Bottom Controls -->
            <div style="
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 120px;
              background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
              display: flex;
              align-items: center;
              justify-content: space-around;
              padding: 0 40px;
            ">
              <!-- Record Button -->
              <div id="record-button" style="
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: #ff5252;
                border: 4px solid #fff;
                box-shadow: 0 4px 15px rgba(255,82,82,0.4);
                pointer-events: auto;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
              ">●</div>
              
              <!-- Voice Level -->
              <div style="
                flex: 1;
                max-width: 200px;
                margin: 0 20px;
                height: 6px;
                background: rgba(255,255,255,0.2);
                border-radius: 3px;
                overflow: hidden;
              ">
                <div id="voice-bar" style="
                  height: 100%;
                  width: 0%;
                  background: linear-gradient(90deg, #4ecdc4, #44a08d);
                  border-radius: 3px;
                  transition: width 0.1s ease;
                "></div>
              </div>
            </div>
            
            <!-- Pinch Instruction -->
            <div id="pinch-instruction" style="
              position: absolute;
              bottom: 140px;
              left: 50%;
              transform: translateX(-50%);
              color: #4ecdc4;
              font-size: 0.9rem;
              text-align: center;
              background: rgba(0,0,0,0.6);
              padding: 8px 16px;
              border-radius: 20px;
              opacity: 0;
              transition: opacity 0.3s ease;
            ">👌 Pinch to record</div>
          </div>
        </div>
        
        <!-- Error Display -->
        <div id="camera-error" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #ff5252;
          text-align: center;
          font-size: 1.1rem;
          background: rgba(0,0,0,0.8);
          padding: 20px;
          border-radius: 10px;
          display: none;
        "></div>
      </div>
      
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        
        #record-button:hover,
        #record-button.pinch-hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(255,82,82,0.6);
        }
        
        #record-button.recording {
          background: #4ecdc4 !important;
          animation: pulse 2s infinite;
        }
        
        #record-button.button-active {
          transform: scale(0.9);
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          #mobile-ui {
            font-size: 0.9rem;
          }
          
          #record-button {
            width: 60px;
            height: 60px;
          }
        }
      </style>
    `;
  }

  setupEventListeners() {
    // Record button
    const recordButton = document.getElementById('record-button');
    recordButton.addEventListener('click', () => this.toggleRecording());
    
    // Touch events for mobile
    recordButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.toggleRecording();
    });
    
    // Prevent zoom on double tap
    document.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  async startCameraAndMic() {
    const errorDiv = document.getElementById('camera-error');
    const loadingScreen = document.getElementById('loading-screen');
    const videoContainer = document.getElementById('video-container');
    
    try {
      // Request permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }, 
        audio: true 
      });
      
      this.video = document.getElementById('video');
      this.canvas = document.getElementById('canvas');
      this.ctx = this.canvas.getContext('2d');
      
      this.video.srcObject = stream;
      
      // Wait for video to load
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.canvas.width = this.video.videoWidth;
          this.canvas.height = this.video.videoHeight;
          resolve();
        };
      });
      
      // Hide loading, show video
      loadingScreen.style.display = 'none';
      videoContainer.style.display = 'block';
      
      // Setup audio analysis
      this.setupAudioAnalysis(stream);
      
      // Initialize hand detection
      if (typeof HandDetector !== 'undefined') {
        this.handDetector = new HandDetector();
        await this.handDetector.initialize();
        this.startHandLoop();
      } else {
        console.warn('HandDetector not available');
      }
      
      // Show instruction after 2 seconds
      setTimeout(() => {
        document.getElementById('pinch-instruction').style.opacity = '1';
        setTimeout(() => {
          document.getElementById('pinch-instruction').style.opacity = '0';
        }, 3000);
      }, 2000);
      
    } catch (err) {
      loadingScreen.style.display = 'none';
      errorDiv.style.display = 'block';
      errorDiv.textContent = 'Camera access denied or unavailable: ' + err.message;
      console.error('Camera error:', err);
    }
  }

  setupAudioAnalysis(stream) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);
      
      this.startVoiceLoop();
    } catch (err) {
      console.error('Audio setup error:', err);
    }
  }

  startVoiceLoop() {
    const voiceBar = document.getElementById('voice-bar');
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    
    const animate = () => {
      this.analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const voiceLevel = Math.min(1, rms * 3);
      
      voiceBar.style.width = (voiceLevel * 100) + '%';
      
      requestAnimationFrame(animate);
    };
    animate();
  }

  startHandLoop() {
    const gestureLabel = document.getElementById('gesture-label');
    const recordButton = document.getElementById('record-button');
    
    const animate = async () => {
      let hands = [];
      if (this.handDetector) {
        hands = await this.handDetector.detect(this.video);
      }
      
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      let gesture = '';
      let pinch = false;
      let pinchPosition = null;
      
      if (hands.length > 0) {
        const hand = hands[0];
        
        // Draw hand landmarks
        this.drawHandLandmarks(hand.landmarks);
        
        // Recognize gesture
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
      }
      
      // Update gesture display
      gestureLabel.textContent = gesture;
      
      // Handle pinch over record button
      if (pinch && pinchPosition && !this.pinchCooldown) {
        if (this.isPointInButton(pinchPosition, recordButton)) {
          this.activateButton(recordButton);
          this.toggleRecording();
          this.pinchCooldown = true;
          setTimeout(() => this.pinchCooldown = false, 1000);
        }
      }
      
      // Update button hover state
      if (pinch && pinchPosition && this.isPointInButton(pinchPosition, recordButton)) {
        recordButton.classList.add('pinch-hover');
      } else {
        recordButton.classList.remove('pinch-hover');
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  drawHandLandmarks(landmarks) {
    if (!landmarks) return;
    
    this.ctx.save();
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.strokeStyle = '#4ecdc4';
    this.ctx.lineWidth = 2;
    
    // Draw connections
    const connections = [
      [0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]
    ];
    
    connections.forEach(connection => {
      this.ctx.beginPath();
      for (let i = 0; i < connection.length - 1; i++) {
        const pt1 = landmarks[connection[i]];
        const pt2 = landmarks[connection[i + 1]];
        this.ctx.moveTo(pt1.x, pt1.y);
        this.ctx.lineTo(pt2.x, pt2.y);
      }
      this.ctx.stroke();
    });
    
    // Draw landmarks
    landmarks.forEach((pt, i) => {
      this.ctx.beginPath();
      this.ctx.arc(pt.x, pt.y, i === 0 ? 8 : 4, 0, 2 * Math.PI);
      this.ctx.fill();
    });
    
    this.ctx.restore();
  }

  recognizeGesture(landmarks) {
    if (!landmarks || landmarks.length < 21) return '';
    
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const wrist = landmarks[0];
    
    // Pinch
    if (this.distance(thumbTip, indexTip) < 40) {
      return 'Pinch 👌';
    }
    
    // Open palm
    if ([indexTip, middleTip, ringTip, pinkyTip].every(tip => 
      this.distance(tip, wrist) > 100)) {
      return 'Open Hand ✋';
    }
    
    // Thumbs up
    if (thumbTip.y < wrist.y && 
        [indexTip, middleTip, ringTip, pinkyTip].every(tip => tip.y > wrist.y)) {
      return 'Thumbs Up 👍';
    }
    
    // Point
    if (this.distance(indexTip, wrist) > 100 &&
        indexTip.y < wrist.y - 50) {
      return 'Point 👉';
    }
    
    return '';
  }

  isPointInButton(point, buttonElement) {
    if (!buttonElement || !point) return false;
    
    const rect = buttonElement.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    
    // Convert canvas coordinates to screen coordinates
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;
    
    const mirroredX = this.canvas.width - point.x;
    const screenX = canvasRect.left + (mirroredX * scaleX);
    const screenY = canvasRect.top + (point.y * scaleY);
    
    return screenX >= rect.left && screenX <= rect.right && 
           screenY >= rect.top && screenY <= rect.bottom;
  }

  activateButton(button) {
    button.classList.add('button-active');
    setTimeout(() => button.classList.remove('button-active'), 200);
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    if (this.isRecording) return;
    
    this.isRecording = true;
    this.recordedChunks = [];
    
    try {
      const stream = this.video.srcObject;
      this.mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'video/webm;codecs=vp9,opus' 
      });
      
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      
      this.mediaRecorder.onstop = () => this.saveRecording();
      this.mediaRecorder.start();
      
      // Update UI
      document.getElementById('record-button').classList.add('recording');
      document.getElementById('recording-status').style.display = 'block';
      
      console.log('Recording started');
    } catch (err) {
      console.error('Recording error:', err);
      this.isRecording = false;
    }
  }

  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    // Update UI
    document.getElementById('record-button').classList.remove('recording');
    document.getElementById('recording-status').style.display = 'none';
    
    console.log('Recording stopped');
  }

  saveRecording() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.video && this.video.srcObject) {
      this.video.srcObject.getTracks().forEach(track => track.stop());
    }
  }
}