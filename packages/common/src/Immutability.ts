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
export type Primitive = null | undefined | string | number | boolean | symbol | bigint
export type BuiltIns = Primitive | void | Date | RegExp
export type HasMultipleCallSignatures<T extends (...arguments_: any[]) => unknown> = T extends {
  (...arguments_: infer A): unknown
  (...arguments_: any[]): unknown
}
  ? unknown[] extends A
    ? false
    : true
  : false
type HasPrototype<T> = 'prototype' extends keyof T ? true : false
export type Immutable<T> = T extends BuiltIns
  ? T
  : T extends new (...args: any[]) => unknown
  ? T // Skip class constructors
  : T extends (...arguments_: any[]) => unknown
  ? T extends ReadonlyObjectDeep<T>
    ? T
    : HasMultipleCallSignatures<T> extends true
    ? T
    : ((...arguments_: Parameters<T>) => ReturnType<T>) & ReadonlyObjectDeep<T>
  : T extends Readonly<ReadonlyMap<infer KeyType, infer ValueType>>
  ? ReadonlyMapDeep<KeyType, ValueType>
  : T extends Readonly<ReadonlySet<infer ItemType>>
  ? ReadonlySetDeep<ItemType>
  : // Identify tuples to avoid converting them to arrays inadvertently; special case `readonly [...never[]]`, as it emerges undesirably from recursive invocations of Immutable below.
  T extends readonly [] | readonly [...never[]]
  ? readonly []
  : T extends readonly [infer U, ...infer V]
  ? readonly [Immutable<U>, ...Immutable<V>]
  : T extends readonly [...infer U, infer V]
  ? readonly [...Immutable<U>, Immutable<V>]
  : T extends ReadonlyArray<infer ItemType>
  ? ReadonlyArray<Immutable<ItemType>>
  : T extends object
  ? ReadonlyObjectDeep<T>
  : unknown

/**
Same as `Immutable`, but accepts only `ReadonlyMap`s as inputs. Internal helper for `Immutable`.
*/
export type ReadonlyMapDeep<KeyType, ValueType> = {} & Readonly<ReadonlyMap<Immutable<KeyType>, Immutable<ValueType>>>

/**
Same as `Immutable`, but accepts only `ReadonlySet`s as inputs. Internal helper for `Immutable`.
*/
export type ReadonlySetDeep<ItemType> = {} & Readonly<ReadonlySet<Immutable<ItemType>>>

/**
Same as `Immutable`, but accepts only `object`s as inputs. Internal helper for `Immutable`.
*/
export type ReadonlyObjectDeep<ObjectType extends object> = {
  readonly [KeyType in keyof ObjectType]: Immutable<ObjectType[KeyType]>
}
