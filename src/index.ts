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

// Start game function
function startGame() {
  console.log('Starting game!')
  showStartMenu = false
  gameStarted = true
  
  // Find and handle playerspawn entity
  const playerSpawnEntities = engine.getEntitiesByTag('playerspawn')
  const playerSpawnArray = Array.from(playerSpawnEntities)
  
  if (playerSpawnArray.length > 0) {
    const playerSpawn = playerSpawnArray[0]
    const spawnTransform = Transform.get(playerSpawn)
    const spawnPosition = spawnTransform.position
    
    console.log(`Found playerspawn at position: (${spawnPosition.x}, ${spawnPosition.y}, ${spawnPosition.z})`)
    
    // Hide the playerspawn entity
    VisibilityComponent.create(playerSpawn, { visible: false })
    
    // Teleport player to spawn position
    if (Transform.has(engine.PlayerEntity)) {
      const playerTransform = Transform.getMutable(engine.PlayerEntity)
      playerTransform.position = Vector3.create(spawnPosition.x, spawnPosition.y, spawnPosition.z)
      console.log('Player teleported to spawn position!')
    } else {
      console.log('Player entity not found, teleportation skipped')
    }
  } else {
    console.log('No playerspawn entity found')
  }
}

// Make game functions globally available
;(globalThis as any).startGame = startGame
;(globalThis as any).updateWave = updateWave
;(globalThis as any).updateCountdown = updateCountdown
;(globalThis as any).updateScore = updateScore
;(globalThis as any).addScore = addScore

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
  // Initialize UI
  ReactEcsRenderer.setUiRenderer(ui)
  
  // Find the entity tagged with "spotlightlook" to use as target
  const spotlightTargetEntities = engine.getEntitiesByTag('spotlightlook')
  const spotlightTargetArray = Array.from(spotlightTargetEntities)
  
  if (spotlightTargetArray.length === 0) {
    console.log('No entity found with "spotlightlook" tag')
    return
  }
  
  const spotlightTarget = spotlightTargetArray[0]
  const targetTransform = Transform.get(spotlightTarget)
  const targetPosition = targetTransform.position
  
  console.log(`Found spotlight target at position: (${targetPosition.x}, ${targetPosition.y}, ${targetPosition.z})`)
  
  // Hide the spotlight target entity
  VisibilityComponent.create(spotlightTarget, { visible: false })
  
  // Find all entities tagged with "light"
  const lightEntities = engine.getEntitiesByTag('Light')
  
  // Convert to array to get length
  const lightEntitiesArray = Array.from(lightEntities)
  console.log(`Found ${lightEntitiesArray.length} entities tagged with "light"`)
  
  for (const entity of lightEntitiesArray) {
    // Get the entity's transform to get its position
    const transform = Transform.get(entity)
    const position = transform.position
    
    console.log(`Processing light entity at position: (${position.x}, ${position.y}, ${position.z})`)
    
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
    
    // Create the spotlight with high intensity and shadows enabled
    LightSource.create(spotlight, {
      type: LightSource.Type.Spot({
        innerAngle: 25,   // Inner cone angle in degrees
        outerAngle: 45    // Outer cone angle in degrees
      }),
      color: Color3.White(),
      intensity: 10000,    // High intensity
      range: 30,          // Long range to reach into the distance
      shadow: true        // Enable shadows
    })
    
    console.log(`Created spotlight at position: (${position.x}, ${position.y}, ${position.z})`)
  }
}
