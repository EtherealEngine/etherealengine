import _ from 'lodash'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AVATAR_FILE_ALLOWED_EXTENSIONS } from '@xrengine/common/src/constants/AvatarConstants'

import { ArrowBack, Help, SystemUpdateAlt } from '@mui/icons-material'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'

import AlertMessage from '../../common/AlertMessage'
import InputText from '../../common/InputText'
import { validateForm } from '../../common/validation/formValidation'
import { AvatarService } from '../../services/AvatarService'
import { useStyles } from '../../styles/ui'
import { CreateEditAdminAvatar } from '@xrengine/common/src/interfaces/AvatarInterface'
const Input = styled('input')({
  display: 'none'
})

const AvatarCreate = ({ handleClose, open }) => {
  const { t } = useTranslation()
  const classes = useStyles()
  const [newAvatar, setNewAvatar] = useState({
    avatarName: '',
    avatarUrl: '',
    description: ''
  })
  const [formErrors, setFormErrors] = useState({
    avatarName: '',
    avatarUrl: '',
    description: ''
  })
  const [selectUse, setSelectUse] = useState(false)
  const [openAlter, setOpenAlter] = useState(false)
  const [error, setError] = useState('')

  const handleChangeInput = (e) => {
    const names = e.target.name
    const value = e.target.value
    let temp = formErrors
    temp[names] = value.length < 2 ? `${_.upperFirst(names)} is required` : ''
    setFormErrors(temp)
    setNewAvatar({ ...newAvatar, [names]: value })
  }

  const clearState = () => {
    setNewAvatar({
      ...newAvatar,
      avatarName: '',
      avatarUrl: '',
      description: ''
    })
    setFormErrors({
      ...formErrors,
      avatarName: '',
      avatarUrl: '',
      description: ''
    })
  }
  const handleCloseAlter = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }
    setOpenAlter(false)
  }

  const uploadByUrls = async () => {
    const createAdminAvatar: CreateEditAdminAvatar = {
      name: newAvatar.avatarName,
      description: newAvatar.description,
      url: newAvatar.avatarUrl,
      staticResourceType: 'avatar'
    }
    let temp = formErrors
    if (!newAvatar.avatarName) {
      temp.avatarName = t('admin:components.avatar.nameCantEmpty')
    }
    if (!newAvatar.description) {
      temp.description = t('admin:components.avatar.descriptionCantEmpty')
    }
    if (!newAvatar.avatarUrl) {
      temp.avatarUrl = t('admin:components.avatar.avatarUrlCantEmpty')
    }
    if (validateForm(newAvatar, formErrors)) {
      await AvatarService.createAdminAvatar(createAdminAvatar)
      clearState()
      handleClose()
    } else {
      setError(t('admin:components.avatar.fillRequiredFields'))
      setOpenAlter(true)
    }
  }

  return (
    <React.Fragment>
      <Drawer classes={{ paper: classes.paperDrawer }} anchor="right" open={open} onClose={handleClose}>
        <Container maxWidth="sm" className={classes.marginTp}>
          <DialogTitle>
            <IconButton onClick={handleClose}>
              <ArrowBack />
            </IconButton>
            {t('user:avatar.title')}
          </DialogTitle>
          <DialogContent>
            <IconButton className={classes.positionRight}>
              <Help className={classes.spanWhite} />
            </IconButton>

            <div style={{ marginTop: '2rem' }}>
              <InputText
                value={newAvatar.avatarName}
                handleInputChange={handleChangeInput}
                name="avatarName"
                formErrors={formErrors.avatarName}
              />
              <InputText
                value={newAvatar.description}
                handleInputChange={handleChangeInput}
                name="description"
                formErrors={formErrors.description}
              />

              <Button className={classes.saveBtn} onClick={() => setSelectUse(!selectUse)} style={{ width: '97%' }}>
                {!selectUse ? t('user:avatar.uploadFiles') : t('user:avatar.useUrlInstead')}
              </Button>
              {!selectUse ? (
                <InputText
                  value={newAvatar.avatarUrl}
                  handleInputChange={handleChangeInput}
                  formErrors={formErrors.avatarUrl}
                  name="avatarUrl"
                />
              ) : (
                <label htmlFor="contained-button-file" style={{ marginRight: '8px' }}>
                  <Input
                    accept={AVATAR_FILE_ALLOWED_EXTENSIONS}
                    id="contained-button-file"
                    type="file"
                    // onChange={handleAvatarChange}
                  />
                  <Button
                    variant="contained"
                    component="span"
                    // classes={{ root: classes.rootBtn }}
                    endIcon={<SystemUpdateAlt />}
                  >
                    {t('user:avatar.avatar')}
                  </Button>
                </label>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button className={classes.saveBtn} onClick={uploadByUrls}>
              {t('user:avatar.lbl-upload')}
            </Button>
            <Button
              onClick={() => {
                clearState()
                handleClose()
              }}
              className={classes.saveBtn}
            >
              {t('user:avatar.cancel')}
            </Button>
          </DialogActions>
        </Container>
      </Drawer>
      <AlertMessage open={openAlter} handleClose={handleCloseAlter} severity="warning" message={error} />
    </React.Fragment>
  )
}

export default AvatarCreate
