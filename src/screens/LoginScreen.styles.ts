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

  // legacy (kept for compatibility if referenced elsewhere)
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
  },
  subtitle: {
    fontFamily: Typography.titleSemiBold.medium.fontFamily,
    fontSize: Typography.titleSemiBold.medium.fontSize,
    lineHeight: Typography.titleSemiBold.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
    textAlign: 'center',
  },
  description: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.placeholder,
    marginBottom: Spacing['spacing-element-l'],
    textAlign: 'center',
  },

  formGroup: {
    width: '100%',
    marginBottom: Spacing['spacing-element-m'],
  },

  // Inputs remain with background as requested
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

  // Primary sign-in button
  signInButton: {
    width: '100%',
    height: BUTTON_HEIGHT,
    backgroundColor: Colors.brand.light.normal,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['spacing-element-m'],
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInText: {
    fontFamily: Typography.titleSemiBold.medium.fontFamily,
    fontSize: Typography.titleSemiBold.medium.fontSize,
    lineHeight: Typography.titleSemiBold.medium.lineHeight,
    color: NeutralColors.neutral.light.white1,
  },

  // Social buttons
  altButton: {
    width: '100%',
    height: BUTTON_HEIGHT,
    backgroundColor: NeutralColors.neutral.light.white1,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: NeutralColors.neutral.light.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['spacing-element-m'],
    flexDirection: 'row',
  },
  altIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing['spacing-element-m'],
    resizeMode: 'contain',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  googleIcon: {
    // keep original colors (no tint)
  },
  googleButtonText: {
    color: '#fff',
  },
  appleButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  appleIcon: {
    tintColor: '#fff',
  },
  appleButtonText: {
    color: '#fff',
  },
  altButtonText: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
  },

  // Inline "Forgot your password?" below password
  forgotInlineButton: {
    alignSelf: 'flex-end',
    marginTop: Spacing['spacing-element-s'],
  },
  // Sign Up Link
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing['spacing-element-m'],
    marginBottom: Spacing['spacing-element-m'],
  },
  signupText: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
  },
  signupLink: {
    fontFamily: Typography.bodySemiBold.medium.fontFamily,
    fontSize: Typography.bodySemiBold.medium.fontSize,
    lineHeight: Typography.bodySemiBold.medium.lineHeight,
    color: Colors.brand.light.normal,
    marginLeft: Spacing['spacing-element-xs'],
  },

  forgotInlineText: {
    color: Colors.brand.light.normal,
    fontFamily: Typography.bodySemiBold.small.fontFamily,
    fontSize: Typography.bodySemiBold.small.fontSize,
    lineHeight: Typography.bodySemiBold.small.lineHeight,
    textDecorationLine: 'none',
  },

  // New "Create an account" where the old forgot link was
  createAccountButton: {
    marginTop: Spacing['spacing-element-s'],
    marginBottom: Spacing['spacing-element-l'],
    alignSelf: 'center',
  },
  createAccountText: {
    color: Colors.brand.light.normal,
    fontFamily: Typography.bodySemiBold.medium.fontFamily,
    fontSize: Typography.bodySemiBold.medium.fontSize,
    lineHeight: Typography.bodySemiBold.medium.lineHeight,
    textDecorationLine: 'none',
  },

  // Disclaimer + links
  disclaimer: {
    fontFamily: Typography.bodyRegular.small.fontFamily,
    fontSize: Typography.bodyRegular.small.fontSize,
    lineHeight: Typography.bodyRegular.small.lineHeight,
    color: NeutralColors.fontAndIcon.light.placeholder,
    textAlign: 'center',
    marginTop: Spacing['spacing-element-l'],
  },
  link: {
    color: Colors.brand.light.normal,
    textDecorationLine: 'underline',
  },

  // Layout utilities (responsive)
  contentSplit: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pagePadding: {
    paddingHorizontal: Spacing['spacing-group-m'],
  },
  headerCenter: {
    alignItems: 'center',
  },
});
