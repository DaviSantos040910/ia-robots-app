// src/screens/ArchivedChats/ArchivedChats.styles.ts
import { StyleSheet } from 'react-native';
import { getTheme, ChatListTheme } from '../ChatList/ChatList.styles';
import { Spacing } from '../../theme/spacing';
import { Typography } from '../../theme/typography';
import { Radius } from '../../theme/radius';

export const createArchivedChatsStyles = (t: ChatListTheme) => StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: t.background 
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['spacing-element-m'],
    height: 56,
    backgroundColor: t.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: t.border,
  },
  backButton: {
    padding: Spacing['spacing-element-s'],
  },
  headerTitle: {
    ...Typography.titleSemiBold.large,
    color: t.textPrimary,
    fontSize: 18,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1, // Ensure title is behind the button
  },
  
  // List styles
  listContentContainer: {
    padding: Spacing['spacing-group-s'],
  },
  
  // List item styles
  row: {
    backgroundColor: t.surface,
    paddingHorizontal: Spacing['spacing-group-s'],
    paddingVertical: Spacing['spacing-element-l-2'],
    borderRadius: Radius.large,
    marginBottom: Spacing['spacing-element-m'],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: {
    ...Typography.bodySemiBold.medium,
    color: t.textPrimary,
  },
  rowIcon: {
    color: t.textSecondary,
  },
  
  // Empty state styles
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['spacing-group-m'],
  },
  emptyText: {
    ...Typography.bodyRegular.medium,
    color: t.textSecondary,
    textAlign: 'center',
  },
});