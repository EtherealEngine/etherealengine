import React from 'react'

import Drawer from '@mui/material/Drawer'

import styles from '../styles/admin.module.scss'

interface Props {
  open: boolean
  children?: React.ReactNode
  onClose: () => void
}

const ViewDrawer = ({ open, children, onClose }: Props) => {
  return (
    <React.Fragment>
      <Drawer anchor="right" open={open} onClose={onClose} classes={{ paper: styles.paperDrawer }}>
        {children}
      </Drawer>
    </React.Fragment>
  )
}

export default ViewDrawer
