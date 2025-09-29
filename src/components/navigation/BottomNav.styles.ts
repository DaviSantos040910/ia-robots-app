// src/components/navigation/BottomNav.styles.ts
import { StyleSheet } from 'react-native';
import { getTheme as getAllChatsTheme, AllChatsTheme } from '../../screens/AllChats/AllChats.styles';
import { Typography } from '../../theme/typography';
import { Elevation } from '../../theme/elevation';
// CORREÇÃO: Adicionada a importação do objeto `Colors`
import { Colors } from '../../theme/colors';

export const createBottomNavStyles = (t: AllChatsTheme) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 68,
    backgroundColor: t.surface,
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: t.border,
    ...Elevation.s, // Applying a subtle shadow from the theme
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    color: t.textSecondary,
  },
  iconActive: {
    color: t.brand.normal,
  },
  label: {
    ...Typography.bodyRegular.small,
    fontSize: 11,
    color: t.textSecondary,
    marginTop: 4,
  },
  labelActive: {
    color: t.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.semantic.error.normal,
    borderWidth: 1,
    borderColor: t.surface,
  },
});