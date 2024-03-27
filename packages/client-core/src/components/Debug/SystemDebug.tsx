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

import React from 'react'
import { useTranslation } from 'react-i18next'
import { JSONTree } from 'react-json-tree'

import { ECSState } from '@etherealengine/ecs/src/ECSState'
import { System, SystemDefinitions, SystemUUID } from '@etherealengine/ecs/src/SystemFunctions'
import {
  AnimationSystemGroup,
  InputSystemGroup,
  PresentationSystemGroup,
  SimulationSystemGroup
} from '@etherealengine/ecs/src/SystemGroups'
import { SystemState } from '@etherealengine/ecs/src/SystemState'
import { getMutableState, getState, useHookstate } from '@etherealengine/hyperflux'

import { Color } from 'three'
import styles from './styles.module.scss'

const col = new Color()
const col2 = new Color()

const convertSystemExecutionTimeToColor = (systemDuration: number, targetTimestep: number) => {
  if (systemDuration < 1) return 'darkgreen'

  // lerp from green to red based on system duration
  col.setColorName('darkgreen').lerp(col2.setColorName('darkred'), systemDuration / targetTimestep)
  return col.getStyle()
}

export const SystemDebug = () => {
  const frameTime = useHookstate(getMutableState(ECSState).frameTime).value
  const performanceProfilingEnabled = useHookstate(getMutableState(SystemState).performanceProfilingEnabled)
  const { t } = useTranslation()

  return (
    <div className={styles.jsonPanel}>
      <h1>{t('common:debug.systems')}</h1>
      <button
        onClick={() => performanceProfilingEnabled.set((val) => !val)}
        className={styles.flagBtn + (performanceProfilingEnabled.value ? ' ' + styles.active : '')}
        style={{ width: '100px' }}
      >
        {'Profile'}
      </button>
      <SystemDagView uuid={InputSystemGroup} />
      <SystemDagView uuid={SimulationSystemGroup} />
      <SystemDagView uuid={AnimationSystemGroup} />
      <SystemDagView uuid={PresentationSystemGroup} />
    </div>
  )
}

export const SystemDagView = (props: { uuid: SystemUUID }) => {
  const { t } = useTranslation()

  useHookstate(getMutableState(ECSState).frameTime).value
  const performanceProfilingEnabled = useHookstate(getMutableState(SystemState).performanceProfilingEnabled)

  return (
    <JSONTree
      data={expandSystemToTree(SystemDefinitions.get(props.uuid)!)}
      labelRenderer={(raw, ...keyPath) => {
        const label = raw[0]
        const isInnerSystem = label === 'preSystems' || label === 'subSystems' || label === 'postSystems'
        const isUuid = label === 'uuid'

        return (
          <span style={{ color: isInnerSystem ? 'green' : 'black' }}>
            {isInnerSystem || isUuid ? t(`common:debug.${label}`) : label}
          </span>
        )
      }}
      valueRenderer={(raw, value, ...keyPath) => {
        const system = SystemDefinitions.get(value as SystemUUID)!
        const systemReactor = system ? getState(SystemState).activeSystemReactors.get(system.uuid) : undefined
        const targetTimestep = getState(ECSState).simulationTimestep / 2

        const renderSystemDuration = () => {
          const color = convertSystemExecutionTimeToColor(system.avgSystemDuration, targetTimestep)
          return (
            <span key={system.uuid} style={{ color: color }}>
              {`${Math.trunc(system.avgSystemDuration * 1000) / 1000} ms`}
            </span>
          )
        }

        return (
          <>
            {performanceProfilingEnabled.value && renderSystemDuration()}
            {systemReactor?.errors.map((e) => {
              return (
                <span style={{ color: 'red' }}>
                  {e.name.value}: {e.message.value}
                </span>
              )
            })}
          </>
        )
      }}
      shouldExpandNodeInitially={() => true}
    />
  )
}

type SystemTree = {
  uuid: SystemUUID
  preSystems: Record<SystemUUID, SystemTree>
  subSystems: Record<SystemUUID, SystemTree>
  postSystems: Record<SystemUUID, SystemTree>
}

const expandSystemToTree = (system: System): SystemTree => {
  return {
    uuid: system.uuid,
    preSystems: system.preSystems.reduce(
      (acc, uuid) => {
        acc[uuid] = expandSystemToTree(SystemDefinitions.get(uuid)!)
        return acc
      },
      {} as Record<SystemUUID, SystemTree>
    ),
    subSystems: system.subSystems.reduce(
      (acc, uuid) => {
        acc[uuid] = expandSystemToTree(SystemDefinitions.get(uuid)!)
        return acc
      },
      {} as Record<SystemUUID, SystemTree>
    ),
    postSystems: system.postSystems.reduce(
      (acc, uuid) => {
        acc[uuid] = expandSystemToTree(SystemDefinitions.get(uuid)!)
        return acc
      },
      {} as Record<SystemUUID, SystemTree>
    )
  }
}
