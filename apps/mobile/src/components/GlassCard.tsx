import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { palette, radius } from '../theme';

type Props = ViewProps & { padded?: boolean };

export function GlassCard({ children, style, padded = true, ...rest }: Props) {
  return (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: palette.cardFill,
    borderWidth: 1,
    borderColor: palette.cardBorder,
    overflow: 'hidden',
  },
  padded: { padding: 16 },
});
