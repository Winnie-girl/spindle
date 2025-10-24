import { ReactEcs } from '@dcl/sdk/react-ecs'
import { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'

// Import game state
import { getGameState } from './index'

export const ui = () => {
  const gameState = getGameState()
  
  // Simple Game HUD - no start menu
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