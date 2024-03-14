
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


//https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5b452194a34f86bb35532340ec19582a88337de2/types/three/examples/jsm/exporters/GLTFExporter.d.ts
import { Object3D, AnimationClip, Texture, Material, Mesh, Camera, BufferAttribute, BufferGeometry, Scene } from 'three'
import { Entity } from '@etherealengine/ecs/src/Entity';

export interface GLTFExporterOptions {
    /**
     * Export position, rotation and scale instead of matrix per node. Default is false
     */
    trs?: boolean;

    /**
     * Export only visible objects. Default is true.
     */
    onlyVisible?: boolean;

    /**
     * Export just the attributes within the drawRange, if defined, instead of exporting the whole array. Default is true.
     */
    truncateDrawRange?: boolean;

    /**
     * Export in binary (.glb) format, returning an ArrayBuffer. Default is false.
     */
    binary?: boolean;

    /**
     * Export with images embedded into the glTF asset. Default is true.
     */
    embedImages?: boolean;

    /**
     * Restricts the image maximum size (both width and height) to the given value. This option works only if embedImages is true. Default is Infinity.
     */
    maxTextureSize?: number;

    /**
     * List of animations to be included in the export.
     */
    animations?: AnimationClip[];

    /**
     * Generate indices for non-index geometry and export with them. Default is false.
     */
    forceIndices?: boolean;

    /**
     * Export custom glTF extensions defined on an object's userData.gltfExtensions property. Default is false.
     */
    includeCustomExtensions?: boolean;

    relativePath?: string;

    resourceURI?: string;

    projectName?: string;

    flipY?: boolean;

    srcEntity?: Entity;
}

export class GLTFExporter {
    constructor();

    register(callback: (writer: GLTFWriter) => GLTFExporterPlugin): this;
    unregister(callback: (writer: GLTFWriter) => GLTFExporterPlugin): this;

    /**
     * Generates a .gltf (JSON) or .glb (binary) output from the input (Scenes or Objects)
     *
     * @param input Scenes or objects to export. Valid options:
     * - Export scenes
     *   ```js
     *   exporter.parse( scene1, ... )
     *   exporter.parse( [ scene1, scene2 ], ... )
     *   ```
     * - Export objects (It will create a new Scene to hold all the objects)
     *   ```js
     *   exporter.parse( object1, ... )
     *   exporter.parse( [ object1, object2 ], ... )
     *   ```
     * - Mix scenes and objects (It will export the scenes as usual but it will create a new scene to hold all the single objects).
     *   ```js
     *   exporter.parse( [ scene1, object1, object2, scene2 ], ... )
     *   ```
     * @param onDone Will be called when the export completes. The argument will be the generated glTF JSON or binary ArrayBuffer.
     * @param onError Will be called if there are any errors during the gltf generation.
     * @param options Export options
     */
    parse(
        input: Object3D | Object3D[],
        onDone: (gltf: ArrayBuffer | { [key: string]: any }) => void,
        onError: (error: ErrorEvent) => void,
        options?: GLTFExporterOptions,
    ): void;

    parseAsync(
        input: Object3D | Object3D[],
        options?: GLTFExporterOptions,
    ): Promise<ArrayBuffer | { [key: string]: any }>;
}

export class GLTFWriter {
    constructor();
    buffers: any[]
    json: any
    cache: any
    byteOffset: number
    options: {
        trs?: boolean,
        binary?: boolean,
        embedImages?: boolean,
        flipY?: boolean,
        projectName?: string,
        relativePath?: string,
        onlyVisible?: boolean,
        animations?: AnimationClip[],
        includeCustomExtensions?: boolean,
        truncateDrawRange?: boolean,
        maxTextureSize?: number,
        resourceURI?: string
        srcEntity?: Entity
    }
    pending: Promise<any>[]
    extensionsUsed : {[key:string] : any}

    applyTextureTransform(mapDef: object, texture: Texture)

    processTexture(map: Texture): number

    processMaterial(material: Material): number | null

    processMesh(mesh: Mesh): number | null

    processCamera(camera: Camera): number

    processAnimation(clip: AnimationClip, root: Object3D): number | null

    processSkin (object: Object3D): number | null

    processNode (object: Object3D) : number

    processScene(scene: Scene)

    processObjects(objects: Array)

    processInput(input: Object3D | Array<Object3D>)

    processAccessor(attribute: BufferAttribute,
        geometry?: BufferGeometry,
        start?: number,
        count?: number): number | null

    processImage(image: any,
        format: number,
        flipY: boolean,
        mimeType: string = 'image/png'): number

    processBufferViewImage(blob: Blob): Promise<number>

    processBuffer(buffer: ArrayBuffer): number

    processSampler(map: Texture): number

    setPlugins(plugins: GLTFExporterPlugin[]): void;

    /**
     * Parse scenes and generate GLTF output
     *
     * @param input Scene or Array of THREE.Scenes
     * @param onDone Callback on completed
     * @param options options
     */
    write(
        input: Object3D | Object3D[],
        onDone: (gltf: ArrayBuffer | { [key: string]: any }) => void,
        options?: GLTFExporterOptions,
    ): Promise<void>;
}

export interface GLTFExporterPlugin {
    writeImage?: (image: HTMLImageElement, imageDef: { [key: string]: any }) => void;
    writeTexture?: (map: Texture, textureDef: { [key: string]: any }) => void;
    writeMaterial?: (material: Material, materialDef: { [key: string]: any }) => void;
    writeMesh?: (mesh: Mesh, meshDef: { [key: string]: any }) => void;
    writeNode?: (object: Object3D, nodeDef: { [key: string]: any }) => void;
    beforeParse?: (input: Object3D | Object3D[]) => void;
    afterParse?: (input: Object3D | Object3D[]) => void;
}