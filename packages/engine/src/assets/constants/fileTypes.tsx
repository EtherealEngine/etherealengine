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
export const ModelFileTypes = ['.glb', '.gltf', 'model/gltf-binary', 'model/gltf-embedded', '.fbx', '.usdz', '.vrm']
//array containing volumetric file type.
export const VolumetricFileTypes = ['.manifest']
//array containing custom script type.
export const CustomScriptFileTypes = ['.tsx', '.ts', '.js', '.jsx']
export const GraphFileTypes = ['.json']
export const BinaryFileTypes = ['.bin']
//array contains arrays of all files types.
export const AllFileTypes = [
  ...AudioFileTypes,
  ...VideoFileTypes,
  ...ImageFileTypes,
  ...ModelFileTypes,
  ...VolumetricFileTypes,
  ...CustomScriptFileTypes,
  ...BinaryFileTypes,
  ...GraphFileTypes
]

//creating comma separated string contains all file types
export const AcceptsAllFileTypes = AllFileTypes.join(',')
