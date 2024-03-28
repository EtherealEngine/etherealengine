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

import React from 'react'
import { twMerge } from 'tailwind-merge'

const componentTypes = {
  h1: (props: React.HTMLAttributes<any>) => <h1 {...props} />,
  h2: (props: React.HTMLAttributes<any>) => <h2 {...props} />,
  h3: (props: React.HTMLAttributes<any>) => <h3 {...props} />,
  h4: (props: React.HTMLAttributes<any>) => <h4 {...props} />,
  h5: (props: React.HTMLAttributes<any>) => <h5 {...props} />,
  h6: (props: React.HTMLAttributes<any>) => <h6 {...props} />,
  p: (props: React.HTMLAttributes<any>) => <p {...props} />,
  span: (props: React.HTMLAttributes<any>) => <span {...props} />
}

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  fontFamily?: 'Inter' | 'Figtree' | string
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  fontWeight?: 'light' | 'normal' | 'semibold' | 'medium' | 'bold'
  component?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  className?: string
  theme?: 'primary' | 'secondary'
}

const Text = ({
  fontFamily = 'Inter',
  fontSize = 'base',
  fontWeight = 'normal',
  className,
  children,
  component = 'span',
  theme = 'primary'
}: TextProps): JSX.Element => {
  const Component = componentTypes[component]

  const twClassName = twMerge(
    'inline-block leading-normal',
    `font-${fontWeight} font-[${fontFamily}] text-${fontSize} text-theme-${theme}`,
    className
  )

  return <Component className={twClassName}>{children}</Component>
}

export default Text
