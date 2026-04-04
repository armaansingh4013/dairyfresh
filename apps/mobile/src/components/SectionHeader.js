import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export default function SectionHeader({ eyebrow, title, caption }) {
  return (
    <View style={styles.wrap}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.ink
  },
  caption: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  }
});
