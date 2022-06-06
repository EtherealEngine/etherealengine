import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { MathUtils, Texture, Vector2, Vector3 } from 'three'

import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { getComponent, removeComponent } from '@xrengine/engine/src/ecs/functions/ComponentFunctions'
import { DefaultArguments, MaterialLibrary } from '@xrengine/engine/src/renderer/materials/MaterialLibrary'
import { PatternTarget } from '@xrengine/engine/src/renderer/materials/MaterialParms'
import {
  MaterialOverrideComponent,
  MaterialOverrideComponentType
} from '@xrengine/engine/src/scene/components/MaterialOverrideComponent'
import { refreshMaterials } from '@xrengine/engine/src/scene/functions/loaders/MaterialOverrideFunctions'

import { Box } from '@mui/system'

import { AssetLoader } from '../../../../engine/src/assets/classes/AssetLoader'
import { getAllComponents } from '../../../../engine/src/ecs/functions/ComponentFunctions'
import BooleanInput from './BooleanInput'
import { Button } from './Button'
import InputGroup, { InputGroupContent, InputGroupVerticalContainerWide, InputGroupVerticalContent } from './InputGroup'
import NumericInput from './NumericInput'
import SelectInput from './SelectInput'
import StringInput, { ControlledStringInput } from './StringInput'

const GroupContainer = (styled as any).label`
  background-color: $transparent;
  color: #9FA4B5;
  white-space: pre-wrap;
  padding: 0 8px 8px;
`

const ArrayInputGroupContent = (styled as any)(InputGroupContent)`
  margin: 4px 0px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
}`
/*
  & > label {
    max-width: 33.33333% !important;
  }
  & > input {
    max-width: 66.66666% !important;
  }
  & > div {
    max-width: 66.66666% !important;
  }
`*/

