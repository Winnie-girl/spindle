import { engine, Entity, Transform, LightSource, VisibilityComponent, Tags, GltfContainer, PointerEvents, InputAction, PointerEventType, MeshCollider, inputSystem, Schemas, MeshRenderer, Material } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color3, Color4 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { ui } from './ui'

// Define a component to tag zombies
const ZombieComponent = engine.defineComponent('zombie-component', {})

// Define a component for moths with flying properties
const MothComponentSchema = {
  flySpeed: Schemas.Number,
  verticalSpeed: Schemas.Number,
  horizontalOffset: Schemas.Number,
  startX: Schemas.Number,
  startY: Schemas.Number,
  startZ: Schemas.Number
}

const MothComponent = engine.defineComponent('moth-component', MothComponentSchema)

// Define a component for cats with lurking properties
const CatComponentSchema = {
  moveSpeed: Schemas.Number,
  patrolRadius: Schemas.Number,
  startX: Schemas.Number,
  startY: Schemas.Number,
  startZ: Schemas.Number,
  direction: Schemas.Number,
  waitTimer: Schemas.Number
}

const CatComponent = engine.defineComponent('cat-component', CatComponentSchema)

// Define a component for hit effect particles
const HitEffectSchema = {
  lifetime: Schemas.Number,
  initialVelocity: Schemas.Vector3
}

const HitEffect = engine.defineComponent('hit-effect', HitEffectSchema)

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
let mothAnimationTime = 0 // For smooth moth animation
let catAnimationTime = 0 // For cat movement timing

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
  
  // Tag the zombie with a component so only zombies move, not floor entities
  ZombieComponent.create(zombie, {})
  
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
  
  // Make zombies visible
  VisibilityComponent.create(zombie, {
    visible: true
  })
  
  // Add MeshCollider so the zombie can be clicked
  MeshCollider.create(zombie, {
    mesh: { $case: 'box', box: {} }
  })
  
  // Add pointer events to make zombie shootable
  // PointerEvents.create(zombie, {
  //   pointerEvents: [
  //     {
  //       eventType: PointerEventType.PET_DOWN,
  //       eventInfo: {
  //         button: InputAction.IA_POINTER,
  //         hoverText: "Shoot Zombie",
  //         showFeedback: true,
  //         maxDistance: 100
  //       }
  //     }
  //   ]
  // })
  
  zombiesSpawned++
  zombiesSpawnedThisWave++
  console.log(`Spawned zombie ${zombiesSpawnedThisWave}/${getZombiesPerWave(currentWave)} in wave ${currentWave}`)
}

function startZombieWave() {
  zombiesSpawnedThisWave = 0
  zombieSpawnTimer = 0
  zombieWaveActive = true
  
  // Reset countdown timer to 60 for each new wave (starting from wave 2)
  if (currentWave > 1) {
    countdownTime = 60
  }
  
  console.log(`Starting wave ${currentWave} with ${getZombiesPerWave(currentWave)} zombies`)
  
  // Spawn first zombie immediately
  if (zombieSpawnPoints.length > 0) {
    spawnZombie()
  }
  
  // Reset timer after spawning first zombie so next zombie spawns after interval
  zombieSpawnTimer = 0
}

function endZombieWave() {
  zombieWaveActive = false
  currentWave++
}

// Game timer system
function updateGameTimer() {
  gameTimer++
  mothAnimationTime++ // Increment moth animation time
  catAnimationTime++ // Increment cat animation time
  
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
  // Don't run if game hasn't started
  if (!gameStarted) {
    return
  }
  
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
  
  // Don't end the wave when all zombies are spawned - wait for them to be defeated
  // Wave will end in updateZombieMovement when all zombies are defeated
}

