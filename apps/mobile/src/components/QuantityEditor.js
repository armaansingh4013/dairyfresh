import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "../theme";

export default function QuantityEditor({ quantity, onDecrease, onIncrease, disabled }) {
  return (
    <View style={[styles.wrap, disabled && styles.wrapDisabled]}>
      <Pressable disabled={disabled} onPress={onDecrease} style={styles.button}>
        <Text style={styles.symbol}>-</Text>
      </Pressable>
      <Text style={styles.value}>{quantity.toFixed(1)} L</Text>
      <Pressable disabled={disabled} onPress={onIncrease} style={styles.button}>
        <Text style={styles.symbol}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    padding: 6
  },
  wrapDisabled: {
    opacity: 0.45
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  symbol: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink
  },
  value: {
    minWidth: 60,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink
  }
});
