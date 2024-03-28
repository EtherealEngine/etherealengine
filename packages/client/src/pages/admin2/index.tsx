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

import { t } from 'i18next'
import React, { Suspense } from 'react'

import LoadingCircle from '@etherealengine/ui/src/primitives/tailwind/LoadingCircle'

import AdminRoutes from '@etherealengine/client-core/src/admin2/adminRoutes'
import { useEngineInjection } from '@etherealengine/client-core/src/components/World/EngineHooks'
import { useRemoveEngineCanvas } from '@etherealengine/client-core/src/hooks/useRemoveEngineCanvas'

const LocationRoutes = () => {
  const projectsLoaded = useEngineInjection()
  useRemoveEngineCanvas()

  if (!projectsLoaded)
    return (
      <LoadingCircle className="flex w-[3%] items-center justify-center" message={t('common:loader.loadingProjects')} />
    )

  return (
    <Suspense
      fallback={
        <LoadingCircle
          className="flex w-[3%] items-center justify-center"
          message={t('common:loader.loadingLocation')}
        />
      }
    >
      <AdminRoutes />
    </Suspense>
  )
}

export default LocationRoutes
