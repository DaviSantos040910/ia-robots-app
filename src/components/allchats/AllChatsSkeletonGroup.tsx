
import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { SkeletonBlock } from '../../components/shared/Skeleton';
import { createAllChatsStyles, getTheme } from '../../screens/AllChats/AllChats.styles';
import { ListTokens } from '../../theme/list';

const SkeletonRow: React.FC = () => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: ListTokens.rowPaddingH, paddingVertical: ListTokens.rowPaddingV }}>
        <SkeletonBlock width={ListTokens.avatar} height={ListTokens.avatar} radius={ListTokens.avatar/2} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonBlock width={'60%'} height={16} radius={6} />
          <SkeletonBlock width={'90%'} height={12} radius={6} style={{ marginTop: 8 }} />
        </View>
      </View>
      <View style={s.divider} />
    </View>
  );
};

export const AllChatsSkeletonGroup: React.FC<{ count?: number }>= ({ count = 8 }) => {
  const scheme = useColorScheme();
  const t = getTheme(scheme === 'dark');
  const s = createAllChatsStyles(t);
  const items = Array.from({ length: count });
  return (
    <View style={s.skWrap}>
      <View style={s.skGroup}>
        {items.map((_, i) => (
          <View key={i}>
            <SkeletonRow />
          </View>
        ))}
      </View>
    </View>
  );
};
