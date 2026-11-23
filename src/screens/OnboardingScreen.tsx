import { useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon, { IconName } from '../components/Icon';
import { Button, Screen } from '../components/ui';
import { Palette, radius, spacing, typography } from '../theme';
import { useColors } from '../theme/useTheme';

type Page = { icon: IconName; title: string; body: string };

const PAGES: Page[] = [
  {
    icon: 'bluetooth',
    title: 'Một lần chạm.\nMột lần có mặt.',
    body: 'Chủ nhiệm mở phiên, bạn đến gần là được ghi nhận. Không còn chuyền danh sách giấy.',
  },
  {
    icon: 'qr',
    title: 'Bluetooth hoặc mã QR',
    body: 'Máy không bắt được Bluetooth? Quét mã QR trên máy chủ nhiệm để điểm danh ngay.',
  },
  {
    icon: 'wifi-off',
    title: 'Mất mạng vẫn điểm danh',
    body: 'Điểm danh được lưu trên máy và tự đồng bộ khi có mạng trở lại. Xem lại ở tab Lịch sử.',
  },
];

// Three-page intro shown once, before the first sign-in.
export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Width of the pager itself (not the window), so paging stays exact inside the screen padding.
  const [width, setWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const last = index === PAGES.length - 1;

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width > 0) setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = () => {
    if (last) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <Screen
      contentStyle={styles.content}
      footer={
        <>
          <Button title={last ? 'Bắt đầu' : 'Tiếp'} onPress={next} />
          {last ? null : <Button title="Bỏ qua" variant="ghost" onPress={onDone} />}
        </>
      }
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      >
        {PAGES.map((p) => (
          <View key={p.title} style={[styles.page, { width }]}>
            <View style={styles.iconWrap}>
              <Icon name={p.icon} size={56} color={colors.link} />
            </View>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots} accessibilityLabel={`Trang ${index + 1} trên ${PAGES.length}`}>
        {PAGES.map((p, i) => (
          <View key={p.title} style={[styles.dot, i === index ? styles.dotActive : null]} />
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    content: { flex: 1 },
    pager: { flex: 1 },
    page: { alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: spacing.md },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: { ...typography.display, color: colors.text, textAlign: 'center' },
    body: { ...typography.body, color: colors.muted, textAlign: 'center' },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingBottom: spacing.lg },
    dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.border },
    dotActive: { width: 24, backgroundColor: colors.primary },
  });
