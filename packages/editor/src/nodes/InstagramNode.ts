import { Box3, Sphere, PropertyBinding } from 'three'
import Instagram from '@xrengine/engine/src/scene/classes/Instagram'
import EditorNodeMixin from './EditorNodeMixin'
import { setStaticMode, StaticModes } from '../functions/StaticMode'
import cloneObject3D from '@xrengine/engine/src/scene/functions/cloneObject3D'
import { Config } from '@xrengine/common/src/config'
import { makeCollidersInvisible } from '@xrengine/engine/src/physics/functions/parseModelColliders'
import { AnimationManager } from '@xrengine/engine/src/avatar/AnimationManager'
import { RethrownError } from '@xrengine/client-core/src/util/errors'
import { resolveMedia } from '../functions/resolveMedia'
import { CommandManager } from '../managers/CommandManager'
import EditorEvents from '../constants/EditorEvents'
import { CacheManager } from '../managers/CacheManager'
import { SceneManager } from '../managers/SceneManager'
import { ControlManager } from '../managers/ControlManager'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { Engine } from '@xrengine/engine/src/ecs/classes/Engine'
import { delay } from '@xrengine/engine/src/common/functions/delay'
import axios from 'axios'
import { ImageAlphaMode } from '@xrengine/engine/src/scene/classes/Image'
import ImageNode from './ImageNode'

export default class InstagramNode extends EditorNodeMixin(Instagram) {
  static nodeName = 'Instagram'
  static legacyComponentName = 'gltf-instagram'
  static initialElementProps = {
    initialScale: 'fit',
    src: '',
    instagramUsername: '',
    instagramMedias: [],
    instagramProductItems: [],
    instagramPassword: '',
    instagramProductId: '',
    instagramProductItemId: '',
    extendType: ''
  }

  meshColliders = []

  static async deserialize(json, loadAsync, onError) {
    const node = await super.deserialize(json)
    loadAsync(
      (async () => {
        const {
          extend,
          extendType,
          envMapOverride,
          textureOverride,
          instagramMedias,
          instagramUsername,
          instagramPassword,
          instagramProductId,
          instagramProductItems,
          instagramProductItemId
        } = json.components.find((c) => c.name === 'gltf-instagram').props
        // debugger
        // await node.load(src, onError)

        if (instagramMedias) node.instagramMedias = instagramMedias
        if (instagramProductItems) node.instagramProductItems = instagramProductItems
        if (instagramUsername) node._instagramUsername = instagramUsername
        if (instagramPassword) node._instagramPassword = instagramPassword
        if (instagramProductId) node._instagramProductId = instagramProductId
        if (instagramProductItemId) node._instagramProductItemId = instagramProductItemId
        if (extendType) node.extendType = extendType

        if (envMapOverride) node.envMapOverride = envMapOverride
        if (textureOverride) {
          // Using this to pass texture override uuid to event callback instead of creating a new variable
          node.textureOverride = textureOverride
          CommandManager.instance.addListener(EditorEvents.PROJECT_LOADED.toString(), () => {
            SceneManager.instance.scene.traverse((obj) => {
              if (obj.uuid === node.textureOverride) {
                node.textureOverride = obj.uuid
              }
            })
          })
        }

        node.collidable = !!json.components.find((c) => c.name === 'collidable')
        node.walkable = !!json.components.find((c) => c.name === 'walkable')
        const loopAnimationComponent = json.components.find((c) => c.name === 'loop-animation')
        if (loopAnimationComponent && loopAnimationComponent.props) {
          const { clip, activeClipIndex, hasAvatarAnimations } = loopAnimationComponent.props
          node.hasAvatarAnimations = hasAvatarAnimations
          if (activeClipIndex !== undefined) {
            node.activeClipIndex = loopAnimationComponent.props.activeClipIndex
          } else if (clip !== undefined && node.model && node.model.animations) {
            // DEPRECATED: Old loop-animation component stored the clip name rather than the clip index
            // node.activeClipIndex = node.model.animations.findIndex(
            //   animation => animation.name === clip
            // );
            const clipIndex = node.model.animations.findIndex((animation) => animation.name === clip)

            if (clipIndex !== -1) {
              node.activeClipIndices = [clipIndex]
            }
          }
        }
        const shadowComponent = json.components.find((c) => c.name === 'shadow')
        if (shadowComponent) {
          node.castShadow = shadowComponent.props.cast
          node.receiveShadow = shadowComponent.props.receive
        }

        if (extendType == 'video') {
        } else if (extendType == 'image') {
          node.extendNode = new ImageNode()
          await node.extendNode.load(extend.src, onError)
          node.controls = extend.controls || false
          node.alphaMode = extend.alphaMode === undefined ? ImageAlphaMode.Blend : extend.alphaMode
          node.alphaCutoff = extend.alphaCutoff === undefined ? 0.5 : extend.alphaCutoff
          node.projection = extend.projection
        }
        node.add(node.extendNode.children[0].clone())

        const interactableComponent = json.components.find((c) => c.name === 'interact')

        if (interactableComponent) {
          node.interactable = interactableComponent.props.interactable
          node.interactionType = interactableComponent.props.interactionType
          node.interactionText = interactableComponent.props.interactionText
          node.interactionDistance = interactableComponent.props.interactionDistance
          node.payloadName = interactableComponent.props.payloadName
          node.payloadUrl = interactableComponent.props.payloadUrl
          node.payloadBuyUrl = interactableComponent.props.payloadBuyUrl
          node.payloadLearnMoreUrl = interactableComponent.props.payloadLearnMoreUrl
          node.payloadHtmlContent = interactableComponent.props.payloadHtmlContent
          node.payloadUrl = interactableComponent.props.payloadUrl
        }
      })()
    )
    return node
  }

