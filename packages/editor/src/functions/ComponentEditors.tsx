/*
CPAL-1.0 License

The contents of this file are subject to the Common Public Attribution License
Version 1.0. (the "License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at
https://github.com/EtherealEngine/etherealengine/blob/dev/LICENSE.
The License is based on the Mozilla Public License Version 1.1, but Sections 14
and 15 have been added to cover use of software over a computer network and 
provide for limited attribution for the Original Developer. In addition, 
Exhibit A has been modified to be consistent with Exhibit B.

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License for the
specific language governing rights and limitations under the License.

The Original Code is Ethereal Engine.

The Original Developer is the Initial Developer. The Initial Developer of the
Original Code is the Ethereal Engine team.

All portions of the code written by the Ethereal Engine team are Copyright © 2021-2023 
Ethereal Engine. All Rights Reserved.
*/

import { VisualScriptComponent } from '@etherealengine/engine'
import { PositionalAudioComponent } from '@etherealengine/engine/src/audio/components/PositionalAudioComponent'
import { LoopAnimationComponent } from '@etherealengine/engine/src/avatar/components/LoopAnimationComponent'
import { AudioAnalysisComponent } from '@etherealengine/engine/src/scene/components/AudioAnalysisComponent'
import { CameraSettingsComponent } from '@etherealengine/engine/src/scene/components/CameraSettingsComponent'
import { EnvMapBakeComponent } from '@etherealengine/engine/src/scene/components/EnvMapBakeComponent'
import { EnvmapComponent } from '@etherealengine/engine/src/scene/components/EnvmapComponent'
import { FogSettingsComponent } from '@etherealengine/engine/src/scene/components/FogSettingsComponent'
import { GroundPlaneComponent } from '@etherealengine/engine/src/scene/components/GroundPlaneComponent'
import { ImageComponent } from '@etherealengine/engine/src/scene/components/ImageComponent'
import { InstancingComponent } from '@etherealengine/engine/src/scene/components/InstancingComponent'
import { LinkComponent } from '@etherealengine/engine/src/scene/components/LinkComponent'
import { MediaComponent } from '@etherealengine/engine/src/scene/components/MediaComponent'
import { MediaSettingsComponent } from '@etherealengine/engine/src/scene/components/MediaSettingsComponent'
import { ModelComponent } from '@etherealengine/engine/src/scene/components/ModelComponent'
import { MountPointComponent } from '@etherealengine/engine/src/scene/components/MountPointComponent'
import { ParticleSystemComponent } from '@etherealengine/engine/src/scene/components/ParticleSystemComponent'
import { PortalComponent } from '@etherealengine/engine/src/scene/components/PortalComponent'
import { PostProcessingComponent } from '@etherealengine/engine/src/scene/components/PostProcessingComponent'
import { PrimitiveGeometryComponent } from '@etherealengine/engine/src/scene/components/PrimitiveGeometryComponent'
import { RenderSettingsComponent } from '@etherealengine/engine/src/scene/components/RenderSettingsComponent'
import { SDFComponent } from '@etherealengine/engine/src/scene/components/SDFComponent'
import { ScenePreviewCameraComponent } from '@etherealengine/engine/src/scene/components/ScenePreviewCamera'
import { SceneSettingsComponent } from '@etherealengine/engine/src/scene/components/SceneSettingsComponent'
import { ShadowComponent } from '@etherealengine/engine/src/scene/components/ShadowComponent'
import { SkyboxComponent } from '@etherealengine/engine/src/scene/components/SkyboxComponent'
import { SpawnPointComponent } from '@etherealengine/engine/src/scene/components/SpawnPointComponent'
import { SplineComponent } from '@etherealengine/engine/src/scene/components/SplineComponent'
import { SplineTrackComponent } from '@etherealengine/engine/src/scene/components/SplineTrackComponent'
import { SystemComponent } from '@etherealengine/engine/src/scene/components/SystemComponent'
import { TextComponent } from '@etherealengine/engine/src/scene/components/TextComponent'
import { VariantComponent } from '@etherealengine/engine/src/scene/components/VariantComponent'
import { VideoComponent } from '@etherealengine/engine/src/scene/components/VideoComponent'
import { VolumetricComponent } from '@etherealengine/engine/src/scene/components/VolumetricComponent'
import { defineState } from '@etherealengine/hyperflux'
import { ColliderComponent } from '@etherealengine/spatial/src/physics/components/ColliderComponent'
import { RigidBodyComponent } from '@etherealengine/spatial/src/physics/components/RigidBodyComponent'
import { TriggerComponent } from '@etherealengine/spatial/src/physics/components/TriggerComponent'
import { AmbientLightComponent } from '@etherealengine/spatial/src/renderer/components/AmbientLightComponent'
import { DirectionalLightComponent } from '@etherealengine/spatial/src/renderer/components/DirectionalLightComponent'
import { HemisphereLightComponent } from '@etherealengine/spatial/src/renderer/components/HemisphereLightComponent'
import { MeshComponent } from '@etherealengine/spatial/src/renderer/components/MeshComponent'
import { PointLightComponent } from '@etherealengine/spatial/src/renderer/components/PointLightComponent'
import { SpotLightComponent } from '@etherealengine/spatial/src/renderer/components/SpotLightComponent'
import { PersistentAnchorComponent } from '@etherealengine/spatial/src/xr/XRAnchorComponents'
import AmbientLightNodeEditor from '../components/properties/AmbientLightNodeEditor'
import { AudioAnalysisEditor } from '../components/properties/AudioAnalysisEditor'
import { CameraPropertiesNodeEditor } from '../components/properties/CameraPropertiesNodeEditor'
import ColliderComponentEditor from '../components/properties/ColliderComponentEditor'
import DirectionalLightNodeEditor from '../components/properties/DirectionalLightNodeEditor'
import EnvMapBakeNodeEditor from '../components/properties/EnvMapBakeNodeEditor'
import EnvMapEditor from '../components/properties/EnvMapEditor'
import { FogSettingsEditor } from '../components/properties/FogSettingsEditor'
import GroundPlaneNodeEditor from '../components/properties/GroundPlaneNodeEditor'
import HemisphereLightNodeEditor from '../components/properties/HemisphereLightNodeEditor'
import ImageNodeEditor from '../components/properties/ImageNodeEditor'
import { InstancingNodeEditor } from '../components/properties/InstancingNodeEditor'
import LinkNodeEditor from '../components/properties/LinkNodeEditor'
import LoopAnimationNodeEditor from '../components/properties/LoopAnimationNodeEditor'
import MediaNodeEditor from '../components/properties/MediaNodeEditor'
import { MediaSettingsEditor } from '../components/properties/MediaSettingsEditor'
import { MeshNodeEditor } from '../components/properties/MeshNodeEditor'
import ModelNodeEditor from '../components/properties/ModelNodeEditor'
import MountPointNodeEditor from '../components/properties/MountPointNodeEditor'
import ParticleSystemNodeEditor from '../components/properties/ParticleSystemNodeEditor'
import PersistentAnchorNodeEditor from '../components/properties/PersistentAnchorNodeEditor'
import PointLightNodeEditor from '../components/properties/PointLightNodeEditor'
import PortalNodeEditor from '../components/properties/PortalNodeEditor'
import PositionalAudioNodeEditor from '../components/properties/PositionalAudioNodeEditor'
import { PostProcessingSettingsEditor } from '../components/properties/PostProcessingSettingsEditor'
import PrimitiveGeometryNodeEditor from '../components/properties/PrimitiveGeometryNodeEditor'
import { RenderSettingsEditor } from '../components/properties/RenderSettingsEditor'
import RigidBodyComponentEditor from '../components/properties/RigidbodyComponentEditor'
import SDFEditor from '../components/properties/SDFEditor'
import ScenePreviewCameraNodeEditor from '../components/properties/ScenePreviewCameraNodeEditor'
import { SceneSettingsEditor } from '../components/properties/SceneSettingsEditor'
import ShadowProperties from '../components/properties/ShadowProperties'
import SkyboxNodeEditor from '../components/properties/SkyboxNodeEditor'
import SpawnPointNodeEditor from '../components/properties/SpawnPointNodeEditor'
import { SplineNodeEditor } from '../components/properties/SplineNodeEditor'
import { SplineTrackNodeEditor } from '../components/properties/SplineTrackNodeEditor'
import SpotLightNodeEditor from '../components/properties/SpotLightNodeEditor'
import SystemNodeEditor from '../components/properties/SystemNodeEditor'
import TextNodeEditor from '../components/properties/TextNodeEditor'
import TriggerComponentEditor from '../components/properties/TriggerComponentEditor'
import { EditorComponentType } from '../components/properties/Util'
import { VariantNodeEditor } from '../components/properties/VariantNodeEditor'
import VideoNodeEditor from '../components/properties/VideoNodeEditor'
import { VisualScriptNodeEditor } from '../components/properties/VisualScriptNodeEditor'
import VolumetricNodeEditor from '../components/properties/VolumetricNodeEditor'

