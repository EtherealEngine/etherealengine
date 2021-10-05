import React, { useEffect } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { selectPopupsState } from '@xrengine/client-core/src/social/reducers/popupsState/selector'
import { updateShareFormState } from '@xrengine/client-core/src/social/reducers/popupsState/service'
import SharedModal from '../../SharedModal'
import AppFooter from '../../Footer'
import ShareForm from '../../ShareForm/ShareForm'

//@ts-ignore
import styles from './SharedFormPopup.module.scss'

const mapStateToProps = (state: any): any => {
  return {
    popupsState: selectPopupsState(state)
  }
}

const mapDispatchToProps = (dispatch: Dispatch): any => ({
  updateShareFormState: bindActionCreators(updateShareFormState, dispatch)
})

interface Props {
  popupsState?: any
  updateShareFormState?: typeof updateShareFormState
  setView?: any
}
export const SharedFormPopup = ({ popupsState, updateShareFormState, setView }: Props) => {
  //common for share form page
  const handleShareFormClose = () => {
    updateShareFormState(false)
  }
  const renderShareFormModal = () =>
    popupsState?.get('shareForm') === true && (
      <SharedModal
        open={popupsState?.get('shareForm')}
        onClose={handleShareFormClose}
        className={styles.shareFormPopup}
      >
        <ShareForm />
        <div className={styles.popUpFooter}>
          <AppFooter setView={setView} />
        </div>
      </SharedModal>
    )
  const shareFormState = popupsState?.get('shareForm')
  useEffect(() => {
    renderShareFormModal()
  }, [shareFormState])
  return renderShareFormModal()
}

export default connect(mapStateToProps, mapDispatchToProps)(SharedFormPopup)
