import _ from 'lodash'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { GroupScope } from '@xrengine/common/src/interfaces/Group'

import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import DialogActions from '@mui/material/DialogActions'
import DialogTitle from '@mui/material/DialogTitle'

import { useAuthState } from '../../../user/services/AuthService'
import AutoComplete from '../../common/AutoComplete'
import DrawerView from '../../common/DrawerView'
import InputText from '../../common/InputText'
import { validateForm } from '../../common/validation/formValidation'
import { AdminGroupService } from '../../services/GroupService'
import { AdminScopeTypeService, useScopeTypeState } from '../../services/ScopeTypeService'
import styles from '../../styles/admin.module.scss'

interface Props {
  open: boolean
  onClose: () => void
}

interface ScopeData {
  type: string
}

const CreateGroup = ({ open, onClose }: Props) => {
  const user = useAuthState().user
  const adminScopeTypeState = useScopeTypeState()
  const { t } = useTranslation()

  const [state, setState] = useState({
    name: '',
    description: '',
    scopeTypes: [] as GroupScope[],
    formErrors: {
      name: '',
      description: '',
      scopeTypes: ''
    }
  })

  useEffect(() => {
    if (adminScopeTypeState.updateNeeded.value && user.id.value) {
      AdminScopeTypeService.getScopeTypeService()
    }
  }, [adminScopeTypeState.updateNeeded.value, user])

  const handleChange = (event) => {
    const { name, value } = event.target
    let temp = state.formErrors
    temp[name] = value.length < 2 ? `${_.upperFirst(name)} is required` : ''
    setState({ ...state, [name]: value, formErrors: temp })
  }

  const onSubmitHandler = (event) => {
    event.preventDefault()
    const { name, description, scopeTypes } = state
    let temp = state.formErrors
    temp.name = !state.name ? t('admin:components.group.nameCantEmpty') : ''
    temp.description = !state.description ? t('admin:components.group.descriptionCantEmpty') : ''
    setState({ ...state, formErrors: temp })
    if (validateForm(state, state.formErrors)) {
      AdminGroupService.createGroupByAdmin({ name, description, scopeTypes })
      setState({
        ...state,
        name: '',
        description: '',
        scopeTypes: []
      })
      onClose()
    }
  }

  const scopeData: ScopeData[] = adminScopeTypeState.scopeTypes.value.map((el) => {
    return {
      type: el.type
    }
  })

  const handleChangeScopeType = (scope) => {
    if (scope.length) setState({ ...state, scopeTypes: scope, formErrors: { ...state.formErrors, scopeTypes: '' } })
  }

  return (
    <React.Fragment>
      <DrawerView open={open} onClose={onClose}>
        <Container maxWidth="sm" className={styles.mt20}>
          <form onSubmit={(e) => onSubmitHandler(e)}>
            <DialogTitle id="form-dialog-title" className={styles.textAlign}>
              {t('admin:components.group.createNewGroup')}
            </DialogTitle>

            <InputText
              name="name"
              label={t('admin:components.group.name')}
              placeholder={t('admin:components.group.enterGroupName')}
              value={state.name}
              error={state.formErrors.name}
              onChange={handleChange}
            />

            <InputText
              name="description"
              label={t('admin:components.group.description')}
              placeholder={t('admin:components.group.enterGroupDescription')}
              value={state.description}
              error={state.formErrors.description}
              onChange={handleChange}
            />

            <AutoComplete
              data={scopeData}
              label={t('admin:components.group.grantScope')}
              handleChangeScopeType={handleChangeScopeType}
            />

            <DialogActions className={styles.mt20}>
              <Button type="submit" className={styles.submitButton}>
                {t('admin:components.group.submit')}
              </Button>
              <Button
                onClick={() => {
                  setState({
                    ...state,
                    name: '',
                    description: '',
                    formErrors: { ...state.formErrors, name: '', description: '' }
                  })
                  onClose()
                }}
                className={styles.cancelButton}
              >
                {t('admin:components.group.cancel')}
              </Button>
            </DialogActions>
          </form>
        </Container>
      </DrawerView>
    </React.Fragment>
  )
}

export default CreateGroup
