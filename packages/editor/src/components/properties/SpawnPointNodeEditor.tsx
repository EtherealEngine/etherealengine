import React from 'react'
import { useTranslation } from 'react-i18next'

import StreetviewIcon from '@mui/icons-material/Streetview'

import NodeEditor from './NodeEditor'
import { EditorComponentType } from './Util'

/**
 * SpawnPointNodeEditor component used to provide the editor view to customize Spawn Point properties.
 *
 * @type {Class component}
 */
export const SpawnPointNodeEditor: EditorComponentType = (props) => {
  const { t } = useTranslation()

  // initializing iconComponent icon name
  return (
    <NodeEditor
      {...props}
      name={t('editor:properties.spawnPoint.name')}
      description={t('editor:properties.spawnPoint.description')}
    />
  )
}

SpawnPointNodeEditor.iconComponent = StreetviewIcon

export default SpawnPointNodeEditor
