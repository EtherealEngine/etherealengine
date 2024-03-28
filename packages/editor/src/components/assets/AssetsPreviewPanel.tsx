/* eslint-disable no-case-declarations */
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
import React, { useImperativeHandle } from 'react'

import { AssetLoader } from '@etherealengine/engine/src/assets/classes/AssetLoader'
import { AssetType } from '@etherealengine/engine/src/assets/enum/AssetType'
import { NO_PROXY, useHookstate } from '@etherealengine/hyperflux'
import createReadableTexture from '@etherealengine/spatial/src/renderer/functions/createReadableTexture'

import { AudioPreviewPanel } from './AssetPreviewPanels/AudioPreviewPanel'
import { ImagePreviewPanel } from './AssetPreviewPanels/ImagePreviewPanel'
import { JsonPreviewPanel } from './AssetPreviewPanels/JsonPreviewPanel'
import { ModelPreviewPanel } from './AssetPreviewPanels/ModelPreviewPanel'
import { PreviewUnavailable } from './AssetPreviewPanels/PreviewUnavailable'
import { TxtPreviewPanel } from './AssetPreviewPanels/TxtPreviewPanel'
import { VideoPreviewPanel } from './AssetPreviewPanels/VideoPreviewPanel'

const assetHeadingStyles = {
  textAlign: 'center',
  fontSize: '0.9rem',
  paddingBottom: '10px',
  color: '#f1f1f1'
}

interface Props {
  hideHeading?: boolean
  previewPanelProps?: any
}

type ResourceProps = {
  resourceUrl: string
  name: string
  size: string | undefined
}

export type AssetSelectionChangePropsType = ResourceProps & {
  contentType: string
}

/**
 * Used to see the Preview of the Asset in the FileBrowser Panel
 */
export const AssetsPreviewPanel = React.forwardRef(({ hideHeading, previewPanelProps, ...props }: Props, ref) => {
  useImperativeHandle(ref, () => ({ onSelectionChanged }))
  const previewPanel = useHookstate({
    PreviewSource: null as ((props: { resourceProps: ResourceProps }) => JSX.Element) | null,
    resourceProps: { resourceUrl: '', name: '', size: '' }
  })

  const thumbnail = useHookstate('')

  const onSelectionChanged = async (props: AssetSelectionChangePropsType) => {
    thumbnail.value && URL.revokeObjectURL(thumbnail.value)
    if (/ktx2$/.test(props.resourceUrl)) {
      const texture = await AssetLoader.loadAsync(props.resourceUrl)
      thumbnail.set((await createReadableTexture(texture, { url: true })) as string)
      texture.dispose()
    } else {
      thumbnail.set('')
    }
    renderPreview(props)
  }

  const renderPreview = (props) => {
    console.log('props, contentType: ', props.contentType)
    switch (props.contentType) {
      case 'model/gltf':
      case 'model/gltf-binary':
      case 'model/glb':
      case AssetType.VRM:
      case 'model/vrm':
      case AssetType.glB:
      case AssetType.glTF:
      case 'gltf-binary':
      case AssetType.USDZ:
      case AssetType.FBX:
        const modelPreviewPanel = {
          PreviewSource: ModelPreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(modelPreviewPanel)
        break
      case 'image/png':
      case 'image/jpeg':
      case 'png':
      case 'jpeg':
      case 'jpg':
        const imagePreviewPanel = {
          PreviewSource: ImagePreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(imagePreviewPanel)
        break
      case 'ktx2':
      case 'image/ktx2':
        const compImgPreviewPanel = {
          PreviewSource: ImagePreviewPanel,
          resourceProps: { resourceUrl: thumbnail.value, name: props.name, size: props.size }
        }
        previewPanel.set(compImgPreviewPanel)
        break

      case 'video/mp4':
      case 'mp4':
      case 'm3u8':
        const videoPreviewPanel = {
          PreviewSource: VideoPreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(videoPreviewPanel)
        break
      case 'audio/mpeg':
      case 'mpeg':
      case 'mp3':
        const audioPreviewPanel = {
          PreviewSource: AudioPreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(audioPreviewPanel)
        break
      case 'md':
      case 'ts':
      case 'js':
        const txtPreviewPanel = {
          PreviewSource: TxtPreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(txtPreviewPanel)
        break
      case 'json':
        const jsonPreviewPanel = {
          PreviewSource: JsonPreviewPanel,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(jsonPreviewPanel)
        break

      default:
        const unavailable = {
          PreviewSource: PreviewUnavailable,
          resourceProps: { resourceUrl: props.resourceUrl, name: props.name, size: props.size }
        }
        previewPanel.set(unavailable)
        break
    }
  }

  const PreviewSource = previewPanel.get(NO_PROXY).PreviewSource

  return (
    <>
      {!hideHeading && (
        <div style={assetHeadingStyles as React.CSSProperties}>
          {previewPanel.resourceProps.name.value &&
            previewPanel.resourceProps.size.value &&
            `${previewPanel.resourceProps.name.value} (${previewPanel.resourceProps.size.value})`}
        </div>
      )}
      {PreviewSource && <PreviewSource resourceProps={previewPanel.resourceProps.value} {...previewPanelProps} />}
    </>
  )
})
