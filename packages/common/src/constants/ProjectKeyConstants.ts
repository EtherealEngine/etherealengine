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

//FIXME: Legacy location of public assets, should be deleted and all files' use of this removed once all existing
//projects have had their public assets moved to the /public folder
export const assetsRegex = /projects\/[a-zA-Z0-9-_]+\/assets\//
export const projectRegex = /projects\/[a-zA-Z0-9-_]+/
export const projectPublicRegex = /projects\/[a-zA-Z0-9-_]+\/public\//
//FIXME: These should be removed once scenes and their assets like envmaps, loading screens, and thumbnails
//are moved to the /public folder
export const rootImageRegex = /projects\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_.]+.(jpg|jpeg|ktx2|png)/
export const rootSceneJsonRegex = /projects\/[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_]+.scene.json/
