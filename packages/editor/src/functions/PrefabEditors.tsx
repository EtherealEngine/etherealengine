import { PositionalAudioComponent } from '@xrengine/engine/src/audio/components/PositionalAudioComponent'
import { MediaPrefabs } from '@xrengine/engine/src/audio/systems/MediaSystem'
import { Component } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { PhysicsPrefabs } from '@xrengine/engine/src/physics/systems/PhysicsSystem'
import { AmbientLightComponent } from '@xrengine/engine/src/scene/components/AmbientLightComponent'
import { AssetComponent } from '@xrengine/engine/src/scene/components/AssetComponent'
import { CloudComponent } from '@xrengine/engine/src/scene/components/CloudComponent'
import { ColliderComponent } from '@xrengine/engine/src/scene/components/ColliderComponent'
import { DirectionalLightComponent } from '@xrengine/engine/src/scene/components/DirectionalLightComponent'
import { EnvMapBakeComponent } from '@xrengine/engine/src/scene/components/EnvMapBakeComponent'
import { EnvmapComponent } from '@xrengine/engine/src/scene/components/EnvmapComponent'
import { GroundPlaneComponent } from '@xrengine/engine/src/scene/components/GroundPlaneComponent'
import { GroupComponent } from '@xrengine/engine/src/scene/components/GroupComponent'
import { HemisphereLightComponent } from '@xrengine/engine/src/scene/components/HemisphereLightComponent'
import { ImageComponent } from '@xrengine/engine/src/scene/components/ImageComponent'
import { InstancingComponent } from '@xrengine/engine/src/scene/components/InstancingComponent'
import { InteriorComponent } from '@xrengine/engine/src/scene/components/InteriorComponent'
import { MediaComponent } from '@xrengine/engine/src/scene/components/MediaComponent'
import { ModelComponent } from '@xrengine/engine/src/scene/components/ModelComponent'
import { MountPointComponent } from '@xrengine/engine/src/scene/components/MountPointComponent'
import { OceanComponent } from '@xrengine/engine/src/scene/components/OceanComponent'
import { ParticleEmitterComponent } from '@xrengine/engine/src/scene/components/ParticleEmitterComponent'
import { PointLightComponent } from '@xrengine/engine/src/scene/components/PointLightComponent'
import { PortalComponent } from '@xrengine/engine/src/scene/components/PortalComponent'
import { ScenePreviewCameraComponent } from '@xrengine/engine/src/scene/components/ScenePreviewCamera'
import { SceneTagComponent } from '@xrengine/engine/src/scene/components/SceneTagComponent'
import { SkyboxComponent } from '@xrengine/engine/src/scene/components/SkyboxComponent'
import { SpawnPointComponent } from '@xrengine/engine/src/scene/components/SpawnPointComponent'
import { SplineComponent } from '@xrengine/engine/src/scene/components/SplineComponent'
import { SpotLightComponent } from '@xrengine/engine/src/scene/components/SpotLightComponent'
import { SystemComponent } from '@xrengine/engine/src/scene/components/SystemComponent'
import { VideoComponent } from '@xrengine/engine/src/scene/components/VideoComponent'
import { VolumetricComponent } from '@xrengine/engine/src/scene/components/VolumetricComponent'
import { WaterComponent } from '@xrengine/engine/src/scene/components/WaterComponent'
import { LightPrefabs } from '@xrengine/engine/src/scene/systems/LightSystem'
import { ScenePrefabs } from '@xrengine/engine/src/scene/systems/SceneObjectUpdateSystem'
import { TransformComponent } from '@xrengine/engine/src/transform/components/TransformComponent'
import { PersistentAnchorComponent, SkyAnchorComponent } from '@xrengine/engine/src/xr/XRAnchorComponents'

import ChairIcon from '@mui/icons-material/Chair'

