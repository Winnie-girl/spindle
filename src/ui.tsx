import { ReactEcs } from '@dcl/sdk/react-ecs'
import { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

// Import game state
import { getGameState } from './index'

export const ui = () => {
  const gameState = getGameState()
  
  // If game hasn't started, show start menu
  if (!gameState.gameStarted) {
    return (
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          positionType: 'absolute',
          position: { top: 0, left: 0 }
        }}
      >
        {/* Fullscreen Background Image */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: '100%',
            positionType: 'absolute',
            position: { top: 0, left: 0 }
          }}
          uiBackground={{
            textureMode: 'nine-slices',
            texture: {
              src: 'assets/images/startgamepic.jpg'
            },
            uvs: [0, 1, 1, 1, 1, 0, 0, 0]
          }}
        />
        
        {/* START GAME Button - Centered */}
        <UiEntity
          uiTransform={{
            width: 300,
            height: 80,
            positionType: 'absolute',
            position: { top: '50%', left: '50%' },
            margin: { top: -40, left: -150 }
          }}
          uiBackground={{
            color: Color4.create(0.4, 0.08, 0.08, 1.0) // Cherrywood #661414
          }}
          onMouseDown={() => {
            if ((globalThis as any).startGame) {
              (globalThis as any).startGame()
            }
          }}
          uiText={{
            value: 'START GAME',
            fontSize: 36,
            color: Color4.White(),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>
    )
  }
  
  // If game has started, show the HUD
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
          positionType: 'absolute',
          position: { top: 20, left: 250 }
        }}
        uiText={{
          value: `Wave: ${gameState.currentWave}`,
          fontSize: 28,
          color: Color4.White(),
          textAlign: 'middle-left'
        }}
      />
      
      {/* Countdown Timer - Top Center */}
      <UiEntity
        uiTransform={{
          width: 200,
          height: 60,
          positionType: 'absolute',
          position: { top: 20, left: '50%' }
        }}
        uiText={{
          value: `Time: ${gameState.countdownTime}`,
          fontSize: 28,
          color: Color4.White(),
          textAlign: 'middle-center'
        }}
      />
      
      {/* Score - Top Right */}
      <UiEntity
        uiTransform={{
          width: 200,
          height: 60,
          positionType: 'absolute',
          position: { top: 20, right: 250 }
        }}
        uiText={{
          value: `Score: ${gameState.score}`,
          fontSize: 28,
          color: Color4.White(),
          textAlign: 'middle-right'
        }}
      />
    </UiEntity>
  )
}