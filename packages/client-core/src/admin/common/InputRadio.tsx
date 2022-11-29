import React from 'react'

import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import { SxProps, Theme } from '@mui/material/styles'

import styles from '../styles/admin.module.scss'
import { InputMenuItem } from './InputSelect'

interface Props {
  className?: string
  name?: string
  label?: string
  value?: unknown
  options: InputMenuItem[]
  error?: string
  disabled?: boolean
  sx?: SxProps<Theme>
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  Component?: any
}

const InputRadio = ({ className, name, label, value, options, error, disabled, sx, onChange, Component }: Props) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', mb: 2, ...sx }}>
      <FormControl
        className={className ?? styles.radioField}
        error={error ? true : false}
        disabled={disabled}
        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
      >
        <FormLabel sx={{ mt: 0.5, mr: 5 }}>{label}</FormLabel>
        <RadioGroup name={name} value={value} onChange={onChange} row>
          {options.map((el, index) => (
            <>
              <FormControlLabel key={index} value={el.value} control={<Radio />} label={el.label} />
              {Component && <Component el={el} index={index} />}
            </>
          ))}
        </RadioGroup>
      </FormControl>

      {error && (
        <FormControl error>
          <FormHelperText>{error}</FormHelperText>
        </FormControl>
      )}
    </Box>
  )
}

export default InputRadio