import AmbientLightNodeEditor from '../components/properties/AmbientLightNodeEditor'
import { AssetNodeEditor } from '../components/properties/AssetNodeEditor'
import CloudsNodeEditor from '../components/properties/CloudsNodeEditor'
import ColliderNodeEditor from '../components/properties/ColliderNodeEditor'
import DirectionalLightNodeEditor from '../components/properties/DirectionalLightNodeEditor'
import EnvMapBakeNodeEditor from '../components/properties/EnvMapBakeNodeEditor'
import EnvMapEditor from '../components/properties/EnvMapEditor'
import GroundPlaneNodeEditor from '../components/properties/GroundPlaneNodeEditor'
import GroupNodeEditor from '../components/properties/GroupNodeEditor'
import HemisphereLightNodeEditor from '../components/properties/HemisphereLightNodeEditor'
import ImageNodeEditor from '../components/properties/ImageNodeEditor'
import InstancingNodeEditor from '../components/properties/InstancingNodeEditor'
import InteriorNodeEditor from '../components/properties/InteriorNodeEditor'
import MediaNodeEditor from '../components/properties/MediaNodeEditor'
import ModelNodeEditor from '../components/properties/ModelNodeEditor'
import MountPointNodeEditor from '../components/properties/MountPointNodeEditor'
import NodeEditor from '../components/properties/NodeEditor'
import OceanNodeEditor from '../components/properties/OceanNodeEditor'
import ParticleEmitterNodeEditor from '../components/properties/ParticleEmitterNodeEditor'
import PersistentAnchorNodeEditor from '../components/properties/PersistentAnchorNodeEditor'
import PointLightNodeEditor from '../components/properties/PointLightNodeEditor'
import PortalNodeEditor from '../components/properties/PortalNodeEditor'
import PositionalAudioNodeEditor from '../components/properties/PositionalAudioNodeEditor'
import SceneNodeEditor from '../components/properties/SceneNodeEditor'
import ScenePreviewCameraNodeEditor from '../components/properties/ScenePreviewCameraNodeEditor'
import SkyboxNodeEditor from '../components/properties/SkyboxNodeEditor'
import SpawnPointNodeEditor from '../components/properties/SpawnPointNodeEditor'
import SplineNodeEditor from '../components/properties/SplineNodeEditor'
import SpotLightNodeEditor from '../components/properties/SpotLightNodeEditor'
import SystemNodeEditor from '../components/properties/SystemNodeEditor'
import TransformPropertyGroup from '../components/properties/TransformPropertyGroup'
import { EditorComponentType } from '../components/properties/Util'
import VideoNodeEditor from '../components/properties/VideoNodeEditor'
import VolumetricNodeEditor from '../components/properties/VolumetricNodeEditor'
import WaterNodeEditor from '../components/properties/WaterNodeEditor'

