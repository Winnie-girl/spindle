import { Vector3, Quaternion, Color3 } from '@dcl/sdk/math'
import { engine, Entity, Transform, LightSource, VisibilityComponent, Tags } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { ui } from './ui'

// Game state variables
let showStartMenu = true
let currentWave = 1
let countdownTime = 30 // seconds
let score = 0
let gameStarted = false

// Game state update functions
function updateWave(wave: number) {
  currentWave = wave
}

function updateCountdown(time: number) {
  countdownTime = time
}

function updateScore(newScore: number) {
  score = newScore
}

function addScore(points: number) {
  score += points
}

// Start game function - simplified
function startGame() {
  showStartMenu = false
  gameStarted = true
}

// Make game functions globally available
;(globalThis as any).startGame = startGame

// Export game state for UI access
export function getGameState() {
  return {
    showStartMenu,
    currentWave,
    countdownTime,
    score,
    gameStarted
  }
}

export function main() {
  // Ensure initial game state is set correctly
  showStartMenu = true
  gameStarted = false
  
  // Initialize UI immediately to show start menu right away
  ReactEcsRenderer.setUiRenderer(ui)
  
  // Temporarily disable scene setup to test UI
  // setupScene()
}

function setupScene() {
  // Find the entity tagged with "spotlightlook" to use as target
  const spotlightTargetEntities = engine.getEntitiesByTag('spotlightlook')
  const spotlightTargetArray: Entity[] = Array.from(spotlightTargetEntities)
  
  if (spotlightTargetArray.length === 0) {
    return
  }
  
  const spotlightTarget = spotlightTargetArray[0]
  const targetTransform = Transform.get(spotlightTarget)
  const targetPosition = targetTransform.position

  // Hide the spotlight target entity
  VisibilityComponent.create(spotlightTarget, { visible: false })
  
  // Find all entities tagged with "light"
  const lightEntities = engine.getEntitiesByTag('Light')
  
  // Convert to array to get length
  const lightEntitiesArray: Entity[] = Array.from(lightEntities)
  
  // Create spotlights directly but with lower intensity to reduce message size
  for (const entity of lightEntitiesArray) {
    const transform = Transform.get(entity)
    const position = transform.position

    // Hide the original entity
    VisibilityComponent.create(entity, { visible: false })
    
    // Create a new spotlight entity at the same position
    const spotlight = engine.addEntity()
    
    // Position the spotlight at the original entity's position
    Transform.create(spotlight, {
      position: Vector3.create(position.x, position.y, position.z)
    })
    
    // Calculate the direction from the light position to the spotlight target
    const direction = Vector3.subtract(targetPosition, position)
    const normalizedDirection = Vector3.normalize(direction)
    
    // Create rotation to look at the center, but also point down at an angle
    const lookRotation = Quaternion.lookRotation(normalizedDirection)
    const downAngle = Quaternion.fromEulerDegrees(-30, 0, 0) // 30 degrees down
    const finalRotation = Quaternion.multiply(lookRotation, downAngle)
    
    // Update the transform with the calculated rotation
    Transform.getMutable(spotlight).rotation = finalRotation
    
    // Create the spotlight with reduced intensity to avoid message size issues
    LightSource.create(spotlight, {
      type: LightSource.Type.Spot({
        innerAngle: 25,   // Inner cone angle in degrees
        outerAngle: 45    // Outer cone angle in degrees
      }),
      color: Color3.White(),
      intensity: 5000,    // Reduced intensity to avoid message size issues
      range: 20,          // Reduced range
      shadow: false       // Disable shadows to reduce message size
    })
  }
}
