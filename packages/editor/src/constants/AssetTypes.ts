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

import { NativeTypes } from 'react-dnd-html5-backend'

import { AssetType } from '@etherealengine/engine/src/assets/enum/AssetType'

/**
 * ItemTypes object containing types of items used.
 *
 * @type {Object}
 */
export const ItemTypes = {
  File: NativeTypes.FILE,
  Folder: 'folder',
  Audios: [AssetType.MP3, 'mpeg', 'audio/mpeg'],
  Images: [AssetType.PNG, AssetType.JPEG, 'jpg', 'gif', AssetType.KTX2, 'image/png', 'image/jpeg', 'image/ktx2'],
  Models: [
    AssetType.glB,
    'model/glb',
    AssetType.glTF,
    'model/gltf',
    AssetType.FBX,
    'model/fbx',
    AssetType.USDZ,
    'model/usdz',
    AssetType.VRM,
    'model/vrm'
  ],
  Scripts: ['tsx', AssetType.TS, 'jsx', 'js', AssetType.Script],
  Videos: [AssetType.MP4, AssetType.M3U8, 'video/mp4', AssetType.MKV],
  Volumetrics: ['manifest'],
  Text: [AssetType.PlainText, 'txt'],
  ECS: ['scene.json'],
  Graph: ['graph.json'],
  Node: 'Node',
  Material: 'Material',
  Component: 'Component'
}

export const SupportedFileTypes = [
  ...ItemTypes.Images,
  ...ItemTypes.Audios,
  ...ItemTypes.Videos,
  ...ItemTypes.Volumetrics,
  ...ItemTypes.Models,
  ...ItemTypes.Scripts,
  ...ItemTypes.Graph,
  ItemTypes.Folder,
  ItemTypes.File
]