export const EntityNodeEditor = new Map<Component, EditorComponentType>()
EntityNodeEditor.set(TransformComponent, TransformPropertyGroup)
EntityNodeEditor.set(DirectionalLightComponent, DirectionalLightNodeEditor)
EntityNodeEditor.set(HemisphereLightComponent, HemisphereLightNodeEditor)
EntityNodeEditor.set(AmbientLightComponent, AmbientLightNodeEditor)
EntityNodeEditor.set(PointLightComponent, PointLightNodeEditor)
EntityNodeEditor.set(SpotLightComponent, SpotLightNodeEditor)
EntityNodeEditor.set(GroundPlaneComponent, GroundPlaneNodeEditor)
EntityNodeEditor.set(ModelComponent, ModelNodeEditor)
EntityNodeEditor.set(ParticleEmitterComponent, ParticleEmitterNodeEditor)
EntityNodeEditor.set(PortalComponent, PortalNodeEditor)
EntityNodeEditor.set(MountPointComponent, MountPointNodeEditor)
EntityNodeEditor.set(ColliderComponent, ColliderNodeEditor)
EntityNodeEditor.set(GroupComponent, GroupNodeEditor)
EntityNodeEditor.set(AssetComponent, AssetNodeEditor)
EntityNodeEditor.set(SceneTagComponent, SceneNodeEditor)
EntityNodeEditor.set(ScenePreviewCameraComponent, ScenePreviewCameraNodeEditor)
EntityNodeEditor.set(SkyboxComponent, SkyboxNodeEditor)
EntityNodeEditor.set(SpawnPointComponent, SpawnPointNodeEditor)
EntityNodeEditor.set(MediaComponent, MediaNodeEditor)
EntityNodeEditor.set(ImageComponent, ImageNodeEditor)
EntityNodeEditor.set(PositionalAudioComponent, PositionalAudioNodeEditor)
EntityNodeEditor.set(VideoComponent, VideoNodeEditor)
EntityNodeEditor.set(VolumetricComponent, VolumetricNodeEditor)
EntityNodeEditor.set(CloudComponent, CloudsNodeEditor)
EntityNodeEditor.set(OceanComponent, OceanNodeEditor)
EntityNodeEditor.set(WaterComponent, WaterNodeEditor)
EntityNodeEditor.set(InteriorComponent, InteriorNodeEditor)
EntityNodeEditor.set(SystemComponent, SystemNodeEditor)
EntityNodeEditor.set(SplineComponent, SplineNodeEditor)
EntityNodeEditor.set(EnvmapComponent, EnvMapEditor)
EntityNodeEditor.set(EnvMapBakeComponent, EnvMapBakeNodeEditor)
EntityNodeEditor.set(InstancingComponent, InstancingNodeEditor)
EntityNodeEditor.set(PersistentAnchorComponent, PersistentAnchorNodeEditor)
EntityNodeEditor.set(SkyAnchorComponent, NodeEditor)

export const prefabIcons = {
  [LightPrefabs.ambientLight]: AmbientLightNodeEditor.iconComponent,
  [LightPrefabs.pointLight]: PointLightNodeEditor.iconComponent,
  [LightPrefabs.spotLight]: SpotLightNodeEditor.iconComponent,
  [LightPrefabs.directionalLight]: DirectionalLightNodeEditor.iconComponent,
  [LightPrefabs.hemisphereLight]: HemisphereLightNodeEditor.iconComponent,
  [ScenePrefabs.groundPlane]: GroundPlaneNodeEditor.iconComponent,
  [ScenePrefabs.model]: ModelNodeEditor.iconComponent,
  [ScenePrefabs.previewCamera]: ScenePreviewCameraNodeEditor.iconComponent,
  [ScenePrefabs.particleEmitter]: ParticleEmitterNodeEditor.iconComponent,
  [ScenePrefabs.portal]: PortalNodeEditor.iconComponent,
  [PhysicsPrefabs.collider]: ColliderNodeEditor.iconComponent,
  [ScenePrefabs.chair]: ChairIcon,
  [ScenePrefabs.group]: GroupNodeEditor.iconComponent,
  [ScenePrefabs.asset]: InteriorNodeEditor.iconComponent,
  [ScenePrefabs.skybox]: SkyboxNodeEditor.iconComponent,
  [ScenePrefabs.spawnPoint]: SpawnPointNodeEditor.iconComponent,
  [ScenePrefabs.image]: ImageNodeEditor.iconComponent,
  [MediaPrefabs.audio]: PositionalAudioNodeEditor.iconComponent,
  [MediaPrefabs.video]: VideoNodeEditor.iconComponent,
  [MediaPrefabs.volumetric]: VolumetricNodeEditor.iconComponent,
  [ScenePrefabs.cloud]: CloudsNodeEditor.iconComponent,
  [ScenePrefabs.ocean]: OceanNodeEditor.iconComponent,
  [ScenePrefabs.water]: WaterNodeEditor.iconComponent,
  [ScenePrefabs.interior]: InteriorNodeEditor.iconComponent,
  [ScenePrefabs.system]: SystemNodeEditor.iconComponent,
  [ScenePrefabs.spline]: SplineNodeEditor.iconComponent,
  [ScenePrefabs.instancing]: InstancingNodeEditor.iconComponent,
  [ScenePrefabs.envMapbake]: EnvMapBakeNodeEditor.iconComponent,
  [ScenePrefabs.behaveGraph]: ChairIcon
}