  _canonicalUrl = ''
  envMapOverride = ''
  textureOverride = ''
  collidable = true
  walkable = true
  initialScale: string | number = 1
  boundingBox = new Box3()
  boundingSphere = new Sphere()
  gltfJson = null
  isValidURL = false
  isProductReady = false
  isUpdateDataMatrix = true
  animations = []

  constructor() {
    super()
  }
  // Overrides Instagram's src property and stores the original (non-resolved) url.
  get src(): string {
    return this._canonicalUrl
  }
  // When getters are overridden you must also override the setter.
  set src(value: string) {
    this.load(value).catch(console.error)
  }

  get instagramUsername() {
    return this._instagramUsername
  }
  set instagramUsername(value) {
    this._instagramUsername = value
    this.getInstagramGallery()
  }

  get instagramPassword() {
    return this._instagramPassword
  }
  set instagramPassword(value) {
    this._instagramPassword = value
    this.getInstagramGallery()
  }

  get instagramProductId() {
    return this._instagramProductId
  }
  set instagramProductId(value) {
    this._instagramProductId = value
    this.instagramProductItems = []
    let modelCount = 0
    let videoCount = 0
    let imageCount = 0
    if (this.instagramMedias && this.instagramMedias.length != 0) {
      const filtered = this.instagramMedias.filter((media) => media.value == value)
      if (filtered && filtered.length != 0) {
        if (filtered[0] && filtered[0].media) {
          filtered[0].media.forEach((media, index) => {
            let label = media.extendType.replace(/\b\w/g, (l) => l.toUpperCase())
            if (media.extendType == 'model') {
              modelCount++
              label += ` ${modelCount}`
            } else if (media.extendType == 'video') {
              videoCount++
              label += ` ${videoCount}`
            } else {
              imageCount++
              label += ` ${imageCount}`
            }
            this.instagramProductItems.push({
              value: index,
              label,
              media
            })
          })
        }
      }
    }

    this._instagramProductId = value
    if (this.instagramMedias && this.instagramMedias.length != 0) {
      const filtered = this.instagramMedias.filter((product) => product.value == value)
      if (filtered && filtered.length != 0) {
        this.src = filtered[0].path
      }
    }

    this.instagramProductItemId = 0
  }

  get instagramProductItemId() {
    return this._instagramProductItemId
  }
  set instagramProductItemId(value) {
    this._instagramProductItemId = value
    this.setMediaNode(value)
  }

  async setMediaNode(index) {
    while (this.children.length > 0) {
      this.remove(this.children[0])
    }
    if (this.extendNode && this.extendNode.dispose) {
      this.extendNode.dispose()
    }

    if (!this.instagramProductItems[index] || !this.instagramProductItems[index].media) return

    const media = this.instagramProductItems[index].media
    this.extendType = media.extendType

    if (media.extendType == 'model') {
    } else if (media.extendType == 'video') {
    } else if (media.extendType == 'image') {
      this.extendNode = new ImageNode()
    }

    await this.extendNode.load(media.url)
    this.add(this.extendNode.children[0].clone())
  }

