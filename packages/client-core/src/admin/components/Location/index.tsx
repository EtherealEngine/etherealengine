import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { addActionReceptor, removeActionReceptor } from '@xrengine/hyperflux'

import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

import Search from '../../common/Search'
import { AdminLocationServiceReceptor } from '../../services/LocationService'
import { AdminSceneServiceReceptor } from '../../services/SceneService'
import styles from '../../styles/admin.module.scss'
import LocationDrawer, { LocationDrawerMode } from './LocationDrawer'
import LocationTable from './LocationTable'

const Location = () => {
  const [openLocationDrawer, setOpenLocationDrawer] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const { t } = useTranslation()

  useEffect(() => {
    addActionReceptor(AdminSceneServiceReceptor)
    addActionReceptor(AdminLocationServiceReceptor)
    return () => {
      removeActionReceptor(AdminSceneServiceReceptor)
      removeActionReceptor(AdminLocationServiceReceptor)
    }
  }, [])

  const handleChange = (e: any) => {
    setSearch(e.target.value)
  }

  return (
    <div>
      <Grid container spacing={1} className={styles.mb10px}>
        <Grid item xs={12} sm={8}>
          <Search text="location" handleChange={handleChange} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            className={styles.openModalBtn}
            type="submit"
            variant="contained"
            onClick={() => setOpenLocationDrawer(true)}
          >
            {t('admin:components.locationModal.createLocation')}
          </Button>
        </Grid>
      </Grid>
      <LocationTable className={styles.rootTableWithSearch} search={search} />
      <LocationDrawer
        open={openLocationDrawer}
        mode={LocationDrawerMode.Create}
        onClose={() => setOpenLocationDrawer(false)}
      />
    </div>
  )
}

export default Location
