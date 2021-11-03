import { ComponentNames } from "../../common/constants/ComponentNames";
import { EntityComponentDataType, EntityCreateFunctionProps, EntityCreateFunctionType } from "../../common/constants/Object3DClassMap";
import { Entity } from "../../ecs/classes/Entity";
import { addComponent } from "../../ecs/functions/ComponentFunctions";
import { NameComponent, NameData } from "../components/NameComponent";
import { Object3DComponent, Object3DData } from "../components/Object3DComponent";
import { TransformComponent, TransformData } from "../../transform/components/TransformComponent";
import { Vector3, Quaternion, Euler } from "three";
import PostProcessing from "../classes/PostProcessing";
import { PostProcessingComponent, PostProcessingData } from "../components/PostProcessingComponent";
import { configureEffectComposer } from "../../renderer/functions/configureEffectComposer";

export const createPostprocessingEntity: EntityCreateFunctionType = (
  entity: Entity,
  componentData: EntityComponentDataType,
  props: EntityCreateFunctionProps
) => {
  if (componentData[ComponentNames.NAME]) {
    addComponent<NameData, {}>(entity, NameComponent, new NameData(componentData[ComponentNames.NAME].name))
  }

  const postprocessing = new PostProcessing()
  addComponent<Object3DData, {}>(entity, Object3DComponent, new Object3DData(postprocessing))

  if (componentData[ComponentNames.TRANSFORM]) {
    const { position, rotation, scale } = componentData[ComponentNames.TRANSFORM]
    addComponent<TransformData, {}>(
      entity,
      TransformComponent,
      new TransformData(
        postprocessing,
        {
          position: new Vector3(position.x, position.y, position.z),
          rotation: new Quaternion().setFromEuler(
            new Euler().setFromVector3(new Vector3(rotation.x, rotation.y, rotation.z), 'XYZ')
          ),
          scale: new Vector3(scale.x, scale.y, scale.z)
        }
      )
    )
  }

  if (componentData[ComponentNames.POSTPROCESSING]) {
    addComponent<PostProcessingData, {}>(
      entity,
      PostProcessingComponent,
      new PostProcessingData(postprocessing, componentData[ComponentNames.POSTPROCESSING])
    )

    if (!props.sceneProperty?.isEditor) configureEffectComposer()
  }
}