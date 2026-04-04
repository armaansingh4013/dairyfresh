import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export default function MetricCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: 14,
    gap: 6
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink
  },
  label: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    fontWeight: "600"
  }
});
