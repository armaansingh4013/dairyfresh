import React from "react";
import { StyleSheet, Text, View } from "react-native";
import ActionButton from "../../components/ActionButton";
import Badge from "../../components/Badge";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import SectionHeader from "../../components/SectionHeader";
import { colors } from "../../theme";

export default function ProfileScreen({ profile, onLogout }) {
  return (
    <Screen>
      <SectionHeader
        eyebrow="Account"
        title={profile.name}
        caption="Profile, address, and delivery preferences stay separate from screen-level presentation logic."
      />

      <Card style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
        </View>
        <View style={styles.identityBody}>
          <Badge>{profile.plan}</Badge>
          <Text style={styles.phone}>{profile.phone}</Text>
          <Text style={styles.address}>{profile.address}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Delivery preferences</Text>
        <View style={styles.preferenceList}>
          {profile.preferences.map((item) => (
            <View key={item} style={styles.preferenceRow}>
              <Text style={styles.preferenceBullet}>•</Text>
              <Text style={styles.preferenceText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Suggested next backend hooks</Text>
        <View style={styles.preferenceList}>
          <Text style={styles.preferenceText}>Wire products and invoices to the existing API workspaces.</Text>
          <Text style={styles.preferenceText}>Replace mock plan state with authenticated customer subscriptions.</Text>
          <Text style={styles.preferenceText}>Add notifications for route delays and payment reminders.</Text>
        </View>
      </Card>

      {onLogout ? <ActionButton tone="ghost" onPress={onLogout}>Logout</ActionButton> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identityCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center"
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentSoft
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.accentStrong
  },
  identityBody: {
    flex: 1,
    gap: 8
  },
  phone: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink
  },
  address: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 14
  },
  preferenceList: {
    gap: 12
  },
  preferenceRow: {
    flexDirection: "row",
    gap: 8
  },
  preferenceBullet: {
    fontSize: 14,
    color: colors.accentStrong,
    fontWeight: "900"
  },
  preferenceText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.muted
  }
});
