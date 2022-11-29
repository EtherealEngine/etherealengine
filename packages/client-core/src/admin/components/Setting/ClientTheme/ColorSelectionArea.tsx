import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { defaultThemeSettings } from '@xrengine/common/src/constants/DefaultThemeSettings'
import { ThemeOptions } from '@xrengine/common/src/interfaces/ClientSetting'
import capitalizeFirstLetter from '@xrengine/common/src/utils/capitalizeFirstLetter'

import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { Box, Button, Divider, Grid, IconButton, InputBase, Radio } from '@mui/material'

import { InputMenuItem } from '../../../common/InputSelect'
import InputText from '../../../common/InputText'
import SketchColorPicker from '../../../common/SketchColorPicker'
import styles from '../../../styles/settings.module.scss'

interface ColorSelectionAreaProps {
  selectedMode: string
  colorModes: string[]
  theme: ThemeOptions
  onChangeMode: Function
  onChangeColor: Function
  onChangeThemes: Function
}

const ColorSelectionArea = ({
  selectedMode,
  colorModes,
  theme,
  onChangeMode,
  onChangeColor,
  onChangeThemes
}: ColorSelectionAreaProps) => {
  const { t } = useTranslation()

  const colorModesMenu: InputMenuItem[] = colorModes.map((el) => {
    return {
      label: capitalizeFirstLetter(el),
      value: el
    }
  })

  const createNewTheme = () => {
    onChangeThemes({ add: 'New Theme' })
  }

  const onChangeExistingTheme = (oldName, newName) => {
    onChangeThemes({ add: newName, remove: oldName })
  }

  const deleteNewTheme = (val) => {
    onChangeThemes({ remove: val })
  }

  return (
    <Grid container>
      <div
        style={{
          marginTop: '16px',
          flexDirection: 'column',
          display: 'flex'
        }}
      >
        {colorModesMenu.map((mode, index) => (
          <Box key={index} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1 }}>
            <Radio checked={selectedMode === mode.value} onClick={() => onChangeMode(mode.value)} />
            <InputText
              sx={{ flexGrow: 1 }}
              name="socialIcon"
              disabled={Object.keys(defaultThemeSettings).includes(mode.value)}
              label={t('admin:components.setting.icon')}
              value={mode.value}
              onChange={(e) => onChangeExistingTheme(mode.value, e.target.value)}
            />
            {!Object.keys(defaultThemeSettings).includes(mode.value) && (
              <IconButton
                title={t('admin:components.common.delete')}
                className={styles.iconButton}
                onClick={() => deleteNewTheme(mode.value)}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        ))}
        <Button variant="contained" onClick={createNewTheme}>
          <AddIcon /> {t('admin:components.setting.addSocialLink')}
        </Button>
      </div>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={12} className={styles.colorGridContainer}>
        <label>Main Background:</label>
        <SketchColorPicker
          name="mainBackground"
          value={theme.mainBackground}
          onChange={(color) => onChangeColor('mainBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Navbar Background:</label>
        <SketchColorPicker
          name="navbarBackground"
          value={theme.navbarBackground}
          onChange={(color) => onChangeColor('navbarBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Editor Dock Background:</label>
        <SketchColorPicker
          name="dockBackground"
          value={theme.dockBackground}
          onChange={(color) => onChangeColor('dockBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Sidebar Background:</label>
        <SketchColorPicker
          name="sidebarBackground"
          value={theme.sidebarBackground}
          onChange={(color) => onChangeColor('sidebarBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Sibebar Selected Background:</label>
        <SketchColorPicker
          name="sidebarSelectedBackground"
          value={theme.sidebarSelectedBackground}
          onChange={(color) => onChangeColor('sidebarSelectedBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Table Header Background:</label>
        <SketchColorPicker
          name="tableHeaderBackground"
          value={theme.tableHeaderBackground}
          onChange={(color) => onChangeColor('tableHeaderBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Table Cell Background:</label>
        <SketchColorPicker
          name="tableCellBackground"
          value={theme.tableCellBackground}
          onChange={(color) => onChangeColor('tableCellBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={12} className={styles.colorGridContainer}>
        <label>Table Footer Background:</label>
        <SketchColorPicker
          name="tableFooterBackground"
          value={theme.tableFooterBackground}
          onChange={(color) => onChangeColor('tableFooterBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Text Color:</label>
        <SketchColorPicker
          name="textColor"
          value={theme.textColor}
          onChange={(color) => onChangeColor('textColor', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Text Heading:</label>
        <SketchColorPicker
          name="textHeading"
          value={theme.textHeading}
          onChange={(color) => onChangeColor('textHeading', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Text Subheading:</label>
        <SketchColorPicker
          name="textSubheading"
          value={theme.textSubheading}
          onChange={(color) => onChangeColor('textSubheading', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Text Description:</label>
        <SketchColorPicker
          name="textDescription"
          value={theme.textDescription}
          onChange={(color) => onChangeColor('textDescription', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Panel Background:</label>
        <SketchColorPicker
          name="panelBackground"
          value={theme.panelBackground}
          onChange={(color) => onChangeColor('panelBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Panel Card Background:</label>
        <SketchColorPicker
          name="panelCards"
          value={theme.panelCards}
          onChange={(color) => onChangeColor('panelCards', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Panel Card Hover Outline:</label>
        <SketchColorPicker
          name="panelCardHoverOutline"
          value={theme.panelCardHoverOutline}
          onChange={(color) => onChangeColor('panelCardHoverOutline', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Panel Card Icon Color:</label>
        <SketchColorPicker
          name="panelCardIcon"
          value={theme.panelCardIcon}
          onChange={(color) => onChangeColor('panelCardIcon', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Icon Button Color:</label>
        <SketchColorPicker
          name="iconButtonColor"
          value={theme.iconButtonColor}
          onChange={(color) => onChangeColor('iconButtonColor', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Icon Button Background:</label>
        <SketchColorPicker
          name="iconButtonBackground"
          value={theme.iconButtonBackground}
          onChange={(color) => onChangeColor('iconButtonBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Icon Button Hover Background/Color:</label>
        <SketchColorPicker
          name="iconButtonHoverColor"
          value={theme.iconButtonHoverColor}
          onChange={(color) => onChangeColor('iconButtonHoverColor', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Icon Button Selected Background:</label>
        <SketchColorPicker
          name="iconButtonSelectedBackground"
          value={theme.iconButtonSelectedBackground}
          onChange={(color) => onChangeColor('iconButtonSelectedBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Button Text Color:</label>
        <SketchColorPicker
          name="buttonTextColor"
          value={theme.buttonTextColor}
          onChange={(color) => onChangeColor('buttonTextColor', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Button Outlined:</label>
        <SketchColorPicker
          name="buttonOutlined"
          value={theme.buttonOutlined}
          onChange={(color) => onChangeColor('buttonOutlined', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Button Filled:</label>
        <SketchColorPicker
          name="buttonFilled"
          value={theme.buttonFilled}
          onChange={(color) => onChangeColor('buttonFilled', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Button Gradient:</label>
        <SketchColorPicker
          name="buttonGradientStart"
          value={theme.buttonGradientStart}
          onChange={(color) => onChangeColor('buttonGradientStart', color)}
        />
        <label>to</label>
        <SketchColorPicker
          name="buttonGradientEnd"
          value={theme.buttonGradientEnd}
          onChange={(color) => onChangeColor('buttonGradientEnd', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Scrollbar Thumb X-Axis Gradient:</label>
        <SketchColorPicker
          name="scrollbarThumbXAxisStart"
          value={theme.scrollbarThumbXAxisStart}
          onChange={(color) => onChangeColor('scrollbarThumbXAxisStart', color)}
        />
        <label>to</label>
        <SketchColorPicker
          name="scrollbarThumbXAxisEnd"
          value={theme.scrollbarThumbXAxisEnd}
          onChange={(color) => onChangeColor('scrollbarThumbXAxisEnd', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Scrollbar Thumb Y-Axis Gradient:</label>
        <SketchColorPicker
          name="scrollbarThumbYAxisStart"
          value={theme.scrollbarThumbYAxisStart}
          onChange={(color) => onChangeColor('scrollbarThumbYAxisStart', color)}
        />
        <label>to</label>
        <SketchColorPicker
          name="scrollbarThumbYAxisEnd"
          value={theme.scrollbarThumbYAxisEnd}
          onChange={(color) => onChangeColor('scrollbarThumbYAxisEnd', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Scrollbar Corner:</label>
        <SketchColorPicker
          name="scrollbarCorner"
          value={theme.scrollbarCorner}
          onChange={(color) => onChangeColor('scrollbarCorner', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Input Outline:</label>
        <SketchColorPicker
          name="inputOutline"
          value={theme.inputOutline}
          onChange={(color) => onChangeColor('inputOutline', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Input Background:</label>
        <SketchColorPicker
          name="inputBackground"
          value={theme.inputBackground}
          onChange={(color) => onChangeColor('inputBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Dropdown Menu Background:</label>
        <SketchColorPicker
          name="dropdownMenuBackground"
          value={theme.dropdownMenuBackground}
          onChange={(color) => onChangeColor('dropdownMenuBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Dropdown Menu Hover Background:</label>
        <SketchColorPicker
          name="dropdownMenuHoverBackground"
          value={theme.dropdownMenuHoverBackground}
          onChange={(color) => onChangeColor('dropdownMenuHoverBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Dropdown Menu Selected Background:</label>
        <SketchColorPicker
          name="dropdownMenuSelectedBackground"
          value={theme.dropdownMenuSelectedBackground}
          onChange={(color) => onChangeColor('dropdownMenuSelectedBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Drawer Background:</label>
        <SketchColorPicker
          name="drawerBackground"
          value={theme.drawerBackground}
          onChange={(color) => onChangeColor('drawerBackground', color)}
        />
      </Grid>
      <Grid item sm={12} md={6} className={styles.colorGridContainer}>
        <label>Popup Background:</label>
        <SketchColorPicker
          name="popupBackground"
          value={theme.popupBackground}
          onChange={(color) => onChangeColor('popupBackground', color)}
        />
      </Grid>
      <Divider variant="inset" component="div" className={styles.colorGridDivider} />
    </Grid>
  )
}

export default ColorSelectionArea
