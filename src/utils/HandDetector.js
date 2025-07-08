export class HandDetector {
  constructor() {
    this.hands = null
    this.isInitialized = false
    this.lastDetection = null
    this.handRaisedCounter = 0
    this.detectionHistory = []
    this.isMediaPipeLoaded = false
  }

  async loadMediaPipe() {
    if (this.isMediaPipeLoaded) return true;

    try {
      // Load MediaPipe from CDN using dynamic import
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.js';
      document.head.appendChild(script);

      return new Promise((resolve) => {
        script.onload = () => {
          console.log('MediaPipe hands script loaded successfully');
          this.isMediaPipeLoaded = true;
          resolve(true);
        };
        
        script.onerror = (error) => {
          console.error('Failed to load MediaPipe hands script:', error);
          this.isMediaPipeLoaded = false;
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error loading MediaPipe:', error);
      return false;
    }
  }

  async initialize() {
    try {
      // First, try to load MediaPipe
      const mediapiperLoaded = await this.loadMediaPipe();
      
      if (mediapiperLoaded && window.Hands) {
        console.log('Initializing MediaPipe Hands...');
        
        // Initialize MediaPipe Hands
        this.hands = new window.Hands({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`
          }
        });

        this.hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5
        });

        this.hands.onResults((results) => {
          this.lastDetection = results;
        });

        console.log('MediaPipe Hand detector initialized successfully');
      } else {
        console.warn('MediaPipe not available, will use fallback detection');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize hand detection:', error);
      console.log('Falling back to mock detection');
      this.isInitialized = true;
      return true;
    }
  }

  async detect(video) {
    if (!this.isInitialized || !video) return [];

    try {
      // Try to use real MediaPipe detection
      if (this.hands && typeof this.hands.send === 'function') {
        await this.hands.send({ image: video });
        
        if (this.lastDetection && this.lastDetection.multiHandLandmarks && this.lastDetection.multiHandLandmarks.length > 0) {
          console.log('[HandDetector] MediaPipe detected hands:', this.lastDetection.multiHandLandmarks.length);
          const hands = this.convertMediaPipeToHand(this.lastDetection, video);
          this.detectionHistory.push(hands.length > 0);
          if (this.detectionHistory.length > 10) {
            this.detectionHistory.shift();
          }
          return hands;
        } else {
          console.log('[HandDetector] MediaPipe found no hands');
        }
      } else {
        console.log('[HandDetector] MediaPipe not available, using fallback');
      }
    } catch (error) {
      console.warn('MediaPipe hand detection failed, using fallback:', error);
    }

    // Fallback to mock detection with better logic
    return this.getMockHand(video);
  }

  convertMediaPipeToHand(results, video) {
    const hands = [];
    const width = video.videoWidth;
    const height = video.videoHeight;

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness && results.multiHandedness[i] ? 
                        results.multiHandedness[i].label : 'Unknown';
      
      console.log(`[HandDetector] Hand #${i} handedness:`, handedness, 'landmarks count:', landmarks.length);

      const convertedLandmarks = landmarks.map(landmark => ({
        x: landmark.x * width,
        y: landmark.y * height
      }));

      const isRaised = this.isHandRaised(convertedLandmarks, height);
      
      hands.push({
        handedness: handedness,
        landmarks: convertedLandmarks,
        isRaised: isRaised,
        confidence: this.calculateHandConfidence(convertedLandmarks)
      });
    }

    if (hands.length === 0) {
      console.log('[HandDetector] No hands converted from MediaPipe results');
    }
    return hands;
  }

  calculateHandConfidence(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0;
    
    // Calculate confidence based on hand pose consistency
    let confidence = 1.0;
    
    // Check if fingers are extended properly
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, index, middle, ring, pinky tips
    const fingerBases = [2, 5, 9, 13, 17]; // Corresponding finger bases
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const base = landmarks[fingerBases[i]];
      
      if (tip && base) {
        // Check if finger is extended (tip higher than base for most fingers)
        if (i === 0) { // Thumb
          if (tip.x < base.x) confidence *= 0.9;
        } else {
          if (tip.y > base.y) confidence *= 0.9;
        }
      }
    }
    
    return Math.max(0, confidence);
  }

  getMockHand(video) {
    // Simulate hand detection with more realistic behavior
    this.handRaisedCounter++;
    
    // Show hand every few frames to simulate detection
    if (this.handRaisedCounter % 3 !== 0) {
      return [];
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    const isRaised = (this.handRaisedCounter % 8) < 6; // Hand raised 75% of the time

    if (!isRaised) return [];

    // Create more realistic mock hand with slight variations
    const baseX = width * (0.2 + (Math.sin(this.handRaisedCounter * 0.1) * 0.1));
    const baseY = height * (0.4 + (Math.cos(this.handRaisedCounter * 0.08) * 0.1));

    const mockLeftHand = {
      handedness: 'Left',
      landmarks: [
        // Wrist (landmark 0)
        { x: baseX, y: baseY },
        // Thumb landmarks (1-4)
        { x: baseX - width * 0.05, y: baseY - height * 0.05 },
        { x: baseX - width * 0.08, y: baseY - height * 0.08 },
        { x: baseX - width * 0.1, y: baseY - height * 0.1 },
        { x: baseX - width * 0.12, y: baseY - height * 0.12 },
        // Index finger landmarks (5-8)
        { x: baseX - width * 0.02, y: baseY - height * 0.15 },
        { x: baseX - width * 0.03, y: baseY - height * 0.2 },
        { x: baseX - width * 0.04, y: baseY - height * 0.25 },
        { x: baseX - width * 0.05, y: baseY - height * 0.3 },
        // Middle finger landmarks (9-12)
        { x: baseX + width * 0.02, y: baseY - height * 0.18 },
        { x: baseX + width * 0.01, y: baseY - height * 0.23 },
        { x: baseX, y: baseY - height * 0.28 },
        { x: baseX - width * 0.01, y: baseY - height * 0.33 },
        // Ring finger landmarks (13-16)
        { x: baseX + width * 0.06, y: baseY - height * 0.15 },
        { x: baseX + width * 0.05, y: baseY - height * 0.2 },
        { x: baseX + width * 0.04, y: baseY - height * 0.25 },
        { x: baseX + width * 0.03, y: baseY - height * 0.3 },
        // Pinky landmarks (17-20)
        { x: baseX + width * 0.1, y: baseY - height * 0.12 },
        { x: baseX + width * 0.09, y: baseY - height * 0.17 },
        { x: baseX + width * 0.08, y: baseY - height * 0.22 },
        { x: baseX + width * 0.07, y: baseY - height * 0.27 }
      ],
      isRaised: true,
      confidence: 0.8
    };

    return [mockLeftHand];
  }

  isHandRaised(landmarks, videoHeight) {
    if (!landmarks || landmarks.length < 21) return false;
    
    // Check multiple criteria for hand raising
    const wrist = landmarks[0];
    const middleFingerTip = landmarks[12];
    const indexFingerTip = landmarks[8];
    const ringFingerTip = landmarks[16];
    
    // Criteria 1: Wrist should be in upper half of screen
    const wristInUpperHalf = wrist.y < videoHeight * 0.6;
    
    // Criteria 2: At least one finger tip should be above wrist
    const fingerAboveWrist = middleFingerTip.y < wrist.y || 
                           indexFingerTip.y < wrist.y || 
                           ringFingerTip.y < wrist.y;
    
    // Criteria 3: Hand should be relatively open (fingers extended)
    const fingersExtended = this.areFingersExtended(landmarks);
    
    return wristInUpperHalf && fingerAboveWrist && fingersExtended;
  }

  areFingersExtended(landmarks) {
    if (!landmarks || landmarks.length < 21) return false;
    
    // Check if fingers are extended (simplified check)
    const fingerTips = [8, 12, 16, 20]; // Index, middle, ring, pinky tips
    const fingerBases = [5, 9, 13, 17]; // Corresponding bases
    
    let extendedCount = 0;
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]];
      const base = landmarks[fingerBases[i]];
      
      if (tip && base && tip.y < base.y) {
        extendedCount++;
      }
    }
    
    // At least 2 fingers should be extended
    return extendedCount >= 2;
  }
}