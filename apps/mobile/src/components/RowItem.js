import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function RowItem({ label, value, subtle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, subtle && styles.subtle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: colors.muted
  },
  value: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: "700",
    textAlign: "right"
  },
  subtle: {
    color: colors.muted,
    fontWeight: "600"
  }
});
