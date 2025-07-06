import { FaceMesh } from '@mediapipe/face_mesh'

export class FaceMeshDetector {
  constructor() {
    this.faceMesh = null
    this.isInitialized = false
    this.lastDetection = null
  }

  async initialize() {
    this.faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    })
    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    this.faceMesh.onResults((results) => {
      this.lastDetection = results
    })
    this.isInitialized = true
  }

  async detect(video) {
    if (!this.isInitialized || !video) return null
    await this.faceMesh.send({ image: video })
    if (this.lastDetection && this.lastDetection.multiFaceLandmarks && this.lastDetection.multiFaceLandmarks.length > 0) {
      return this.lastDetection.multiFaceLandmarks[0]
    }
    return null
  }

  // Utility to get iris and eye corners
  static getGazeFromLandmarks(landmarks, canvasWidth, canvasHeight) {
    if (!landmarks || landmarks.length < 478) return null
    // Right eye: 33 (left corner), 133 (right corner), iris: 468-473
    // Left eye: 362 (left corner), 263 (right corner), iris: 473-478
    // We'll use right eye for gaze
    const leftCorner = landmarks[33]
    const rightCorner = landmarks[133]
    // Iris center: average of 468-473
    let irisX = 0, irisY = 0
    for (let i = 468; i <= 473; i++) {
      irisX += landmarks[i].x
      irisY += landmarks[i].y
    }
    irisX /= 6
    irisY /= 6
    // Gaze ratio (0 = left, 1 = right)
    const gazeX = (irisX - leftCorner.x) / (rightCorner.x - leftCorner.x)
    // Clamp
    const gazeXClamped = Math.max(0, Math.min(1, gazeX))
    // Map to canvas
    const canvasX = gazeXClamped * canvasWidth
    // For Y, use vertical position of iris in eye region (between top 159 and bottom 145)
    const top = landmarks[159]
    const bottom = landmarks[145]
    const gazeY = (irisY - top.y) / (bottom.y - top.y)
    const gazeYClamped = Math.max(0, Math.min(1, gazeY))
    const canvasY = gazeYClamped * canvasHeight
    return { x: canvasX, y: canvasY }
  }
} 