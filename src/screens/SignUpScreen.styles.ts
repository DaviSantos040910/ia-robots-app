import { StyleSheet } from 'react-native';
import { Spacing } from '../theme/spacing';
import { Colors } from '../theme/colors';
import { NeutralColors } from '../theme/neutralColors';
import { Typography } from '../theme/typography';
import { Radius } from '../theme/radius';

export const INPUT_HEIGHT = 50;
export const BUTTON_HEIGHT = 50;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeutralColors.neutral.light.white1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollView: {
    padding: Spacing['spacing-group-m'],
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Radius.circle,
    marginBottom: Spacing['spacing-element-l'],
  },
  title: {
    fontFamily: Typography.titleSemiBold.extraLarge.fontFamily,
    fontSize: Typography.titleSemiBold.extraLarge.fontSize,
    lineHeight: Typography.titleSemiBold.extraLarge.lineHeight,
    color: NeutralColors.fontAndIcon.light.primary,
    textAlign: 'center',
    marginBottom: Spacing['spacing-element-s'],
  },
  subtitle: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
    textAlign: 'center',
    marginBottom: Spacing['spacing-group-m'],
  },
  formGroup: {
    width: '100%',
    marginBottom: Spacing['spacing-element-m'],
  },
  input: {
    width: '100%',
    height: INPUT_HEIGHT,
    backgroundColor: NeutralColors.neutral.light.gray1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing['spacing-element-m'],
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Colors.semantic.error.normal,
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    paddingRight: 60, // Space for the toggle button
  },
  visibilityToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: INPUT_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: Spacing['spacing-element-m'],
  },
  visibilityToggleText: {
    color: Colors.brand.light.normal,
    fontFamily: Typography.bodySemiBold.small.fontFamily,
    fontSize: Typography.bodySemiBold.small.fontSize,
    lineHeight: Typography.bodySemiBold.small.lineHeight,
  },
  errorText: {
    color: Colors.semantic.error.normal,
    fontFamily: Typography.bodyRegular.small.fontFamily,
    fontSize: Typography.bodyRegular.small.fontSize,
    lineHeight: Typography.bodyRegular.small.lineHeight,
    marginTop: Spacing['spacing-element-xxs'],
    marginLeft: Spacing['spacing-element-xs'],
  },
  button: {
    width: '100%',
    height: BUTTON_HEIGHT,
    backgroundColor: Colors.brand.light.normal,
    borderRadius: Radius.large,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['spacing-element-m'],
    marginBottom: Spacing['spacing-element-m'],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: NeutralColors.neutral.light.white1,
    fontFamily: Typography.titleSemiBold.medium.fontFamily,
    fontSize: Typography.titleSemiBold.medium.fontSize,
    lineHeight: Typography.titleSemiBold.medium.lineHeight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['spacing-element-m'],
  },
  footerText: {
    fontFamily: Typography.bodyRegular.small.fontFamily,
    fontSize: Typography.bodyRegular.small.fontSize,
    lineHeight: Typography.bodyRegular.small.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
  },
  footerLink: {
    fontFamily: Typography.bodySemiBold.small.fontFamily,
    fontSize: Typography.bodySemiBold.small.fontSize,
    lineHeight: Typography.bodySemiBold.small.lineHeight,
    color: Colors.brand.light.normal,
  },
});
