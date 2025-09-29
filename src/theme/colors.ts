// src/theme/colors.ts
// colors.ts - Figma color palette
export const Colors = {
  semantic: {
    error: {
      normal: '#DC2626',
      light: '#FEE2E2',
      dark: '#B91C1C',
    },
    success: {
      normal: '#059669',
      light: '#D1FAE5',
      dark: '#047857',
    },
    warning: {
      normal: '#D97706',
      light: '#FEF3C7',
      dark: '#B45309',
    },
    info: {
      normal: '#2563EB',
      light: '#DBEAFE',
      dark: '#1D4ED8',
    },
  },
  brand: {
    light: {
      normal: '#7C57FF',
      surface: '#E5E5FF',
      background: '#FFFFFF',
      light: '#44466A',
      // AJUSTE: Adicionada a cor 'dark' para o gradiente.
      dark: '#5D3FD3', // A slightly darker purple for the gradient end.
    },
    dark: {
      normal: '#7C57FF',
      surface: '#7572AC',
      light: '#44466A',
      // AJUSTE: Adicionada a cor 'dark' para o gradiente.
      dark: '#6A4DFF', // A slightly lighter purple for the gradient end in dark mode.
    },
  },
  secondary: {
    light: {
      normal1: '#00C9FF',
      normal2: '#00D1FF',
      background: '#AEFFF9',
    },
    dark: {
      normal1: '#00C9FF',
      normal2: '#00D1FF',
      background: '#00959F',
    },
  },
  // ... remaining colors
  noEmotion: {
    light: [
      '#ECF3FE',
      '#D0E0FE',
      '#B4CAFA',
      '#447CCD',
      '#1566DA',
      '#1258F7',
    ],
    dark: [
      '#203EDA',
      '#E14DFF',
      '#F95509',
      '#F97010',
      '#F96C16',
      '#D84523',
    ],
  },
  danger: {
    light: [
      '#FDF2F2',
      '#FDDADA',
      '#FB8089',
      '#F87010',
      '#F96C16',
      '#D84523',
    ],
    dark: [
      '#563330',
      '#803635',
      '#B14347',
      '#DB404A',
      '#F70005',
      '#FFA198',
    ],
  },
  success: {
    light: [
      '#F7FAF8',
      '#DDEEEB',
      '#B7E8CE',
      '#60CD8A',
      '#42BB68',
      '#34A472',
    ],
    dark: [
      '#34A447',
      '#34AE65',
      '#26B690',
      '#45AA77',
      '#65BB62',
    ],
  },
  warning: {
    light: [
      '#FFFBE',
      '#FFEBCS',
      '#FFDFAA',
      '#FB8000',
      '#FB8000',
      '#EB9000',
    ],
    dark: [
      '#543529',
      '#805027',
      '#BF6210',
      '#DB704A',
      '#EA8517',
      '#FAC520',
    ],
  },
};