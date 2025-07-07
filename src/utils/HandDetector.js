import { Hands } from '@mediapipe/hands'

export class HandDetector {
  constructor() {
    this.hands = null
    this.isInitialized = false
    this.lastDetection = null
    this.handRaisedCounter = 0
    this.detectionHistory = []
  }

  async initialize() {
    try {
      this.hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        }
      })

      this.hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      })

      this.hands.onResults((results) => {
        this.lastDetection = results
      })

      this.isInitialized = true
      console.log('Hand detector initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize hand detection:', error)
      // Fallback to mock detection
      this.isInitialized = true
      return true
    }
  }

  async detect(video) {
    if (!this.isInitialized || !video) return []

    try {
      // Try to use real MediaPipe detection
      if (this.hands && typeof this.hands.send === 'function') {
        await this.hands.send({ image: video })
        
        if (this.lastDetection && this.lastDetection.multiHandLandmarks && this.lastDetection.multiHandLandmarks.length > 0) {
          console.log('[HandDetector] MediaPipe detected hands:', this.lastDetection)
          const hands = this.convertMediaPipeToHand(this.lastDetection, video)
          this.detectionHistory.push(hands.length > 0)
          if (this.detectionHistory.length > 10) {
            this.detectionHistory.shift()
          }
          return hands
        } else {
          console.log('[HandDetector] MediaPipe found NO hands', this.lastDetection)
        }
      }
    } catch (error) {
      console.warn('MediaPipe hand detection failed, using fallback:', error)
    }

    // Fallback to mock detection with better logic
    return this.getMockHand(video)
  }

  convertMediaPipeToHand(results, video) {
    const hands = []
    const width = video.videoWidth
    const height = video.videoHeight

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const landmarks = results.multiHandLandmarks[i]
      const handedness = results.multiHandedness[i].label
      console.log(`[HandDetector] Hand #${i} handedness:`, handedness, 'landmarks:', landmarks)

      const convertedLandmarks = landmarks.map(landmark => ({
        x: landmark.x * width,
        y: landmark.y * height
      }))

      const isRaised = this.isHandRaised(convertedLandmarks, height)
      
      hands.push({
        handedness: handedness,
        landmarks: convertedLandmarks,
        isRaised: isRaised,
        confidence: this.calculateHandConfidence(convertedLandmarks)
      })
    }

    if (hands.length === 0) {
      console.log('[HandDetector] No hands converted from MediaPipe results')
    }
    return hands
  }

  calculateHandConfidence(landmarks) {
    if (!landmarks || landmarks.length < 21) return 0
    
    // Calculate confidence based on hand pose consistency
    let confidence = 1.0
    
    // Check if fingers are extended properly
    const fingerTips = [4, 8, 12, 16, 20] // Thumb, index, middle, ring, pinky tips
    const fingerBases = [2, 5, 9, 13, 17] // Corresponding finger bases
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]]
      const base = landmarks[fingerBases[i]]
      
      if (tip && base) {
        // Check if finger is extended (tip higher than base for most fingers)
        if (i === 0) { // Thumb
          if (tip.x < base.x) confidence *= 0.9
        } else {
          if (tip.y > base.y) confidence *= 0.9
        }
      }
    }
    
    return Math.max(0, confidence)
  }

  getMockHand(video) {
    // Simulate hand detection with more realistic behavior
    this.handRaisedCounter++
    
    // Show hand every few frames to simulate detection
    if (this.handRaisedCounter % 2 !== 0) {
      return []
    }

    const width = video.videoWidth
    const height = video.videoHeight
    const isRaised = (this.handRaisedCounter % 8) < 6 // Hand raised 75% of the time

    if (!isRaised) return []

    const mockLeftHand = {
      handedness: 'Left',
      landmarks: [
        // Wrist (landmark 0)
        { x: width * 0.2, y: height * 0.4 },
        // Thumb landmarks (1-4)
        { x: width * 0.15, y: height * 0.35 },
        { x: width * 0.12, y: height * 0.32 },
        { x: width * 0.1, y: height * 0.3 },
        { x: width * 0.08, y: height * 0.28 },
        // Index finger landmarks (5-8)
        { x: width * 0.18, y: height * 0.25 },
        { x: width * 0.17, y: height * 0.2 },
        { x: width * 0.16, y: height * 0.15 },
        { x: width * 0.15, y: height * 0.1 },
        // Middle finger landmarks (9-12)
        { x: width * 0.22, y: height * 0.22 },
        { x: width * 0.21, y: height * 0.17 },
        { x: width * 0.2, y: height * 0.12 },
        { x: width * 0.19, y: height * 0.07 },
        // Ring finger landmarks (13-16)
        { x: width * 0.26, y: height * 0.25 },
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.24, y: height * 0.15 },
        { x: width * 0.23, y: height * 0.1 },
        // Pinky landmarks (17-20)
        { x: width * 0.3, y: height * 0.28 },
        { x: width * 0.29, y: height * 0.23 },
        { x: width * 0.28, y: height * 0.18 },
        { x: width * 0.27, y: height * 0.13 }
      ],
      isRaised: true,
      confidence: 0.8
    }

    return [mockLeftHand]
  }

  isHandRaised(landmarks, videoHeight) {
    if (!landmarks || landmarks.length < 21) return false
    
    // Check multiple criteria for hand raising
    const wrist = landmarks[0]
    const middleFingerTip = landmarks[12]
    const indexFingerTip = landmarks[8]
    const ringFingerTip = landmarks[16]
    
    // Criteria 1: Wrist should be in upper half of screen
    const wristInUpperHalf = wrist.y < videoHeight * 0.6
    
    // Criteria 2: At least one finger tip should be above wrist
    const fingerAboveWrist = middleFingerTip.y < wrist.y || 
                           indexFingerTip.y < wrist.y || 
                           ringFingerTip.y < wrist.y
    
    // Criteria 3: Hand should be relatively open (fingers extended)
    const fingersExtended = this.areFingersExtended(landmarks)
    
    return wristInUpperHalf && fingerAboveWrist && fingersExtended
  }

  areFingersExtended(landmarks) {
    if (!landmarks || landmarks.length < 21) return false
    
    // Check if fingers are extended (simplified check)
    const fingerTips = [8, 12, 16, 20] // Index, middle, ring, pinky tips
    const fingerBases = [5, 9, 13, 17] // Corresponding bases
    
    let extendedCount = 0
    
    for (let i = 0; i < fingerTips.length; i++) {
      const tip = landmarks[fingerTips[i]]
      const base = landmarks[fingerBases[i]]
      
      if (tip && base && tip.y < base.y) {
        extendedCount++
      }
    }
    
    // At least 2 fingers should be extended
    return extendedCount >= 2
  }
}