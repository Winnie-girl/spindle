import { engine, Entity, Transform, LightSource, VisibilityComponent, Tags, GltfContainer } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { ui } from './ui'

// Game state
let gameStarted = false
let currentWave = 1
let countdownTime = 60
let score = 0

// Zombie spawning system
let zombieSpawnPoints: Vector3[] = []
let zombiesSpawned = 0
let zombiesSpawnedThisWave = 0
let zombieSpawnTimer = 0
let zombieSpawnInterval = 120 // 2 seconds at 60fps
let zombieWaveActive = false
let gameTimer = 0
let gameTimerInterval = 60 // 1 second at 60fps

// Start game function
function startGame() {
  console.log('startGame function called!')
  gameStarted = true
  setupScene()
}

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

// Export game state for UI
export function getGameState() {
  return {
    currentWave,
    countdownTime,
    score,
    gameStarted
  }
}

// Zombie spawning functions
function setupZombieSpawns() {
  // Find and hide zombiespawn entities, store their positions
  const zombieSpawnEntities = engine.getEntitiesByTag('zombiespawn')
  const zombieSpawnArray: Entity[] = Array.from(zombieSpawnEntities)
  
  console.log(`Found ${zombieSpawnArray.length} zombiespawn entities`)
  
  for (const entity of zombieSpawnArray) {
    const transform = Transform.get(entity)
    const position = transform.position
    
    console.log(`Zombie spawn point at: ${position.x}, ${position.y}, ${position.z}`)
    
    // Store the spawn position
    zombieSpawnPoints.push(Vector3.create(position.x, position.y, position.z))
    
    // Hide the zombiespawn entity
    if (!VisibilityComponent.has(entity)) {
      VisibilityComponent.createOrReplace(entity, { visible: false })
    } else {
      VisibilityComponent.getMutable(entity).visible = false
    }
  }
  
  console.log(`Total zombie spawn points: ${zombieSpawnPoints.length}`)
}

function getZombiesPerWave(wave: number): number {
  // Wave 1 spawns 5 zombies, each wave increases by 2
  return 5 + (wave - 1) * 2
}

function spawnZombie() {
  if (zombieSpawnPoints.length === 0) {
    console.log('No zombie spawn points available!')
    return
  }
  
  // Get a random spawn point
  const randomIndex = Math.floor(Math.random() * zombieSpawnPoints.length)
  const spawnPosition = zombieSpawnPoints[randomIndex]
  
  console.log(`Spawning zombie at: ${spawnPosition.x}, ${spawnPosition.y}, ${spawnPosition.z}`)
  
  // Create zombie entity
  const zombie = engine.addEntity()
  
  // Calculate rotation to face the wall at z=8
  const wallZ = 8
  const deltaZ = wallZ - spawnPosition.z
  const deltaX = 24 - spawnPosition.x // Wall is at x=24
  const angle = Math.atan2(deltaX, deltaZ)
  
  // Position the zombie 1 unit above the spawn point
  Transform.create(zombie, {
    position: Vector3.create(spawnPosition.x, spawnPosition.y + 1, spawnPosition.z),
    rotation: Quaternion.fromEulerDegrees(0, angle * 180 / Math.PI, 0), // Face the wall
    scale: Vector3.create(1, 1, 1)
  })
  
  // Add zombie GLB model with correct path
  GltfContainer.create(zombie, {
    src: 'assets/scene/Models/girlzombie/girlzombie.glb'
  })
  
  // Make sure the zombie is visible
  VisibilityComponent.create(zombie, {
    visible: true
  })
  
  zombiesSpawned++
  zombiesSpawnedThisWave++
  console.log(`Spawned zombie ${zombiesSpawnedThisWave}/${getZombiesPerWave(currentWave)} in wave ${currentWave}`)
}

function startZombieWave() {
  zombiesSpawnedThisWave = 0
  zombieSpawnTimer = 0
  zombieWaveActive = true
  
  console.log(`Starting wave ${currentWave} with ${getZombiesPerWave(currentWave)} zombies`)
  
  // Spawn first zombie immediately
  if (zombieSpawnPoints.length > 0) {
    spawnZombie()
  }
}

function endZombieWave() {
  zombieWaveActive = false
  currentWave++
}

// Game timer system
function updateGameTimer() {
  gameTimer++
  
  // Update countdown every second
  if (gameTimer >= gameTimerInterval) {
    if (countdownTime > 0) {
      countdownTime--
    }
    gameTimer = 0
  }
}

// Zombie spawning system update
function updateZombieSpawning() {
  if (zombieSpawnPoints.length === 0) {
    return
  }
  
  zombieSpawnTimer++
  
  // Start the wave after initial delay (when timer reaches 0)
  if (zombieSpawnTimer >= 180 && !zombieWaveActive) { // 3 seconds delay
    startZombieWave()
    zombieSpawnTimer = 0
    return
  }
  
  if (!zombieWaveActive) {
    return
  }
  
  const zombiesPerWave = getZombiesPerWave(currentWave)
  
  // Spawn a zombie every 2 seconds (120 frames at 60fps)
  if (zombieSpawnTimer >= zombieSpawnInterval && zombiesSpawnedThisWave < zombiesPerWave) {
    spawnZombie()
    zombieSpawnTimer = 0
  }
  
  // End wave when all zombies are spawned
  if (zombiesSpawnedThisWave >= zombiesPerWave) {
    endZombieWave()
  }
}