export default function MaterialAssignment({ entity, node, modelComponent, values, onChange }) {
  let [count, setCount] = useState(values.length)
  let [materialIDs, setMaterialIDs] = useState<any[]>(
    Object.keys(MaterialLibrary).map((k) => {
      return { label: k, value: k }
    })
  )

  function texKey(index, k) {
    if (!values[index].uuid) {
      values[index].uuid = MathUtils.generateUUID()
    }
    return `${values[index].uuid}-${k}`
  }

  const initialPaths: Map<string, string> = new Map(
    values.flatMap((entry, index) => {
      return entry.args
        ? Object.entries(entry.args)
            .filter(([k, v]) => (v as Texture)?.isTexture && (v as Texture).source.data)
            .map(([k, v]) => [texKey(index, k), (v as Texture).source.data.src])
        : []
    })
  )
  let [texturePaths, setTexturePaths] = useState<Map<string, string>>(initialPaths)

  const { t } = useTranslation()

  function onChangeSize(text) {
    const count = parseInt(text)
    let preCount = 0
    if (!values) values = []
    else preCount = values.length
    if (count == undefined || preCount == count) return
    if (preCount > count) values.splice(count)
    else
      for (let i = 0; i < count - preCount; i++) {
        values.push({
          entity: -1,
          targetEntity: node.entity,
          materialID: '',
          args: {},
          patternTarget: PatternTarget.OBJ3D,
          pattern: '~',
          uuid: MathUtils.generateUUID()
        })
      }
    preCount = count
    onChange(values)
  }

  function onRemoveEntry(idx) {
    return () => {
      const removing = values[idx]
      clearTexturePaths(removing, idx)
      values.splice(idx, 1)
      if (removing.entity > -1) removeComponent(removing.entity, MaterialOverrideComponent)
      setCount(values.length)
      onChangeSize(values.length)
    }
  }

  function clearTexturePaths(args, index) {
    if (!args) return
    const removingPaths = new Map(
      Object.entries(args)
        .filter(([k, v]) => (v as Texture).isTexture)
        .map(([k, v]) => [texKey(index, k), v])
    )
    const nuPaths = new Map([...texturePaths.entries()].filter(([k, v]) => !removingPaths.has(k)))
    setTexturePaths(nuPaths)
  }

  function onAddEntry() {
    setCount(values.length + 1)
    onChangeSize(`${values.length + 1}`)
  }

  function onChangeAssignment(assignment, index) {
    values[index] = assignment
    onChange(values)
  }

  async function onRefresh() {
    //for (const [assignmentKey, path] of texturePaths.entries()) {
    await Promise.all(
      [...texturePaths.entries()].map(async ([assignmentKey, path]) => {
        const [_, uuid, prop] = /(.*)\-([\d\w]*)/.exec(assignmentKey)!
        const assignment = (values as any[]).find((val) => val.uuid === uuid)
        if (!assignment) return
        if (assignment.args === undefined) {
          assignment.args = {}
        }
        assignment.args[prop] = await AssetLoader.loadAsync(path)
      })
    )
    const nuVals = await refreshMaterials(node.entity)
    values.forEach((_, idx) => (values[idx] = nuVals[idx]))
    onChange(values)
  }

  function MaterialAssignmentEntry(index) {
    const assignment = modelComponent.materialOverrides[index]
    function setAssignmentProperty(prop) {
      return (value) => {
        assignment[prop] = value
        onChangeAssignment(assignment, index)
      }
    }

    function getArguments(materialID) {
      const argStructure = assignment.args ?? DefaultArguments[materialID]

      function setArgsProp(prop) {
        return (value) => {
          if (!assignment.args) assignment.args = argStructure
          assignment.args[prop] = value
          onChange(values)
        }
      }

      function setArgArrayProp(prop, arrayIndex) {
        return (value) => {
          if (!assignment.args) assignment.args = argStructure
          assignment.args[prop][arrayIndex] = value
          onChange(values)
        }
      }

      if (argStructure === undefined) {
        console.warn('no default arguments detected for material ' + materialID)
        return (
          <div>
            <p>No Arguments Detected</p>
          </div>
        )
      }
      function traverseArgs(args) {
        return (
          <div key={`${entity}-${index}-args`}>
            {Object.entries(args).map(([k, v]) => {
              let compKey = `${entity}-${index}-args-${k}`
              //number
              if (typeof v === 'number') {
                return (
                  <InputGroup name={k} label={k}>
                    <NumericInput value={v} onChange={setArgsProp(k)} />
                  </InputGroup>
                )
              }
              if (typeof v === 'object') {
                if ((v as any[]).length !== undefined)
                  return (
                    <InputGroup key={compKey} name={k} label={k}>
                      {(v as number[]).map((arrayVal, idx) => {
                        return (
                          <NumericInput key={`${compKey}-${idx}`} value={arrayVal} onChange={setArgArrayProp(k, idx)} />
                        )
                      })}
                    </InputGroup>
                  )
              }
              if (typeof v === 'string') {
                return (
                  <InputGroup name={k} label={k}>
                    <StringInput value={v} onChange={setArgsProp(k)} />
                  </InputGroup>
                )
              }
              if (typeof v === 'boolean') {
                return (
                  <InputGroup name={k} label={k}>
                    <BooleanInput value={v} onChange={setArgsProp(k)} />
                  </InputGroup>
                )
              }
              if ((v as Texture).isTexture) {
                const argKey = texKey(index, k)
                function onChangeTexturePath(prop) {
                  return (value) => {
                    const nuPaths = new Map(texturePaths.entries())
                    nuPaths.set(argKey, value)
                    setTexturePaths(nuPaths)
                    if (assignment.args === undefined) assignment.args = argStructure
                    onChange(values)
                  }
                }
                return (
                  <InputGroup key={compKey} name={k} label={k}>
                    <StringInput key={compKey} value={texturePaths.get(argKey)} onChange={onChangeTexturePath(k)} />
                    <Box>
                      <img src={(v as Texture).source.data?.src} />
                    </Box>
                  </InputGroup>
                )
              }
            })}
          </div>
        )
      }
      return traverseArgs(argStructure)
    }

    function onChangeMaterialID(value) {
      clearTexturePaths(assignment.args, index)
      delete assignment.args
      assignment.materialID = value
      onChangeAssignment(assignment, index)
    }

    return (
      <div key={`${entity}-${index}-entry`}>
        <span>
          <InputGroup
            key={`${entity}-${index}-materialID`}
            name="Material ID"
            label={t('editor:properties.materialAssignment.lbl-materialID')}
          >
            <SelectInput
              error={t('editor:properties.materialAssignment.error-materialID')}
              placeholder={t('editor:properties.materialAssignment.placeholder-materialID')}
              value={assignment.materialID}
              onChange={onChangeMaterialID}
              options={materialIDs}
              creatable={true}
              isSearchable={true}
            />
          </InputGroup>
          <InputGroup
            key={`${entity}-${index}-materialArguments`}
            name={`Material Arguments ${index}`}
            label={t('editor:properties.materialAssignment.lbl-materialArguments')}
          >
            {getArguments(assignment.materialID)}
          </InputGroup>
          <InputGroup
            key={`${entity}-${index}-patternTarget`}
            name={`Pattern Target`}
            label={t('editor:properties.materialAssignment.lbl-patternTarget')}
          >
            <SelectInput
              value={assignment.patternTarget}
              onChange={setAssignmentProperty('patternTarget')}
              options={[
                { label: 'Object3D Name', value: PatternTarget.OBJ3D },
                { label: 'Mesh Name', value: PatternTarget.MESH },
                { label: 'Material Name', value: PatternTarget.MATERIAL }
              ]}
            />
          </InputGroup>
          <InputGroup
            key={`${entity}-${index}-pattern`}
            name="Pattern"
            label={t('editor:properties.materialAssignment.lbl-pattern')}
          >
            <StringInput value={assignment.pattern} onChange={setAssignmentProperty('pattern')} />
          </InputGroup>
        </span>
        <span>
          <Button onClick={onRemoveEntry(index)}>Delete</Button>
        </span>
      </div>
    )
  }

  return (
    <GroupContainer>
      <InputGroupVerticalContainerWide>
        <InputGroupVerticalContent>
          <Button onClick={onRefresh}>
            <p>Refresh</p>
          </Button>
          <ArrayInputGroupContent>
            <label> Count: </label>
            <ControlledStringInput value={count} onChange={onChangeSize} />
            <Button onClick={onAddEntry}>+</Button>
          </ArrayInputGroupContent>
          {values &&
            values.map((value, idx) => {
              return (
                <ArrayInputGroupContent key={`${entity}-${idx}-overrideEntry`} style={{ margin: '4px 2px' }}>
                  <label>{idx + 1}: </label>
                  {MaterialAssignmentEntry(idx)}
                </ArrayInputGroupContent>
              )
            })}
        </InputGroupVerticalContent>
      </InputGroupVerticalContainerWide>
    </GroupContainer>
  )
}
