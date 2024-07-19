import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import CheckBox from '@react-native-community/checkbox';
import { useNavigation } from '@react-navigation/native';
import RNSecureStorage, { ACCESSIBLE } from 'rn-secure-storage';
import CryptoJS from 'crypto-js';
import TouchID from 'react-native-touch-id';

export default function SetupScreen() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChecked, setChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [activeStep, setActiveStep] = useState('password'); // To switch between views
  const navigation = useNavigation();

  const ENCRYPTION_KEY = 'your-encryption-key'; // Replace with your own encryption key

  useEffect(() => {
    const getPassword = async () => {
      try {
        const encryptedPassword = await RNSecureStorage.getItem('newPassword');
        if (encryptedPassword) {
          const decryptedPassword = CryptoJS.AES.decrypt(encryptedPassword, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
          console.log("Decrypted Password:", decryptedPassword);
          setActiveStep('fingerprint');
        }
      } catch (error) {
        console.error('Failed to get saved password:', error);
      }
    };
    getPassword();
  }, []);

  const handleCreatePassword = async () => {
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword && !isChecked) {
      Alert.alert(
        'Error',
        'Passwords do not match and checkbox is not checked.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    if (!isChecked) {
      Alert.alert('Error', 'Checkbox is not checked.');
      return;
    }

    try {
      const encryptedPassword = CryptoJS.AES.encrypt(newPassword, ENCRYPTION_KEY).toString();
      await RNSecureStorage.setItem('newPassword', encryptedPassword, {
        accessible: ACCESSIBLE.WHEN_UNLOCKED,
      });

      Alert.alert('Success', 'Password has been created.');
      console.log('Password saved:', encryptedPassword);
      setActiveStep('fingerprint'); // Switch to fingerprint setup
    } catch (error) {
      console.error('Failed to save the password:', error);
      Alert.alert('Error', 'Failed to save the password.');
    }
  };

  const setupFingerprint = async () => {
    try {
      await TouchID.authenticate('Scan your fingerprint to complete setup');
      await RNSecureStorage.setItem('userFingerprint', 'true');
      Alert.alert('Success', 'Fingerprint setup complete!');
      navigation.replace('ViewSeedPhrase');
    } catch (error) {
      Alert.alert('Error', 'Fingerprint authentication failed. Please try again.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleCPasswordVisibility = () => {
    setShowCPassword(!showCPassword);
  };

  return (
    <View style={styles.container}>
      {activeStep === 'password' ? (
        <>
              secureTextEntry={!showPassword}
              maxLength={20}
            />
            <TouchableOpacity onPress={togglePasswordVisibility}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showCPassword}
              maxLength={20}
            />
            <TouchableOpacity onPress={toggleCPasswordVisibility}>
              <Feather name={showCPassword ? "eye" : "eye-off"} size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.checkboxContainer}>
            <CheckBox
              value={isChecked}
              onValueChange={setChecked}
              tintColors={{ true: '#FFF', false: '#FFF' }}
            />
            <Text style={styles.checkboxText}>I agree to the terms and conditions</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleCreatePassword}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.header}>Set up your Fingerprint</Text>
          <TouchableOpacity style={styles.button} onPress={setupFingerprint}>
            <Text style={styles.buttonText}>Scan Fingerprint</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.replace('ViewSeedPhrase')}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17171A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222531',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 10,
    width: '80%',
  },
  input: {
    flex: 1,
    color: '#FFF',
    paddingVertical: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  checkboxText: {
    color: '#FFF',
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#FEBF32',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