  async getInstagramGallery() {
    if (
      !this.instagramUsername ||
      this.instagramUsername == '' ||
      !this.instagramPassword ||
      this.instagramPassword == ''
    )
      return
    try {
      const username = this.instagramUsername
      const password = this.instagramPassword
      const res: any = await axios.post(`${Config.publicRuntimeConfig.apiServer}/instagram/login`, {
        username,
        password
      })

      if ((res.data.body.authenticated = true)) {
        const { csrfToken, cookies, sharedData } = res.data
        const photos: any = await axios.post(`${Config.publicRuntimeConfig.apiServer}/instagram/getPhotosByUsername`, {
          username,
          csrfToken,
          cookies,
          sharedData
        })
        const mediaData = photos.data.user.edge_owner_to_timeline_media.edges
        for (let i = 0; i < mediaData.length; i++) {
          if (mediaData[i].node.__typename === 'GraphVideo') {
            this.instagramMedias.push({
              label: `Picture ${i}`,
              value: mediaData[i].node.id,
              media: [
                {
                  extendType: 'video'
                }
              ]
            })
          } else if (mediaData[i].node.__typename === 'GraphImage') {
            this.instagramMedias.push({
              label: `Picture ${i}`,
              value: mediaData[i].node.id,
              media: [
                {
                  url: mediaData[i].node.display_resources[0].src,
                  mimeType: 'image/jpeg',
                  format: 'jpeg',
                  extendType: 'image'
                }
              ]
            })
          }
        }
      } else {
        console.log('Login Fail')
      }
    } catch (error) {
      this.instagramMedias = []
      console.error(error)
    }
  }

  reload() {
    this.load(this.src).catch(console.error)
  }
  // Overrides Instagram's loadGLTF method and uses the Editor's gltf cache.
  async loadGLTF(src) {
    const loadPromise = CacheManager.gltfCache.get(src)
    const { scene, json, animations } = await loadPromise
    this.gltfJson = json
    const clonedScene = cloneObject3D(scene)
    clonedScene.animations = animations

    return clonedScene
  }
  // Overrides Instagram's load method and resolves the src url before loading.
  async load(src, onError?) {
    const nextSrc = src || ''
    if (nextSrc === '') {
      return
    }
    this._canonicalUrl = nextSrc
    this.issues = []
    this.gltfJson = null
    if (this.model) {
      // SceneManager.instance.renderer.removeBatchedObject(this.model)
      this.remove(this.model)
      this.model = null
    }
    this.hideErrorIcon()
    try {
      this.isValidURL = true
      const { url, files } = await resolveMedia(src)
      if (this.model) {
        // SceneManager.instance.renderer.removeBatchedObject(this.model)
      }
      await super.load(url)
      // await super.load(src)

      if (this.initialScale === 'fit') {
        this.scale.set(1, 1, 1)
        if (this.model) {
          this.updateMatrixWorld()
          this.boundingBox.setFromObject(this.model)
          this.boundingBox.getBoundingSphere(this.boundingSphere)
          const diameter = this.boundingSphere.radius * 2
          if ((diameter > 1000 || diameter < 0.1) && diameter !== 0) {
            // Scale models that are too big or to small to fit in a 1m bounding sphere.
            const scaleFactor = 1 / diameter
            this.scale.set(scaleFactor, scaleFactor, scaleFactor)
          } else if (diameter > 20) {
            // If the bounding sphere of a model is over 20m in diameter, assume that the model was
            // exported with units as centimeters and convert to meters.
            // disabled this because we import scenes that are often bigger than this threshold
            // this.scale.set(0.01, 0.01, 0.01);
          }
        }
        // Clear scale to fit property so that the swapped model maintains the same scale.
        this.initialScale = 1
      } else {
        this.scale.multiplyScalar(this.initialScale)
        this.initialScale = 1
      }
      if (this.model) {
        this.model.traverse((object) => {
          if (object.material && object.material.isMeshStandardMaterial) {
            object.material.envMap = SceneManager.instance.scene?.environmentMap
            object.material.needsUpdate = true
          }
        })
      }
      makeCollidersInvisible(this.model)
      this.updateStaticModes()
    } catch (error) {
      this.showErrorIcon()
      const modelError = new RethrownError(`Error loading model "${this._canonicalUrl}"`, error)
      if (onError) {
        onError(this, modelError)
      }
      console.error(modelError)
      this.issues.push({ severity: 'error', message: 'Error loading model.' })
      this.isValidURL = false
      //this._canonicalUrl = "";
    }
    CommandManager.instance.emitEvent(EditorEvents.OBJECTS_CHANGED, [this])
    CommandManager.instance.emitEvent(EditorEvents.SELECTION_CHANGED)

    // this.hideLoadingCube();
    return this
  }
  onAdd() {
    if (this.model) {
      // SceneManager.instance.renderer.addBatchedObject(this.model)
    }
  }
  onRemove() {
    if (this.model) {
      // SceneManager.instance.renderer.removeBatchedObject(this.model)
    }
  }
  onPlay() {
    this.playAnimation()
  }
  onPause() {
    this.stopAnimation()
  }
  onUpdate(delta: number, time: number) {
    super.onUpdate(delta, time)
    if (ControlManager.instance.isInPlayMode || this.animationMixer) {
      this.update(delta)
    }
  }
  simplyfyFloat(arr) {
    return arr.map((v: number) => parseFloat((Math.round(v * 10000) / 10000).toFixed(4)))
  }

