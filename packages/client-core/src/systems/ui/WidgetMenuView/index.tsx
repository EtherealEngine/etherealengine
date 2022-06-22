import { createState } from '@speigg/hookstate'
import React, { useState } from 'react'

import { VrIcon } from '@xrengine/client-core/src/common/components/Icons/Vricon'
import { respawnAvatar } from '@xrengine/engine/src/avatar/functions/respawnAvatar'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { EngineActions, useEngineState } from '@xrengine/engine/src/ecs/classes/EngineState'
import { createXRUI } from '@xrengine/engine/src/xrui/functions/createXRUI'
import { accessWidgetAppState, useWidgetAppState, WidgetAppActions } from '@xrengine/engine/src/xrui/WidgetAppService'
import { dispatchAction } from '@xrengine/hyperflux'

import RefreshIcon from '@mui/icons-material/Refresh'

import styleString from './index.scss'

export function createWidgetButtonsView() {
  return createXRUI(WidgetButtons, createWidgetButtonsState())
}

function createWidgetButtonsState() {
  return createState({})
}

type WidgetButtonProps = {
  Icon: any
  toggle: () => any
  label: string
}

const WidgetButton = ({ Icon, toggle, label }: WidgetButtonProps) => {
  const [mouseOver, setMouseOver] = useState(false)
  return (
    <div
      className="button"
      onClick={toggle}
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      xr-layer="true"
    >
      <Icon className="svgIcon" />
      {mouseOver && <div>{label}</div>}
    </div>
  )
}

const WidgetButtons = () => {
  const engineState = useEngineState()
  const widgetState = useWidgetAppState()

  // TODO: add a notification hint function to the widget wrapper and move unread messages there
  // useEffect(() => {
  //   activeChannel &&
  //     activeChannel.messages &&
  //     activeChannel.messages.length > 0 &&
  //     !widgetState.chatMenuOpen.value &&
  //     setUnreadMessages(true)
  // }, [activeChannel?.messages])

  const toogleVRSession = () => {
    if (engineState.xrSessionStarted.value) {
      dispatchAction(EngineActions.xrEnd())
    } else {
      dispatchAction(EngineActions.xrStart())
    }
  }

  const handleRespawnAvatar = () => {
    respawnAvatar(Engine.instance.currentWorld.localClientEntity)
  }

  const widgets = Object.entries(widgetState.widgets.value).map(([id, widgetState]) => ({
    id,
    ...widgetState,
    ...Engine.instance.currentWorld.widgets.get(id)!
  }))

  const toggleWidget = (toggledWidget) => () => {
    const state = accessWidgetAppState().widgets.value
    const visible = state[toggledWidget.id].visible
    // close currently open widgets until we support multiple widgets being open at once
    if (!visible) {
      Object.entries(state).forEach(([id, widget]) => {
        if (widget.visible && id !== toggledWidget.id) dispatchAction(WidgetAppActions.showWidget({ id, shown: false }))
      })
    }
    dispatchAction(WidgetAppActions.showWidget({ id: toggledWidget.id, shown: !visible }))
  }

  return (
    <>
      <style>{styleString}</style>
      <div
        className="container"
        style={{
          gridTemplateColumns: '1fr 1fr' + widgets.map(() => ' 1fr').flat()
        }}
        xr-pixel-ratio="8"
        xr-layer="true"
      >
        <WidgetButton Icon={RefreshIcon} toggle={handleRespawnAvatar} label={'Respawn'} />
        <WidgetButton
          Icon={VrIcon}
          toggle={toogleVRSession}
          label={engineState.xrSessionStarted.value ? 'Exit VR' : 'Enter VR'}
        />
        {widgets.map(
          (widget, i) =>
            widget.enabled && (
              <WidgetButton key={i} Icon={widget.icon} toggle={toggleWidget(widget)} label={widget.label} />
            )
        )}
      </div>
    </>
  )
}