export const ComponentEditorsState = defineState({
  name: 'ee.editor.ComponentEditorsState',
  initial: () => {
    return {
      [SceneSettingsComponent.name]: SceneSettingsEditor,
      [PostProcessingComponent.name]: PostProcessingSettingsEditor,
      [MediaSettingsComponent.name]: MediaSettingsEditor,
      [RenderSettingsComponent.name]: RenderSettingsEditor,
      [FogSettingsComponent.name]: FogSettingsEditor,
      [CameraSettingsComponent.name]: CameraPropertiesNodeEditor,
      [DirectionalLightComponent.name]: DirectionalLightNodeEditor,
      [HemisphereLightComponent.name]: HemisphereLightNodeEditor,
      [AmbientLightComponent.name]: AmbientLightNodeEditor,
      [PointLightComponent.name]: PointLightNodeEditor,
      [SpotLightComponent.name]: SpotLightNodeEditor,
      [SDFComponent.name]: SDFEditor,
      [GroundPlaneComponent.name]: GroundPlaneNodeEditor,
      [MeshComponent.name]: MeshNodeEditor,
      [ModelComponent.name]: ModelNodeEditor,
      [ShadowComponent.name]: ShadowProperties,
      [LoopAnimationComponent.name]: LoopAnimationNodeEditor,
      [ParticleSystemComponent.name]: ParticleSystemNodeEditor,
      [PrimitiveGeometryComponent.name]: PrimitiveGeometryNodeEditor,
      [PortalComponent.name]: PortalNodeEditor,
      [MountPointComponent.name]: MountPointNodeEditor,
      [RigidBodyComponent.name]: RigidBodyComponentEditor,
      [ColliderComponent.name]: ColliderComponentEditor,
      [TriggerComponent.name]: TriggerComponentEditor,
      [ScenePreviewCameraComponent.name]: ScenePreviewCameraNodeEditor,
      [SkyboxComponent.name]: SkyboxNodeEditor,
      [SpawnPointComponent.name]: SpawnPointNodeEditor,
      [MediaComponent.name]: MediaNodeEditor,
      [ImageComponent.name]: ImageNodeEditor,
      [PositionalAudioComponent.name]: PositionalAudioNodeEditor,
      [AudioAnalysisComponent.name]: AudioAnalysisEditor,
      [VideoComponent.name]: VideoNodeEditor,
      [VolumetricComponent.name]: VolumetricNodeEditor,
      [SystemComponent.name]: SystemNodeEditor,
      [EnvmapComponent.name]: EnvMapEditor,
      [EnvMapBakeComponent.name]: EnvMapBakeNodeEditor,
      [InstancingComponent.name]: InstancingNodeEditor,
      [PersistentAnchorComponent.name]: PersistentAnchorNodeEditor,
      [VariantComponent.name]: VariantNodeEditor,
      [SplineComponent.name]: SplineNodeEditor,
      [SplineTrackComponent.name]: SplineTrackNodeEditor,
      [VisualScriptComponent.name]: VisualScriptNodeEditor,
      [LinkComponent.name]: LinkNodeEditor,
      [TextComponent.name]: TextNodeEditor
    } as Record<string, EditorComponentType>
  }
})
