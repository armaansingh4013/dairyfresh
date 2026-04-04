import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

const toneStyles = {
  default: {
    backgroundColor: colors.surfaceMuted,
    color: colors.ink
  },
  success: {
    backgroundColor: colors.successSoft,
    color: colors.success
  },
  warning: {
    backgroundColor: colors.warningSoft,
    color: colors.warning
  }
};

export default function Badge({ children, tone = "default" }) {
  const palette = toneStyles[tone] || toneStyles.default;

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.label, { color: palette.color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  }
});
