import { createMappedComponent } from '../../ecs/functions/ComponentFunctions'

export const MountPoint = {
  seat: 'seat' as const
}

export type MountPointTypes = typeof MountPoint[keyof typeof MountPoint]

export type MountPointComponentType = {
  type: MountPointTypes
}

export const MountPointComponent = createMappedComponent<MountPointComponentType>('MountPointComponent')
