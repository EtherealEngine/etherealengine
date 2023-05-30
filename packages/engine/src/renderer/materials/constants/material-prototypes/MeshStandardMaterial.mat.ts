import { MeshStandardMaterial as Standard } from 'three'

import { MaterialPrototypeComponentType } from '../../components/MaterialPrototypeComponent'
import { SourceType } from '../../components/MaterialSource'
import {
  BasicArgs,
  BumpMapArgs,
  EmissiveMapArgs,
  EnvMapArgs,
  LightMapArgs,
  MetalnessMapArgs,
  NormalMapArgs,
  RoughhnessMapArgs
} from '../BasicArgs'

export const DefaultArgs = {
  ...BasicArgs,
  ...EmissiveMapArgs,
  ...EnvMapArgs,
  ...NormalMapArgs,
  ...BumpMapArgs,
  ...RoughhnessMapArgs,
  ...MetalnessMapArgs,
  ...LightMapArgs
}

export const MeshStandardMaterial: MaterialPrototypeComponentType = {
  prototypeId: 'MeshStandardMaterial',
  baseMaterial: Standard,
  arguments: DefaultArgs,
  src: { type: SourceType.BUILT_IN, path: '' }
}

export default MeshStandardMaterial
