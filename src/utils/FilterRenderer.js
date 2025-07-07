export class FilterRenderer {
  constructor(ctx) {
    this.ctx = ctx
    this.filters = new Map()
    this.animationFrame = 0
    this.debugMode = false // Disable debug by default
    this.loadFilters()
  }

  loadFilters() {
    // Face filters with improved rendering
    this.filters.set('dog', {
      type: 'face',
      ears: { color: '#8B4513', innerColor: '#DEB887' },
      nose: { color: '#000', highlight: '#666' },
      tongue: { color: '#FF69B4', outline: '#FF1493' }
    })

    this.filters.set('cat', {
      type: 'face',
      ears: { color: '#FFA500', shape: 'triangle' },
      whiskers: { color: '#000', length: 40 },
      nose: { color: '#FFB6C1', shape: 'triangle' }
    })

    this.filters.set('bunny', {
      type: 'face',
      ears: { color: '#FFF', outline: '#FFB6C1', shape: 'oval' },
      nose: { color: '#FFB6C1', shape: 'oval' },
      teeth: { color: '#FFF', outline: '#000' }
    })

    this.filters.set('glasses', {
      type: 'face',
      lenses: { color: 'rgba(0, 0, 0, 0.3)', outline: '#000' },
      frame: { color: '#000', width: 4 }
    })

    // Hand gesture tools
    this.filters.set('hammer', {
      type: 'hand',
      tool: '🔨',
      scale: 2.0,
      offset: { x: 0, y: -50 }
    })

    this.filters.set('sword', {
      type: 'hand',
      tool: '⚔️',
      scale: 2.5,
      offset: { x: 0, y: -60 }
    })

    this.filters.set('wand', {
      type: 'hand',
      tool: '🪄',
      scale: 2.0,
      offset: { x: 0, y: -50 },
      sparkles: true
    })
  }

  renderFilter(filterType, face, canvasWidth, canvasHeight) {
    if (filterType === 'none' || !this.filters.has(filterType)) return

    const filter = this.filters.get(filterType)
    const { boundingBox, landmarks } = face

    this.ctx.save()
    this.animationFrame++

    try {
      switch (filterType) {
        case 'dog':
          this.renderDogFilter(landmarks, boundingBox)
          break
        case 'cat':
          this.renderCatFilter(landmarks, boundingBox)
          break
        case 'bunny':
          this.renderBunnyFilter(landmarks, boundingBox)
          break
        case 'glasses':
          this.renderGlassesFilter(landmarks, boundingBox)
          break
      }
    } catch (error) {
      console.error('Error rendering face filter:', error)
    }

    this.ctx.restore()
  }

  renderHandFilter(filterType, hand, canvasWidth, canvasHeight) {
    if (!hand || !hand.isRaised) return

    // For debugging: log the coordinates
    const indexTip = hand.landmarks[8]
    const wrist = hand.landmarks[0]
    console.log('[FilterRenderer] renderHandFilter called:', {
      filterType,
      wrist,
      indexTip,
      canvasWidth,
      canvasHeight
    })

    this.ctx.save()
    try {
      // Draw a large red circle at the index finger tip
      this.ctx.beginPath()
      this.ctx.arc(indexTip.x, indexTip.y, 40, 0, 2 * Math.PI)
      this.ctx.fillStyle = 'red'
      this.ctx.globalAlpha = 0.7
      this.ctx.fill()
      this.ctx.globalAlpha = 1.0
      // Optionally, draw a star emoji for extra visibility
      this.ctx.font = '60px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillStyle = 'yellow'
      this.ctx.fillText('⭐', indexTip.x, indexTip.y)
    } catch (error) {
      console.error('Error rendering hand filter:', error)
    }
    this.ctx.restore()
  }

  renderHandConnection(wrist, toolX, toolY) {
    // Draw a subtle line connecting hand to tool
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.beginPath()
    this.ctx.moveTo(wrist.x, wrist.y)
    this.ctx.lineTo(toolX, toolY)
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  renderHandDebug(hand) {
    if (!hand || !hand.landmarks) return
    
    // Render hand landmarks for debugging with better visibility
    console.log('[FilterRenderer] Rendering debug for hand:', hand.handedness, 'landmarks:', hand.landmarks.length)
    
    // Draw larger, more visible red dots for all landmarks
    this.ctx.fillStyle = 'red'
    this.ctx.strokeStyle = 'white'
    this.ctx.lineWidth = 2
    
    hand.landmarks.forEach((landmark, index) => {
      // Draw larger red circle
      this.ctx.beginPath()
      this.ctx.arc(landmark.x, landmark.y, 6, 0, 2 * Math.PI)
      this.ctx.fill()
      this.ctx.stroke()
      
      // Add landmark number for key points
      if (index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20) {
        this.ctx.fillStyle = 'white'
        this.ctx.font = '12px Arial'
        this.ctx.textAlign = 'center'
        this.ctx.fillText(index.toString(), landmark.x, landmark.y - 10)
        this.ctx.fillStyle = 'red'
      }
    })
    
    // Highlight wrist (landmark 0) with yellow circle
    if (hand.landmarks[0]) {
      this.ctx.strokeStyle = 'yellow'
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.arc(hand.landmarks[0].x, hand.landmarks[0].y, 12, 0, 2 * Math.PI)
      this.ctx.stroke()
      
      // Add "WRIST" label
      this.ctx.fillStyle = 'yellow'
      this.ctx.font = '14px Arial'
      this.ctx.fillText('WRIST', hand.landmarks[0].x, hand.landmarks[0].y - 20)
    }
    
    // Highlight index finger tip (landmark 8) with green circle
    if (hand.landmarks[8]) {
      this.ctx.strokeStyle = 'lime'
      this.ctx.lineWidth = 3
      this.ctx.beginPath()
      this.ctx.arc(hand.landmarks[8].x, hand.landmarks[8].y, 12, 0, 2 * Math.PI)
      this.ctx.stroke()
      
      // Add "INDEX" label
      this.ctx.fillStyle = 'lime'
      this.ctx.font = '14px Arial'
      this.ctx.fillText('INDEX', hand.landmarks[8].x, hand.landmarks[8].y - 20)
    }
    
    // Draw hand outline connecting key points
    this.ctx.strokeStyle = 'cyan'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    
    // Connect wrist to finger tips
    const keyPoints = [0, 4, 8, 12, 16, 20] // Wrist, thumb tip, index tip, middle tip, ring tip, pinky tip
    keyPoints.forEach((pointIndex, i) => {
      if (hand.landmarks[pointIndex]) {
        if (i === 0) {
          this.ctx.moveTo(hand.landmarks[pointIndex].x, hand.landmarks[pointIndex].y)
        } else {
          this.ctx.lineTo(hand.landmarks[pointIndex].x, hand.landmarks[pointIndex].y)
        }
      }
    })
    this.ctx.stroke()
    
    // Add hand info text
    this.ctx.fillStyle = 'white'
    this.ctx.font = '16px Arial'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`${hand.handedness} Hand - Raised: ${hand.isRaised}`, 10, 30)
  }

  renderSparkles(x, y) {
    const sparkles = ['✨', '⭐', '💫', '🌟']
    this.ctx.font = '20px Arial'
    this.ctx.shadowBlur = 5
    
    for (let i = 0; i < 4; i++) {
      const angle = (this.animationFrame * 0.1 + i * Math.PI / 2) % (2 * Math.PI)
      const radius = 60 + Math.sin(this.animationFrame * 0.05) * 20
      const sparkleX = x + Math.cos(angle) * radius
      const sparkleY = y + Math.sin(angle) * radius
      const sparkle = sparkles[i % sparkles.length]
      
      this.ctx.fillText(sparkle, sparkleX, sparkleY)
    }
  }

  renderDogFilter(landmarks, boundingBox) {
    const earSize = boundingBox.width * 0.25
    
    // Dog ears with improved positioning
    this.ctx.fillStyle = '#8B4513'
    
    // Left ear
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.leftEye.x - earSize * 0.6, 
      landmarks.leftEye.y - earSize * 0.8, 
      earSize * 0.4, 
      earSize * 0.8, 
      -Math.PI / 4, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()
    
    // Right ear
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.rightEye.x + earSize * 0.6, 
      landmarks.rightEye.y - earSize * 0.8, 
      earSize * 0.4, 
      earSize * 0.8, 
      Math.PI / 4, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()

    // Inner ears
    this.ctx.fillStyle = '#DEB887'
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.leftEye.x - earSize * 0.6, 
      landmarks.leftEye.y - earSize * 0.8, 
      earSize * 0.2, 
      earSize * 0.5, 
      -Math.PI / 4, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()
    
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.rightEye.x + earSize * 0.6, 
      landmarks.rightEye.y - earSize * 0.8, 
      earSize * 0.2, 
      earSize * 0.5, 
      Math.PI / 4, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()

    // Dog nose
    this.ctx.fillStyle = '#000'
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.nose.x, landmarks.nose.y, 18, 12, 0, 0, 2 * Math.PI)
    this.ctx.fill()

    // Nose highlight
    this.ctx.fillStyle = '#666'
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.nose.x - 5, landmarks.nose.y - 3, 4, 3, 0, 0, 2 * Math.PI)
    this.ctx.fill()

    // Animated tongue
    const tongueOffset = Math.sin(this.animationFrame * 0.1) * 5
    this.ctx.fillStyle = '#FF69B4'
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.mouth.x, landmarks.mouth.y + 25 + tongueOffset, 25, 35, 0, 0, 2 * Math.PI)
    this.ctx.fill()

    // Tongue detail
    this.ctx.strokeStyle = '#FF1493'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.mouth.x, landmarks.mouth.y + 10)
    this.ctx.lineTo(landmarks.mouth.x, landmarks.mouth.y + 50 + tongueOffset)
    this.ctx.stroke()
  }

  renderCatFilter(landmarks, boundingBox) {
    const earSize = boundingBox.width * 0.2
    
    // Cat ears
    this.ctx.fillStyle = '#FFA500'
    
    // Left ear
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.leftEye.x - earSize, landmarks.leftEye.y - earSize)
    this.ctx.lineTo(landmarks.leftEye.x - earSize/3, landmarks.leftEye.y - earSize/3)
    this.ctx.lineTo(landmarks.leftEye.x + earSize/3, landmarks.leftEye.y - earSize)
    this.ctx.closePath()
    this.ctx.fill()
    
    // Right ear
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.rightEye.x - earSize/3, landmarks.rightEye.y - earSize)
    this.ctx.lineTo(landmarks.rightEye.x + earSize/3, landmarks.rightEye.y - earSize/3)
    this.ctx.lineTo(landmarks.rightEye.x + earSize, landmarks.rightEye.y - earSize)
    this.ctx.closePath()
    this.ctx.fill()

    // Animated whiskers
    const whiskerOffset = Math.sin(this.animationFrame * 0.05) * 2
    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 3
    
    this.ctx.beginPath()
    // Left whiskers
    this.ctx.moveTo(landmarks.nose.x - 40, landmarks.nose.y - 10 + whiskerOffset)
    this.ctx.lineTo(landmarks.nose.x - 80, landmarks.nose.y - 15 + whiskerOffset)
    this.ctx.moveTo(landmarks.nose.x - 40, landmarks.nose.y)
    this.ctx.lineTo(landmarks.nose.x - 80, landmarks.nose.y)
    this.ctx.moveTo(landmarks.nose.x - 40, landmarks.nose.y + 10 - whiskerOffset)
    this.ctx.lineTo(landmarks.nose.x - 80, landmarks.nose.y + 15 - whiskerOffset)
    
    // Right whiskers
    this.ctx.moveTo(landmarks.nose.x + 40, landmarks.nose.y - 10 + whiskerOffset)
    this.ctx.lineTo(landmarks.nose.x + 80, landmarks.nose.y - 15 + whiskerOffset)
    this.ctx.moveTo(landmarks.nose.x + 40, landmarks.nose.y)
    this.ctx.lineTo(landmarks.nose.x + 80, landmarks.nose.y)
    this.ctx.moveTo(landmarks.nose.x + 40, landmarks.nose.y + 10 - whiskerOffset)
    this.ctx.lineTo(landmarks.nose.x + 80, landmarks.nose.y + 15 - whiskerOffset)
    this.ctx.stroke()

    // Cat nose
    this.ctx.fillStyle = '#FFB6C1'
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.nose.x, landmarks.nose.y - 8)
    this.ctx.lineTo(landmarks.nose.x - 8, landmarks.nose.y + 5)
    this.ctx.lineTo(landmarks.nose.x + 8, landmarks.nose.y + 5)
    this.ctx.closePath()
    this.ctx.fill()
  }

  renderBunnyFilter(landmarks, boundingBox) {
    const earSize = boundingBox.width * 0.15
    
    // Animated bunny ears
    const earBounce = Math.sin(this.animationFrame * 0.1) * 5
    
    this.ctx.fillStyle = '#FFF'
    this.ctx.strokeStyle = '#FFB6C1'
    this.ctx.lineWidth = 3
    
    // Left ear
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.leftEye.x - earSize/2, 
      landmarks.leftEye.y - earSize*2 + earBounce, 
      earSize/3, 
      earSize*1.5, 
      -Math.PI/6, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()
    this.ctx.stroke()
    
    // Right ear
    this.ctx.beginPath()
    this.ctx.ellipse(
      landmarks.rightEye.x + earSize/2, 
      landmarks.rightEye.y - earSize*2 + earBounce, 
      earSize/3, 
      earSize*1.5, 
      Math.PI/6, 
      0, 
      2 * Math.PI
    )
    this.ctx.fill()
    this.ctx.stroke()

    // Bunny nose
    this.ctx.fillStyle = '#FFB6C1'
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.nose.x, landmarks.nose.y, 8, 6, 0, 0, 2 * Math.PI)
    this.ctx.fill()

    // Bunny teeth
    this.ctx.fillStyle = '#FFF'
    this.ctx.fillRect(landmarks.mouth.x - 8, landmarks.mouth.y + 5, 6, 15)
    this.ctx.fillRect(landmarks.mouth.x + 2, landmarks.mouth.y + 5, 6, 15)
    
    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(landmarks.mouth.x - 8, landmarks.mouth.y + 5, 6, 15)
    this.ctx.strokeRect(landmarks.mouth.x + 2, landmarks.mouth.y + 5, 6, 15)
  }

  renderGlassesFilter(landmarks, boundingBox) {
    const glassWidth = boundingBox.width * 0.15
    const glassHeight = glassWidth * 0.8
    
    this.ctx.strokeStyle = '#000'
    this.ctx.lineWidth = 4
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    
    // Left lens
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.leftEye.x, landmarks.leftEye.y, glassWidth, glassHeight, 0, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()
    
    // Right lens
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.rightEye.x, landmarks.rightEye.y, glassWidth, glassHeight, 0, 0, 2 * Math.PI)
    this.ctx.fill()
    this.ctx.stroke()
    
    // Bridge
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.leftEye.x + glassWidth, landmarks.leftEye.y)
    this.ctx.lineTo(landmarks.rightEye.x - glassWidth, landmarks.rightEye.y)
    this.ctx.stroke()
    
    // Arms
    this.ctx.beginPath()
    this.ctx.moveTo(landmarks.leftEye.x - glassWidth, landmarks.leftEye.y)
    this.ctx.lineTo(landmarks.leftEye.x - glassWidth*2, landmarks.leftEye.y + 10)
    this.ctx.moveTo(landmarks.rightEye.x + glassWidth, landmarks.rightEye.y)
    this.ctx.lineTo(landmarks.rightEye.x + glassWidth*2, landmarks.rightEye.y + 10)
    this.ctx.stroke()

    // Lens reflection
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.leftEye.x - glassWidth*0.3, landmarks.leftEye.y - glassHeight*0.3, 
                     glassWidth*0.3, glassHeight*0.5, 0, 0, 2 * Math.PI)
    this.ctx.fill()
    
    this.ctx.beginPath()
    this.ctx.ellipse(landmarks.rightEye.x - glassWidth*0.3, landmarks.rightEye.y - glassHeight*0.3, 
                     glassWidth*0.3, glassHeight*0.5, 0, 0, 2 * Math.PI)
    this.ctx.fill()
  }
}