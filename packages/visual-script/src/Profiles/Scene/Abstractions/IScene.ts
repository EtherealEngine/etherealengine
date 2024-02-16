import { Choices } from '@etherealengine/visual-script'

export interface IScene {
  getProperty(jsonPath: string, valueTypeName: string): any
  setProperty(jsonPath: string, valueTypeName: string, value: any): void
  addOnClickedListener(jsonPath: string, callback: (jsonPath: string) => void): void
  removeOnClickedListener(jsonPath: string, callback: (jsonPath: string) => void): void
  getRaycastableProperties: () => Choices
  getProperties: () => Choices
  addOnSceneChangedListener(listener: () => void): void
  removeOnSceneChangedListener(listener: () => void): void
}
