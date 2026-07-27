import { router } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>ShelfSync</Text>

        <Text style={styles.subtitle}>
          Mobile inventory and work-order management
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Sign in</Text>

        <Text style={styles.label}>Email</Text>

        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          secureTextEntry
        />

        <Pressable
          style={styles.button}
          onPress={() => router.replace("/dashboard")}
        >
          <Text style={styles.buttonText}>Sign in</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        ShelfSync mobile staff tools
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f4f6f8",
  },
  header: {
    marginBottom: 40,
  },
  logo: {
    fontSize: 38,
    fontWeight: "800",
    color: "#17324d",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 17,
    lineHeight: 24,
    color: "#5d6b78",
  },
  form: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  formTitle: {
    marginBottom: 24,
    fontSize: 26,
    fontWeight: "700",
    color: "#17212b",
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#344454",
  },
  input: {
    height: 52,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#cbd3da",
    borderRadius: 10,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: "#17324d",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  footer: {
    marginTop: 32,
    textAlign: "center",
    fontSize: 13,
    color: "#7c8994",
  },
});