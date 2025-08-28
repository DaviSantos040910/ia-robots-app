
import { StyleSheet } from 'react-native';
import { Spacing } from '../theme/spacing';
import { Colors } from '../theme/colors';
import { NeutralColors } from '../theme/neutralColors';
import { Typography } from '../theme/typography';
import { Radius } from '../theme/radius';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NeutralColors.neutral.light.white1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['spacing-group-m'],
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
  },
  subtitle: {
    fontFamily: Typography.titleSemiBold.medium.fontFamily,
    fontSize: Typography.titleSemiBold.medium.fontSize,
    lineHeight: Typography.titleSemiBold.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
  },
  description: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.placeholder,
    marginBottom: Spacing['spacing-element-l'],
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: NeutralColors.neutral.light.gray1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing['spacing-element-m'],
    marginBottom: Spacing['spacing-element-m'],
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.primary,
  },
  signInButton: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.brand.light.normal,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['spacing-element-m'],
  },
  signInText: {
    fontFamily: Typography.titleSemiBold.medium.fontFamily,
    fontSize: Typography.titleSemiBold.medium.fontSize,
    lineHeight: Typography.titleSemiBold.medium.lineHeight,
    color: NeutralColors.neutral.light.white1,
  },
  altButton: {
    width: '100%',
    height: 50,
    backgroundColor: NeutralColors.neutral.light.white1,
    borderRadius: Radius.large,
    borderWidth: 1,
    borderColor: NeutralColors.neutral.light.gray4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['spacing-element-m'],
  },
  altButtonText: {
    fontFamily: Typography.bodyRegular.medium.fontFamily,
    fontSize: Typography.bodyRegular.medium.fontSize,
    lineHeight: Typography.bodyRegular.medium.lineHeight,
    color: NeutralColors.fontAndIcon.light.secondary,
  },
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
});
