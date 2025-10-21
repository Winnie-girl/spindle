import { Vector3, Quaternion, Color3 } from '@dcl/sdk/math'
import { engine, Entity, Transform, LightSource, VisibilityComponent, Tags } from '@dcl/sdk/ecs'
import { ReactEcsRenderer } from '@dcl/sdk/react-ecs'
import { ui, startGame } from './ui'

// Make startGame function globally available
;(globalThis as any).startGame = startGame

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
