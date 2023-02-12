import React, { useEffect, useState } from 'react'

import { EngineRendererState } from '@xrengine/engine/src/renderer/WebGLRendererSystem'
import InfiniteGridHelper from '@xrengine/engine/src/scene/classes/InfiniteGridHelper'
import { getState, useHookstate } from '@xrengine/hyperflux'

import GridOnIcon from '@mui/icons-material/GridOn'

import NumericStepperInput from '../../inputs/NumericStepperInput'
import { InfoTooltip } from '../../layout/Tooltip'
import * as styles from '../styles.module.scss'

const GridTool = () => {
  const engineRendererState = useHookstate(getState(EngineRendererState))
  const [gridHeight, setGridHeight] = useState(engineRendererState.gridHeight)

  useEffect(() => {
    updateGridHeight(engineRendererState.gridHeight)
  }, [engineRendererState.gridHeight])

  const updateGridHeight = (val) => {
    setGridHeight(val)
  }

  const onToggleGridVisible = () => {
    engineRendererState.gridVisibility.set(!engineRendererState.gridVisibility.value)
  }

  const onChangeGridHeight = (value) => {
    InfiniteGridHelper.instance.setGridHeight(value)
  }

  return (
    <div id="transform-grid" className={styles.toolbarInputGroup}>
      <InfoTooltip title="Toggle Grid Visibility">
        <button
          onClick={onToggleGridVisible}
          className={styles.toolButton + ' ' + (engineRendererState.gridVisibility ? styles.selected : '')}
        >
          <GridOnIcon fontSize="small" />
        </button>
      </InfoTooltip>
      <NumericStepperInput
        className={styles.toolbarNumericStepperInput}
        value={gridHeight}
        onChange={onChangeGridHeight}
        precision={0.01}
        smallStep={0.5}
        mediumStep={1}
        largeStep={5}
        unit="m"
        incrementTooltip="[-] Increment Grid Height"
        decrementTooltip="[=] Decrement Grid Height"
      />
    </div>
  )
}

export default GridTool
