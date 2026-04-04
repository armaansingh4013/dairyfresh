import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Card from "../../components/Card";
import Screen from "../../components/Screen";
import { colors, radii } from "../../theme";

export default function LoginScreen({
  phone,
  otp,
  status,
  otpRequested,
  loading,
  onChangePhone,
  onChangeOtp,
  onRequestOtp,
  onLogin
}) {
  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.kicker}>Mobile Login</Text>
        <Text style={styles.title}>Sign in with the same OTP flow as the web app.</Text>
        <Text style={styles.copy}>
          Demo mode uses OTP `1111`. Set `EXPO_PUBLIC_API_URL` if the API is not
          running on the same host as Expo.
        </Text>
      </Card>

      <Card>
        <View style={styles.form}>
          <Field label="Phone" value={phone} onChangeText={onChangePhone} />
          <Pressable style={[styles.button, styles.ghostButton]} onPress={onRequestOtp}>
            <Text style={styles.ghostButtonLabel}>
              {otpRequested ? "Resend OTP" : "Send OTP"}
            </Text>
          </Pressable>
          <Field label="OTP" value={otp} onChangeText={onChangeOtp} />
          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
            onPress={onLogin}
          >
            <Text style={styles.buttonLabel}>{loading ? "Signing in..." : "Login"}</Text>
          </Pressable>
          {status ? <Text style={styles.status}>{status}</Text> : null}
        </View>
      </Card>
    </Screen>
  );
}

function Field({ label, value, onChangeText }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.accentStrong
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.ink
  },
  copy: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted
  },
  form: {
    gap: 14
  },
  field: {
    gap: 6
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.surface
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.accent
  },
  buttonDisabled: {
    opacity: 0.65
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800"
  },
  ghostButton: {
    backgroundColor: colors.surfaceMuted
  },
  ghostButtonLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800"
  },
  status: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  }
});
