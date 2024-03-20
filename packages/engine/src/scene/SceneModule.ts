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

import { PositionalAudioComponent } from '../audio/components/PositionalAudioComponent'
import { LoopAnimationComponent } from '../avatar/components/LoopAnimationComponent'
import { GrabbableComponent } from '../interaction/components/GrabbableComponent'
import { MountPointSystem } from '../interaction/systems/MountPointSystem'
import { NoiseOffsetSystem } from '../scene/materials/constants/plugins/NoiseOffsetPlugin'
import { MaterialLibrarySystem } from '../scene/materials/systems/MaterialLibrarySystem'
import { CameraSettingsComponent } from './components/CameraSettingsComponent'
import { EnvMapBakeComponent } from './components/EnvMapBakeComponent'
import { EnvmapComponent } from './components/EnvmapComponent'
import { FogSettingsComponent } from './components/FogSettingsComponent'
import { GroundPlaneComponent } from './components/GroundPlaneComponent'
import { HyperspaceTagComponent } from './components/HyperspaceTagComponent'
import { ImageComponent } from './components/ImageComponent'
import { LinkComponent } from './components/LinkComponent'
import { MediaComponent } from './components/MediaComponent'
import { MediaSettingsComponent } from './components/MediaSettingsComponent'
import { MountPointComponent } from './components/MountPointComponent'
import { ParticleSystemComponent } from './components/ParticleSystemComponent'
import { PostProcessingComponent } from './components/PostProcessingComponent'
import { PrimitiveGeometryComponent } from './components/PrimitiveGeometryComponent'
import { RenderSettingsComponent } from './components/RenderSettingsComponent'
import { SceneDynamicLoadTagComponent } from './components/SceneDynamicLoadTagComponent'
import { ScenePreviewCameraComponent } from './components/ScenePreviewCamera'
import { SceneSettingsComponent } from './components/SceneSettingsComponent'
import { ScreenshareTargetComponent } from './components/ScreenshareTargetComponent'
import { ShadowComponent } from './components/ShadowComponent'
import { SkyboxComponent } from './components/SkyboxComponent'
import { SpawnPointComponent } from './components/SpawnPointComponent'
import { SplineComponent } from './components/SplineComponent'
import { SplineTrackComponent } from './components/SplineTrackComponent'
import { SystemComponent } from './components/SystemComponent'
import { TextComponent } from './components/TextComponent'
import { VariantComponent } from './components/VariantComponent'
import { VideoComponent } from './components/VideoComponent'
import { VolumetricComponent } from './components/VolumetricComponent'
import { EnvironmentSystem } from './systems/EnvironmentSystem'
import { FogSystem } from './systems/FogSystem'
import { MeshBVHSystem } from './systems/MeshBVHSystem'
import { ParticleSystem } from './systems/ParticleSystemSystem'
import { PortalSystem } from './systems/PortalSystem'
import { SDFSystem } from './systems/SDFSystem'
// import { SceneLoadingSystem } from './systems/SceneLoadingSystem'
import { SceneObjectDynamicLoadSystem } from './systems/SceneObjectDynamicLoadSystem'
import { SceneObjectSystem } from './systems/SceneObjectSystem'
import { ShadowSystem } from './systems/ShadowSystem'
import { VariantSystem } from './systems/VariantSystem'

/** This const MUST be kept here, to ensure all components definitions are loaded by the time the scene loading occurs */
export const SceneComponents = [
  PositionalAudioComponent,
  LoopAnimationComponent,
  GrabbableComponent,
  CameraSettingsComponent,
  // CloudComponent,
  EnvMapBakeComponent,
  EnvmapComponent,
  FogSettingsComponent,
  GroundPlaneComponent,
  HyperspaceTagComponent,
  ImageComponent,
  // InteriorComponent,
  MediaComponent,
  MediaSettingsComponent,
  MountPointComponent,
  // OceanComponent,
  ParticleSystemComponent,
  PostProcessingComponent,
  PrimitiveGeometryComponent,
  RenderSettingsComponent,
  SceneDynamicLoadTagComponent,
  ScenePreviewCameraComponent,
  SceneSettingsComponent,
  PostProcessingComponent,
  ScreenshareTargetComponent,
  ShadowComponent,
  SkyboxComponent,
  SpawnPointComponent,
  SplineComponent,
  SplineTrackComponent,
  SystemComponent,
  SystemComponent,
  VariantComponent,
  VideoComponent,
  VolumetricComponent,
  // WaterComponent,
  LinkComponent,
  TextComponent
]

export {
  EnvironmentSystem,
  FogSystem,
  MaterialLibrarySystem,
  MountPointSystem,
  NoiseOffsetSystem,
  MeshBVHSystem,
  ParticleSystem,
  PortalSystem,
  // SceneLoadingSystem,
  SceneObjectDynamicLoadSystem,
  SceneObjectSystem,
  SDFSystem,
  ShadowSystem,
  VariantSystem
}