function updateZombieMovement() {
  // Don't run if game hasn't started
  if (!gameStarted) {
    return
  }
  
  const zombieEntities = engine.getEntitiesWith(ZombieComponent, Transform)
  
  let zombieCount = 0
  for (const [zombie] of zombieEntities) {
    zombieCount++
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
  
  // Check if wave is complete (all zombies spawned AND all defeated)
  const zombiesPerWave = getZombiesPerWave(currentWave)
  if (zombiesSpawnedThisWave >= zombiesPerWave && zombieCount === 0) {
    console.log(`Wave ${currentWave} complete! Starting next wave...`)
    endZombieWave()
  }
}

// Function to create hit effect at zombie position
function createHitEffect(position: Vector3) {
  // Create a brief flash of light
  const flash = engine.addEntity()
  Transform.create(flash, { position })
  LightSource.create(flash, {
    type: LightSource.Type.Point({}),
    color: Color3.create(1, 0.5, 0), // Orange flash
    intensity: 500,
    range: 5
  })
  VisibilityComponent.create(flash, { visible: true })
  
  // Remove flash after 0.1 seconds (6 frames at 60fps)
  HitEffect.create(flash, {
    lifetime: 6,
    initialVelocity: Vector3.create(0, 0, 0)
  })
  
  // Create 5 particles that scatter
  for (let i = 0; i < 5; i++) {
    const particle = engine.addEntity()
    
    // Random offset from center
    const randomOffset = Vector3.create(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    )
    
    Transform.create(particle, {
      position: Vector3.add(position, randomOffset),
      scale: Vector3.create(0.1, 0.1, 0.1)
    })
    
    // Create purple particle
    MeshRenderer.setSphere(particle)
    Material.setPbrMaterial(particle, {
      albedoColor: Color4.create(Math.random() * 0.4 + 0.5, 0, Math.random() * 0.3 + 0.7, 1), // Purple colors
      emissiveColor: Color4.create(0.7, 0.2, 1, 1), // Purple glow
      emissiveIntensity: 2
    })
    
    // Random velocity for scattering effect (increased scatter)
    const velocity = Vector3.create(
      (Math.random() - 0.5) * 0.15,  // Increased from 0.05 to 0.15
      Math.random() * 0.15 + 0.02,  // Increased from 0.05 to 0.15
      (Math.random() - 0.5) * 0.15  // Increased from 0.05 to 0.15
    )
    
    // Particle will be cleaned up after 18 frames (0.3 seconds)
    HitEffect.create(particle, {
      lifetime: 18,
      initialVelocity: velocity
    })
  }
}

// System to update and clean up hit effects
function updateHitEffects() {
  const hitEffects = engine.getEntitiesWith(HitEffect, Transform)
  
  for (const [effect] of hitEffects) {
    const hitData = HitEffect.getMutable(effect)
    const transform = Transform.getMutable(effect)
    
    // Decrease lifetime
    hitData.lifetime--
    
    // Move particle
    if (hitData.initialVelocity.x !== 0 || hitData.initialVelocity.y !== 0 || hitData.initialVelocity.z !== 0) {
      transform.position = Vector3.add(transform.position, hitData.initialVelocity)
      
      // Fade out over time by scaling down
      const scale = hitData.lifetime / 18
      transform.scale = Vector3.create(scale * 0.1, scale * 0.1, scale * 0.1)
    }
    
    // Remove effect when lifetime expires
    if (hitData.lifetime <= 0) {
      engine.removeEntity(effect)
    }
  }
}

function handleZombieShooting() {
  // Don't run if game hasn't started
  if (!gameStarted) {
    return
  }
  
  // Check for input actions (mouse clicks) - only on initial press
  if (inputSystem.isTriggered(InputAction.IA_POINTER, PointerEventType.PET_DOWN)) {
    // Get all zombies
    const zombieEntities = engine.getEntitiesWith(ZombieComponent, Transform)
    
    // Find the closest zombie to the player
    let closestZombie: Entity | null = null
    let closestDistance = Infinity
    
    for (const [zombie] of zombieEntities) {
      const zombieTransform = Transform.get(zombie)
      const zombiePosition = zombieTransform.position
      
      // Simple distance calculation
      const distance = Math.sqrt(
        Math.pow(zombiePosition.x - 24.25, 2) + // Player position approximation
        Math.pow(zombiePosition.y - 8, 2) +
        Math.pow(zombiePosition.z - 6.75, 2)
      )
      
      if (distance < closestDistance && distance <= 100) { // Max shooting distance
        closestDistance = distance
        closestZombie = zombie
      }
    }
    
    // Shoot the closest zombie
    if (closestZombie) {
      const zombieTransform = Transform.get(closestZombie)
      const zombiePos = zombieTransform.position
      
      // Create hit effect
      createHitEffect(Vector3.create(zombiePos.x, zombiePos.y, zombiePos.z))
      
      engine.removeEntity(closestZombie)
      score += 10 // Add 10 points for shooting a zombie
      console.log(`Zombie shot! Score: ${score}`)
    }
  }
}

// Moth flying system
function updateMothFlying() {
  const mothEntities = engine.getEntitiesWith(MothComponent, Transform)
  
  for (const [moth] of mothEntities) {
    const transform = Transform.getMutable(moth)
    const mothData = MothComponent.get(moth)
    const position = transform.position
    
    // Vertical flying movement (bobbing up and down using sine wave)
    const newY = mothData.startY + Math.sin(mothAnimationTime * 0.1) * mothData.verticalSpeed
    
    let newX: number, newZ: number
    
    // If horizontalOffset is 0, moth orbits in place. Otherwise, moth flies away
    if (mothData.horizontalOffset === 0) {
      // Orbiting behavior - moth stays in local area
      const timeOffset = mothAnimationTime * mothData.flySpeed
      const orbitRadius = 1.5 // Small orbiting radius
      
      // Circular horizontal movement (keeps moths in their local area)
      newX = mothData.startX + Math.cos(timeOffset) * orbitRadius * mothData.flySpeed
      newZ = mothData.startZ + Math.sin(timeOffset) * orbitRadius * mothData.flySpeed
      
      // Add rotation that follows the circular path
      const rotationOffset = (timeOffset * 57.3) % 360 // Convert radians to degrees
      transform.rotation = Quaternion.fromEulerDegrees(0, rotationOffset, 0)
    } else {
      // Flying away behavior - moth flies forward and gets cleaned up when far
      newX = position.x
      newZ = position.z - mothData.flySpeed
      
      // Add slight rotation for natural movement
      const rotationOffset = Math.sin(mothAnimationTime * 0.05) * 15
      transform.rotation = Quaternion.fromEulerDegrees(0, rotationOffset, 0)
      
      // Remove moths that fly too far (cleanup)
      if (position.z < -20) {
        engine.removeEntity(moth)
        continue
      }
    }
    
    // Update position
    transform.position = Vector3.create(
      newX,
      newY,
      newZ
    )
  }
}

// Cat lurking system
function updateCatMovement() {
  const catEntities = engine.getEntitiesWith(CatComponent, Transform)
  
  for (const [cat] of catEntities) {
    const catData = CatComponent.getMutable(cat)
    const transform = Transform.getMutable(cat)
    
    // Increment wait timer
    catData.waitTimer++
    
    // Cat pauses for a bit, then moves (lurking behavior)
    if (catData.waitTimer < 180) { // Wait 3 seconds before moving
      // Just rotate slightly while waiting
      const idleRotation = Math.sin(catAnimationTime * 0.01) * 5
      transform.rotation = Quaternion.fromEulerDegrees(0, idleRotation, 0)
      continue
    }
    
    // Reset wait timer periodically
    if (catData.waitTimer > 420) { // Wait again after 7 seconds of movement
      catData.waitTimer = 0
      catData.direction += Math.PI / 2 // Change direction 90 degrees
    }
    
    // Move in the current direction
    const newX = transform.position.x + Math.cos(catData.direction) * catData.moveSpeed
    const newZ = transform.position.z + Math.sin(catData.direction) * catData.moveSpeed
    
    // Keep cat within patrol radius of starting position
    const distFromStart = Math.sqrt(
      Math.pow(newX - catData.startX, 2) + 
      Math.pow(newZ - catData.startZ, 2)
    )
    
    if (distFromStart > catData.patrolRadius) {
      // Turn around if too far from start
      catData.direction += Math.PI
    } else {
      // Update position
      transform.position = Vector3.create(
        newX,
        catData.startY, // Keep Y at starting height
        newZ
      )
    }
    
    // Rotate to face movement direction
    const rotationAngle = (catData.direction * 180 / Math.PI) + 180
    transform.rotation = Quaternion.fromEulerDegrees(0, rotationAngle, 0)
  }
}

// Make startGame globally available
(globalThis as any).startGame = startGame

function setupScene() {
  console.log('Setting up scene...')
  
  // Setup zombie spawn points first
  setupZombieSpawns()
  
  // Setup moths with flying behavior
  const mothEntities = engine.getEntitiesByTag('moth')
  const mothArray: Entity[] = Array.from(mothEntities)
  
  console.log(`Found ${mothArray.length} moth entities`)
  
  for (const moth of mothArray) {
    const transform = Transform.get(moth)
    
    // Add the MothComponent with random properties for each moth
    MothComponent.create(moth, {
      flySpeed: 0.005 + Math.random() * 0.03, // Random speed between 0.005 and 0.035 (wide range for variety)
      verticalSpeed: 0.015 + Math.random() * 0.015, // More variation in bobbing height
      horizontalOffset: Math.random() > 0.5 ? 1 : 0, // 50% orbit (0), 50% fly away (1)
      startX: transform.position.x, // Store initial X position for orbiting
      startY: transform.position.y, // Store initial Y position for smooth bobbing
      startZ: transform.position.z // Store initial Z position for orbiting
    })
    
    // Ensure moths are visible
    if (VisibilityComponent.has(moth)) {
      VisibilityComponent.getMutable(moth).visible = true
    } else {
      VisibilityComponent.create(moth, { visible: true })
    }
    
    console.log('Added flying behavior to moth')
  }
  
  // Setup cats with lurking behavior
  const catEntities = engine.getEntitiesByTag('cat')
  const catArray: Entity[] = Array.from(catEntities)
  
  console.log(`Found ${catArray.length} cat entities`)
  
  for (const cat of catArray) {
    const transform = Transform.get(cat)
    
    // Add the CatComponent with lurking properties
    CatComponent.create(cat, {
      moveSpeed: 0.003 + Math.random() * 0.002, // Very slow movement
      patrolRadius: 5 + Math.random() * 3, // Roam up to 8 units from start
      startX: transform.position.x,
      startY: transform.position.y,
      startZ: transform.position.z,
      direction: Math.random() * Math.PI * 2, // Random starting direction
      waitTimer: 0
    })
    
    // Ensure cats are visible
    if (VisibilityComponent.has(cat)) {
      VisibilityComponent.getMutable(cat).visible = true
    } else {
      VisibilityComponent.create(cat, { visible: true })
    }
    
    console.log('Added lurking behavior to cat')
  }
  
  // Debug floor entities
  const floorEntities = engine.getEntitiesByTag('floor')
  const floorArray: Entity[] = Array.from(floorEntities)
  console.log(`Found ${floorArray.length} floor entities`)
  
  // Handle any existing zombies in the scene (like the girlzombie.glb entity)
  const existingZombies = engine.getEntitiesWith(GltfContainer, Transform)
  for (const [entity] of existingZombies) {
    const gltfContainer = GltfContainer.get(entity)
    // Check if this is a zombie model
    if (gltfContainer.src.includes('girlzombie.glb') || gltfContainer.src.includes('zombie')) {
      // Add the ZombieComponent so it moves
      if (!ZombieComponent.has(entity)) {
        ZombieComponent.create(entity, {})
        console.log('Added ZombieComponent to existing zombie in scene')
      }
      // Ensure the zombie is visible
      if (VisibilityComponent.has(entity)) {
        VisibilityComponent.getMutable(entity).visible = true
      } else {
        VisibilityComponent.create(entity, { visible: true })
      }
    }
  }
  
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
engine.addSystem(handleZombieShooting)
engine.addSystem(updateMothFlying) // Add moth flying system
engine.addSystem(updateCatMovement) // Add cat lurking system
engine.addSystem(updateHitEffects) // Add hit effects cleanup system

export function main() {
  console.log('Scene initialized - waiting for user to click START')
  
  // Initialize UI (will show start menu since gameStarted is false)
  ReactEcsRenderer.setUiRenderer(ui)
  
  // Don't start the game automatically - wait for user to click START button
}
