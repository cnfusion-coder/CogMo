export const themeCatalog = [
  {
    value: 'high-contrast',
    labelKey: '900.themeHighContrast',
    label: 'High Contrast（高对比度）',
    descriptionKey: '900.themeHighContrastDesc',
    description: '为视力障碍用户设计，提供极高的颜色对比度',
    useDark: true
  },
  {
    value: 'dim',
    labelKey: '900.themeDim',
    label: 'Dim/Semi-dark（半暗模式）',
    descriptionKey: '900.themeDimDesc',
    description: '介于浅色和深色之间，背景为深灰而非纯黑',
    useDark: true
  },
  {
    value: 'sepia',
    labelKey: '900.themeSepia',
    label: 'Sepia/Reading（棕褐色/阅读模式）',
    descriptionKey: '900.themeSepiaDesc',
    description: '模拟纸张质感，适合长时间阅读',
    useDark: false
  },
  {
    value: 'colorblind',
    labelKey: '900.themeColorblind',
    label: 'Colorblind（色盲友好模式）',
    descriptionKey: '900.themeColorblindDesc',
    description: '为色盲用户优化的配色方案',
    useDark: false
  }
];

export const defaultTheme = 'dim';

export function getThemeByValue(value) {
  return themeCatalog.find((theme) => theme.value === value);
}
