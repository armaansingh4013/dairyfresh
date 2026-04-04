import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii } from "../theme";

export default function ActionButton({ children, tone = "primary", onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, tone === "ghost" ? styles.ghost : styles.primary]}
    >
      <Text style={[styles.label, tone === "ghost" ? styles.ghostLabel : styles.primaryLabel]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center"
  },
  primary: {
    backgroundColor: colors.accent
  },
  ghost: {
    backgroundColor: colors.surfaceMuted
  },
  label: {
    fontSize: 14,
    fontWeight: "800"
  },
  primaryLabel: {
    color: "#FFFFFF"
  },
  ghostLabel: {
    color: colors.ink
  }
});
