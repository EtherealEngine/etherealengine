import { getContentType } from '@etherealengine/common/src/utils/getContentType'
import { PositionalAudioComponent } from '../../../../../audio/components/PositionalAudioComponent.js'
import { Entity } from '../../../../../ecs/classes/Entity.js'
import { setComponent } from '../../../../../ecs/functions/ComponentFunctions.js'
import { ImageComponent } from '../../../../../scene/components/ImageComponent.js'
import { MediaComponent } from '../../../../../scene/components/MediaComponent.js'
import { ModelComponent } from '../../../../../scene/components/ModelComponent.js'
import { PrefabComponent } from '../../../../../scene/components/PrefabComponent.js'
import { VideoComponent } from '../../../../../scene/components/VideoComponent.js'
import { VolumetricComponent } from '../../../../../scene/components/VolumetricComponent.js'
import { Assert } from '../../../Diagnostics/Assert'
import { CustomEvent } from '../../../Events/CustomEvent.js'
import { Engine } from '../../../Execution/Engine'
import { IGraph } from '../../../Graphs/Graph'
import { EventNode2 } from '../../../Nodes/EventNode'
import { NodeConfiguration } from '../../../Nodes/Node'
import { NodeDescription, NodeDescription2 } from '../../../Nodes/Registry/NodeDescription'
import { Socket } from '../../../Sockets/Socket'
import { addEntityToScene } from '../helper/entityHelper.js'

async function addMediaComponent(url: string, parent?: Entity | null, before?: Entity | null) {
  const contentType = (await getContentType(url)) || ''
  const { hostname } = new URL(url)

  let componentName: string | null = null
  let updateFunc = null! as Function

  let node: Entity | null = null

  if (contentType.startsWith('prefab/')) {
    componentName = PrefabComponent.name
    updateFunc = () => setComponent(node!, PrefabComponent, { src: url })
  } else if (contentType.startsWith('model/')) {
    componentName = ModelComponent.name
    updateFunc = () => setComponent(node!, ModelComponent, { src: url })
  } else if (contentType.startsWith('video/') || hostname.includes('twitch.tv') || hostname.includes('youtube.com')) {
    componentName = VideoComponent.name
    updateFunc = () => setComponent(node!, MediaComponent, { paths: [url] })
  } else if (contentType.startsWith('image/')) {
    componentName = ImageComponent.name
    updateFunc = () => setComponent(node!, ImageComponent, { source: url })
  } else if (contentType.startsWith('audio/')) {
    componentName = PositionalAudioComponent.name
    updateFunc = () => setComponent(node!, MediaComponent, { paths: [url] })
  } else if (url.includes('.uvol')) {
    componentName = VolumetricComponent.name
    updateFunc = () => setComponent(node!, MediaComponent, { paths: [url] })
  }

  if (componentName) {
    node = addEntityToScene(componentName, parent, before)

    if (node) updateFunc()
  }

  return node
}

export class onLoadAsset extends EventNode2 {
  public static Description = new NodeDescription2({
    typeName: 'engine/onLoadAsset',
    category: 'Event',
    label: 'load asset done',
    configuration: {
      customEventId: {
        valueType: 'string',
        defaultValue: '1'
      }
    },
    factory: (description, graph, configuration) => new onLoadAsset(description, graph, configuration)
  })

  private readonly customEvent: CustomEvent

  constructor(description: NodeDescription, graph: IGraph, configuration: NodeConfiguration) {
    const eventParameters = [
      new Socket('string', 'assetPath'),
      new Socket('vec3', 'initialPosition'),
      new Socket('vec3', 'initialRotation')
    ]
    const customEvent =
      graph.customEvents[configuration.customEventId] ||
      new CustomEvent(configuration.customEventId, configuration.label, eventParameters)
    super({
      description,
      graph,
      outputs: [new Socket('flow', 'flow'), new Socket('entity', 'entity')],
      configuration
    })
    this.customEvent = customEvent
    graph.customEvents[configuration.customEventId] = customEvent
  }
  private onCustomEvent: ((parameters: { [parameter: string]: any }) => void) | undefined = undefined

  init(engine: Engine) {
    Assert.mustBeTrue(this.onCustomEvent === undefined)

    this.onCustomEvent = async (parameters) => {
      const assetPath = parameters['assetPath']
      const node = await addMediaComponent(assetPath)
      this.writeOutput('entity', node)
      engine.commitToNewFiber(this, 'flow')
    }
    this.customEvent.eventEmitter.addListener(this.onCustomEvent)
  }

  dispose(engine: Engine) {
    Assert.mustBeTrue(this.onCustomEvent !== undefined)

    if (this.onCustomEvent !== undefined) {
      this.customEvent.eventEmitter.removeListener(this.onCustomEvent)
    }
  }
}
