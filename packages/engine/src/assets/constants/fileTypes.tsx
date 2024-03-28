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

import { AssetType } from '../enum/AssetType'

// array containing audio file type
export const AudioFileTypes = ['.mp3', '.mpeg', 'audio/mpeg', '.ogg']
//array containing video file type
export const VideoFileTypes = ['.mp4', 'video/mp4', '.m3u8', 'application/vnd.apple.mpegurl']
//array containing image files types
export const ImageFileTypes = [
  '.png',
  '.jpeg',
  '.jpg',
  '.gif',
  '.ktx2',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/ktx2'
]
//array containing model file type.
export const ModelFileTypes = ['.glb', '.gltf', 'model/gltf-binary', 'model/gltf+json', '.fbx', '.usdz', '.vrm']
//array containing volumetric file type.
export const VolumetricFileTypes = ['.manifest']
//array containing custom script type.
export const CustomScriptFileTypes = ['.tsx', '.ts', '.js', '.jsx']
export const BinaryFileTypes = ['.bin']
//array contains arrays of all files types.
export const AllFileTypes = [
  ...AudioFileTypes,
  ...VideoFileTypes,
  ...ImageFileTypes,
  ...ModelFileTypes,
  ...VolumetricFileTypes,
  ...CustomScriptFileTypes,
  ...BinaryFileTypes
]

//creating comma separated string contains all file types
export const AcceptsAllFileTypes = AllFileTypes.join(',')

export const MimeTypeToAssetType = {
  'audio/mpeg': AssetType.MP3,
  'video/mp4': AssetType.MP4,
  'image/png': AssetType.PNG,
  'image/jpeg': AssetType.JPEG,
  'image/ktx2': AssetType.KTX2,
  'model/gltf-binary': AssetType.glB,
  'model/gltf+json': AssetType.glTF,
  'model/vrm': AssetType.VRM,
  'model/vrml': AssetType.VRM
} as Record<string, AssetType>

export const AssetTypeToMimeType = {
  [AssetType.MP3]: 'audio/mpeg',
  [AssetType.MP4]: 'video/mp4',
  [AssetType.PNG]: 'image/png',
  [AssetType.JPEG]: 'image/jpeg',
  [AssetType.KTX2]: 'image/ktx2',
  [AssetType.glB]: 'model/gltf-binary',
  [AssetType.glTF]: 'model/gltf+json'
} as Record<AssetType, string>

export const ExtensionToAssetType = {
  gltf: AssetType.glTF,
  glb: AssetType.glB,
  usdz: AssetType.USDZ,
  fbx: AssetType.FBX,
  vrm: AssetType.VRM,
  tga: AssetType.TGA,
  ktx2: AssetType.KTX2,
  ddx: AssetType.DDS,
  png: AssetType.PNG,
  jpg: AssetType.JPEG,
  jpeg: AssetType.JPEG,
  mp3: AssetType.MP3,
  aac: AssetType.AAC,
  ogg: AssetType.OGG,
  m4a: AssetType.M4A,
  mp4: AssetType.MP4,
  mkv: AssetType.MKV,
  m3u8: AssetType.M3U8,
  material: AssetType.MAT
}