  updateStaticModes() {
    if (!this.model) return
    setStaticMode(this.model, StaticModes.Static)
    AnimationManager.instance.getAnimations().then((animations) => {
      if (animations && animations.length > 0) {
        for (const animation of animations) {
          for (const track of animation.tracks) {
            const { nodeName: uuid } = PropertyBinding.parseTrackName(track.name)
            const animatedNode = this.model.getObjectByProperty('uuid', uuid)
            if (!animatedNode) {
              // throw new Error(
              //   `Instagram.updateStaticModes: model with url "${this._canonicalUrl}" has an invalid animation "${animation.name}"`
              // )
            } else {
              setStaticMode(animatedNode, StaticModes.Dynamic)
            }
          }
        }
      }
    })
  }
  async serialize(projectID) {
    // debugger
    let extend: any

    if (this.extendType == 'video') {
    } else if (this.extendType == 'image') {
      extend = {
        src: this.extendNode._canonicalUrl,
        controls: this.extendNode.controls,
        alphaMode: this.extendNode.alphaMode,
        alphaCutoff: this.extendNode.alphaCutoff,
        projection: this.extendNode.projection
      }
    }

    const components = {
      'gltf-instagram': {
        instagramMedias: this.instagramMedias,
        instagramUsername: this._instagramUsername,
        instagramPassword: this._instagramPassword,
        instagramProductId: this._instagramProductId,
        instagramProductItemId: this._instagramProductItemId,
        instagramProductItems: this.instagramProductItems,
        extendType: this.extendType,
        extend
      },
      interact: {
        interactable: this.interactable,
        interactionType: this.interactionType,
        interactionText: this.interactionText,
        interactionDistance: this.interactionDistance,
        payloadName: this.payloadName,
        payloadUrl: this.payloadUrl,
        payloadBuyUrl: this.payloadBuyUrl,
        payloadLearnMoreUrl: this.payloadLearnMoreUrl,
        payloadHtmlContent: this.payloadHtmlContent,
        payloadModelUrl: this._canonicalUrl
      }
    }

    return await super.serialize(projectID, components)
  }
  copy(source, recursive = true) {
    super.copy(source, recursive)
    if (source.loadingCube) {
      this.initialScale = source.initialScale
      this.load(source.src)
    } else {
      this.updateStaticModes()
      this.gltfJson = source.gltfJson
      this._canonicalUrl = source._canonicalUrl
      this.envMapOverride = source.envMapOverride
    }
    this.collidable = source.collidable
    this.textureOverride = source.textureOverride
    this.instagramUsername = source.instagramUsername
    this.instagramMedias = source.instagramMedias
    this.instagramPassword = source.instagramPassword
    this.instagramProductId = source.instagramProductId
    this.walkable = source.walkable
    return this
  }

  prepareForExport(ctx: any): void {
    super.prepareForExport()
    this.addGLTFComponent('shadow', {
      cast: this.castShadow,
      receive: this.receiveShadow
    })
    // TODO: Support exporting more than one active clip.
    if (this.activeClip) {
      const activeClipIndex = ctx.animations.indexOf(this.activeClip)
      if (activeClipIndex === -1) {
        throw new Error(
          `Error exporting model "${this.name}" with url "${this._canonicalUrl}". Animation could not be found.`
        )
      } else {
        this.addGLTFComponent('loop-animation', {
          hasAvatarAnimations: this.hasAvatarAnimations,
          activeClipIndex: activeClipIndex
        })
      }
    }
  }
}
