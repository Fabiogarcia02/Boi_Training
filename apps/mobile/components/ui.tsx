import { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: PropsWithChildren) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Muted({ children }: PropsWithChildren) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.ink} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant !== 'primary' && styles.buttonTextDark,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      accessibilityRole="text"
      style={[styles.input, props.style]}
    />
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Badge({ text, tone = 'red' }: { text: string; tone?: 'red' | 'neutral' }) {
  return (
    <View style={[styles.badge, tone === 'neutral' && styles.badgeNeutral]}>
      <Text style={[styles.badgeText, tone === 'neutral' && styles.badgeTextNeutral]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
    fontFamily: typography.display,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 22,
    fontFamily: typography.body,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontFamily: typography.body,
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.body,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.red,
    borderRadius: radius.sm,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonSecondary: {
    backgroundColor: colors.black,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: typography.body,
  },
  buttonTextDark: {
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    fontFamily: typography.body,
    minHeight: 52,
    minWidth: 0,
    flexShrink: 1,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: colors.muted,
  },
  badge: {
    backgroundColor: colors.redSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeNeutral: {
    backgroundColor: '#F0EEEA',
  },
  badgeText: {
    color: colors.red,
    fontWeight: '700',
    fontSize: 12,
  },
  badgeTextNeutral: {
    color: colors.muted,
  },
});
