import React from 'react'
import { useTranslation } from 'react-i18next'

import GridViewIcon from '@mui/icons-material/GridView'

import NodeEditor from './NodeEditor'

type GroupNodeEditorProps = {
  node?: object
}

/**
 * GroupNodeEditor used to render group of multiple objects.
 *
 * @author Robert Long
 * @type {class component}
 */
export const GroupNodeEditor = (props: GroupNodeEditorProps) => {
  const { t } = useTranslation()

  return <NodeEditor {...props} description={t('editor:properties.group.description')} />
}

GroupNodeEditor.iconComponent = GridViewIcon

export default GroupNodeEditor
