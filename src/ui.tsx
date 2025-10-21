import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { Color4 } from "@dcl/sdk/math"
import { engine, Transform, VisibilityComponent } from "@dcl/sdk/ecs"
import { Vector3 } from "@dcl/sdk/math"

// State to control menu visibility
let showStartMenu = true

export function startGame() {
  console.log('Starting game!')
  showStartMenu = false
  
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

export const ui = () => {
  // Don't render the menu if it's hidden
  if (!showStartMenu) {
    return null
  }

  return (
  <UiEntity
    uiTransform={{
      width: '100%',
      height: '100%',
      positionType: 'absolute',
      position: { top: 0, left: 0 },
      alignItems: 'center',
      justifyContent: 'center'
    }}
    uiBackground={{
      texture: { src: 'startmenue.jpg' },
      textureMode: 'stretch'
    }}
  >
    {/* START GAME Button */}
    <UiEntity
      uiTransform={{
        width: 200,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        margin: { top: '20%' }
      }}
      uiBackground={{
        color: Color4.create(0.2, 0.2, 0.2, 0.8),
        textureMode: 'nine-slices',
        textureSlices: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      }}
      uiText={{
        value: 'START GAME',
        fontSize: 24,
        color: Color4.White(),
        textAlign: 'middle-center'
      }}
      onMouseDown={() => {
        startGame()
      }}
    />
  </UiEntity>
  )
}
