import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export default function ActionButton({
  children,
  tone = "primary",
  onPress,
  disabled = false,
  loading = false,
  loadingLabel
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        tone === "ghost" ? styles.ghost : styles.primary,
        isDisabled && styles.disabled
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={tone === "ghost" ? colors.ink : "#FFFFFF"}
          />
        ) : null}
        <Text style={[styles.label, tone === "ghost" ? styles.ghostLabel : styles.primaryLabel]}>
          {loading ? loadingLabel || children : children}
        </Text>
      </View>
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
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  primary: {
    backgroundColor: colors.accent
  },
  ghost: {
    backgroundColor: colors.surfaceMuted
  },
  disabled: {
    opacity: 0.65
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
