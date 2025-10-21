import ReactEcs, { UiEntity } from "@dcl/sdk/react-ecs"
import { Color4 } from "@dcl/sdk/math"
import { getGameState } from "./index"

// Get game state from index file
const gameState = getGameState()

// Game HUD Component
const GameHUD = () => {
  const state = getGameState()
  
  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'absolute',
        position: { top: 0, left: 0 }
      }}
    >
      {/* Wave Number - Top Left */}
      <UiEntity
        uiTransform={{
          width: 200,
          height: 60,
          position: { top: '20px', left: '20px' },
          positionType: 'absolute'
        }}
        uiBackground={{
          color: Color4.create(0, 0, 0, 0.7)
        }}
        uiText={{
          value: `Wave: ${state.currentWave}`,
          fontSize: 24,
          color: Color4.White(),
          textAlign: 'middle-center'
        }}
      />
      
      {/* Countdown Timer - Top Center */}
      <UiEntity
        uiTransform={{
          width: 200,
          height: 60,
          position: { top: '20px', left: '50%' },
          positionType: 'absolute',
          margin: { left: '-100px' }
        }}
        uiBackground={{
          color: Color4.create(0, 0, 0, 0.7)
        }}
        uiText={{
          value: `${state.countdownTime}s`,
          fontSize: 24,
          color: Color4.Yellow(),
          textAlign: 'middle-center'
        }}
      />
      
      {/* Score - Top Right */}
      <UiEntity
        uiTransform={{
          width: 200,
          height: 60,
          position: { top: '20px', right: '20px' },
          positionType: 'absolute'
        }}
        uiBackground={{
          color: Color4.create(0, 0, 0, 0.7)
        }}
        uiText={{
          value: `Score: ${state.score}`,
          fontSize: 24,
          color: Color4.Green(),
          textAlign: 'middle-center'
        }}
      />
    </UiEntity>
  )
}

export const ui = () => {
  const state = getGameState()
  
  // Show start menu if not hidden
  if (state.showStartMenu) {
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
            // Call the global startGame function
            ;(globalThis as any).startGame()
          }}
        />
      </UiEntity>
    )
  }
  
  // Show game HUD if game has started
  if (state.gameStarted) {
    return <GameHUD />
  }
  
  // Return null if neither menu nor game is active
  return null
}
