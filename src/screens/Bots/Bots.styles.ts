// src/screens/Bots/Bots.styles.ts
import { StyleSheet } from 'react-native';
// We can reuse the ChatList theme as it's very similar
import { getTheme, ChatListTheme } from '../ChatList/ChatList.styles';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { ListTokens } from '../../theme/list';

export const createBotsScreenStyles = (t: ChatListTheme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: t.background },
  listContentContainer: {
    paddingBottom: 100,
  },
  // We reuse many styles from ChatList, but can add specific ones if needed
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing['spacing-group-s'], 
    paddingVertical: 12 
  },
  avatar: { 
    width: ListTokens.avatar, 
    height: ListTokens.avatar, 
    borderRadius: ListTokens.avatar / 2, 
    backgroundColor: t.surfaceAlt, 
    marginRight: 14 
  },
  body: { flex: 1 },
  title: { 
    ...Typography.titleSemiBold.medium, 
    color: t.textPrimary, 
  },
  description: { 
    ...Typography.bodyRegular.medium, 
    color: t.textSecondary, 
    marginTop: 2 
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.border,
    marginLeft: Spacing['spacing-group-s'] + ListTokens.avatar + 14,
  },
  emptyWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingHorizontal: Spacing['spacing-group-m'],
    marginTop: 60,
  },
  emptyIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: t.surfaceAlt, 
    marginBottom: 16 
  },
  emptyTitle: { 
    ...Typography.titleSemiBold.medium, 
    color: t.textPrimary,
    marginBottom: 6,
  },
  emptyDesc: { 
    ...Typography.bodyRegular.medium, 
    color: t.textSecondary, 
    textAlign: 'center' 
  },
});