function updateZombieMovement() {
  const zombieEntities = engine.getEntitiesWith(GltfContainer, Transform)
  
  for (const [zombie] of zombieEntities) {
    const transform = Transform.getMutable(zombie)
    const position = transform.position
    
    const moveSpeed = 0.02
    transform.position = Vector3.create(
      position.x,
      position.y,
      position.z - moveSpeed // Move towards z=8
    )
    
    if (transform.position.z <= 8) { // Wall at z=8
      engine.removeEntity(zombie)
      score = Math.max(0, score - 20)
    }
  }
}

// Make startGame globally available
(globalThis as any).startGame = startGame

function setupScene() {
  console.log('Setting up scene...')
  
  // Setup zombie spawn points first
  setupZombieSpawns()
  
  // Hide playerspawn entity and teleport player
  const playerSpawnEntities = engine.getEntitiesByTag('playerspawn')
  const playerSpawnArray: Entity[] = Array.from(playerSpawnEntities)
  
  if (playerSpawnArray.length > 0) {
    const playerSpawn = playerSpawnArray[0]
    const spawnTransform = Transform.get(playerSpawn)
    const spawnPosition = spawnTransform.position
    
    // Hide the playerspawn entity
    if (!VisibilityComponent.has(playerSpawn)) {
      VisibilityComponent.createOrReplace(playerSpawn, { visible: false })
    } else {
      VisibilityComponent.getMutable(playerSpawn).visible = false
    }
    
    // Teleport player to spawn position
    movePlayerTo({
      newRelativePosition: Vector3.create(spawnPosition.x, spawnPosition.y, spawnPosition.z)
    })
  }
  
  // Hide playerwall entities
  const playerWallEntities = engine.getEntitiesByTag('playerwall')
  const playerWallArray: Entity[] = Array.from(playerWallEntities)
  
  for (const entity of playerWallArray) {
    if (!VisibilityComponent.has(entity)) {
      VisibilityComponent.createOrReplace(entity, { visible: false })
    } else {
      VisibilityComponent.getMutable(entity).visible = false
    }
  }
  
  // Hide spotlightlook entity
  const spotlightTargetEntities = engine.getEntitiesByTag('spotlightlook')
  const spotlightTargetArray: Entity[] = Array.from(spotlightTargetEntities)
  
  for (const entity of spotlightTargetArray) {
    if (!VisibilityComponent.has(entity)) {
      VisibilityComponent.createOrReplace(entity, { visible: false })
    } else {
      VisibilityComponent.getMutable(entity).visible = false
    }
  }
  
  // Hide light entities and create spotlights
  const lightEntities = engine.getEntitiesByTag('Light')
  const lightEntitiesArray: Entity[] = Array.from(lightEntities)
  
  // Limit to first 2 lights to avoid message size issues
  const limitedLightEntities = lightEntitiesArray.slice(0, 2)
  
  for (const entity of limitedLightEntities) {
    const transform = Transform.get(entity)
    const position = transform.position

    // Hide the original entity
    if (!VisibilityComponent.has(entity)) {
      VisibilityComponent.createOrReplace(entity, { visible: false })
    } else {
      VisibilityComponent.getMutable(entity).visible = false
    }
    
    // Create a new spotlight entity at the same position
    const spotlight = engine.addEntity()
    
    // Position the spotlight at the original entity's position
    Transform.create(spotlight, {
      position: Vector3.create(position.x, position.y, position.z)
    })
    
    // Create the spotlight with minimal settings to avoid message size issues
    LightSource.create(spotlight, {
      type: LightSource.Type.Spot({
        innerAngle: 30,
        outerAngle: 60
      }),
      color: Color3.White(),
      intensity: 1000,
      range: 15,
      shadow: false
    })
  }
  
  // Create a visible wall at z=8
  console.log('Creating visible wall...')
  const wall = engine.addEntity()
  
  Transform.create(wall, {
    position: Vector3.create(24, 0, 8), // Position at z=8 (the wall position)
    rotation: Quaternion.create(0, 0, 0, 1),
    scale: Vector3.create(1, 1, 1) // Normal scale to avoid validation issues
  })
  
  // No wall model to avoid message size issues - wall will be invisible but functional
  // GltfContainer.create(wall, {
  //   src: 'assets/asset-packs/large_stone_wall/Wall_Stone_Large/Wall_Stone_Large.glb'
  // })
  
  VisibilityComponent.create(wall, {
    visible: false // Wall is invisible but functional for collision detection
  })
  
  console.log('Visible wall created at z=8')
  
  console.log('Scene setup completed')
  
  // Initialize timers
  zombieSpawnTimer = 0 // Will start counting up to 180 frames (3 seconds)
  gameTimer = 0
}

// Engine systems
engine.addSystem(updateGameTimer)
engine.addSystem(updateZombieSpawning)
engine.addSystem(updateZombieMovement)

export function main() {
  console.log('Scene initialized with HUD')
  
  // Initialize UI
  ReactEcsRenderer.setUiRenderer(ui)
  
  // Start the game directly
  startGame()
}
