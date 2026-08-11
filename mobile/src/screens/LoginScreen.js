import React, { useContext, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp } = useContext(AuthContext);

  const handleLogin = async () => {
    try {
      const response = await signIn(email, password);
      if (response.token) {
        navigation.replace('Home');
      } else {
        Alert.alert('Login failed', response.message || 'Try again');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSignup = async () => {
    try {
      const response = await signUp('Mobile User', email, password);
      if (response.token) {
        navigation.replace('Home');
      } else {
        Alert.alert('Signup failed', response.message || 'Try again');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login / Signup</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
      <View style={{ height: 12 }} />
      <Button title="Sign Up" onPress={handleSignup} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12 },
});
