import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import LottieView from 'lottie-react-native'; // Import LottieView
import loaderAnimation from '../assets/transaction_loader.json'; // Import your Lottie JSON file for loader
import successAnimation from '../assets/payment.json'; // Import your Lottie JSON file for success

export default function TokenAmount({ route, navigation }) {
  const { data, fromAccount, toAccount, selectedToken, selectedNetwork } = route.params;
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0); // Example balance, replace with actual balance logic
  const [gasFee, setGasFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingGasFee, setFetchingGasFee] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const tickOpacity = useState(new Animated.Value(0))[0];
  const adminWalletAddress = '0x41956fdADAe085BCABF9a1e085EE5c246Eb82b44';

  console.log("selectedNetwork ==== ", selectedNetwork);

  const decryptPrivateKey = (encryptedPrivateKey) => {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, 'your-secret-key');
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  useEffect(() => {
    const fetchBalanceData = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          selectedNetwork?.networkurl,
        );
        const encryptedPrivateKey = data?.encryptedPrivateKey || fromAccount?.encryptedPrivateKey;
        if (!encryptedPrivateKey) {
          throw new Error('Private key not found');
        }
        const privateKey = decryptPrivateKey(encryptedPrivateKey);
        const wallet = new ethers.Wallet(privateKey, provider);
        const balanceInWei = await wallet.getBalance();
        const balanceInEth = ethers.utils.formatEther(balanceInWei);
        console.log('balanceInWei', balanceInWei);
        console.log('balanceInEth', balanceInEth);
        setBalance(parseFloat(balanceInEth));
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch balance');
        console.error('errorhd', error);
      }
    };

    fetchBalanceData();
  }, [data, fromAccount]);

  useEffect(() => {
    let gasFeeInterval;
    if (amount) {
      fetchGasFee();
      gasFeeInterval = setInterval(fetchGasFee, 6000); // Fetch gas fee every 15 seconds
    } else {
      setGasFee(null);
    }
    return () => clearInterval(gasFeeInterval); // Clear interval when component unmounts or amount changes
  }, [amount]);

  const fetchGasFee = async () => {
    setFetchingGasFee(true);
    try {
      const provider = new ethers.providers.JsonRpcProvider(
        selectedNetwork?.networkurl,
      );
      const gasPrice = await provider.getGasPrice();
      const gasLimit = ethers.utils.hexlify(21000); // Standard gas limit for ETH transfer
      const gasFees = gasPrice.mul(gasLimit);
      setGasFee(ethers.utils.formatEther(gasFees));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gas fee');
    } finally {
      setFetchingGasFee(false);
    }
  };

  const handleNext = async () => {
    const amountNum = parseFloat(amount);
    if (balance < amountNum) {
      Alert.alert(
        "Insufficient Balance",
          "You do not have enough Native Token in your account to pay for transaction fees on Your network. Deposit Native Token from another account."
      );
      return;
    }
    setLoading(true); // Start loading
    try {
      // Connect to Sepolia network using ethers.js
      const provider = new ethers.providers.JsonRpcProvider(
        selectedNetwork.networkurl,
      );
      const encryptedPrivateKey = data?.encryptedPrivateKey || fromAccount?.encryptedPrivateKey;
      const privateKey = decryptPrivateKey(encryptedPrivateKey);
      const wallet = new ethers.Wallet(privateKey, provider);
      const gasPrice = await provider.getGasPrice();
      const gasLimit = ethers.utils.hexlify(21000); // Standard gas limit for ETH transfer
      const gasFees = gasPrice.mul(gasLimit);
      const amountInWei = ethers.utils.parseEther(amount);
      
      // Calculate recipientAmount as 99.75% and adminAmount as 0.25%
      const recipientAmount = amountInWei.mul(9975).div(10000); // 99.75%
      const adminAmount = amountInWei.sub(recipientAmount); // 0.25%
      
      // Log the amounts to verify the calculations
      console.log("Recipient Amount (in Wei):", recipientAmount.toString());
      console.log("Admin Amount (in Wei):", adminAmount.toString());
      
      console.log('privateKey === ',privateKey)
      console.log('encryptedPrivateKey ==== ',encryptedPrivateKey)
      console.log('wallet === ',wallet)

      const tx1 = {
        to: toAccount.address,
        value: recipientAmount,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
      };
      const tx2 = {
        to: adminWalletAddress,
        value: adminAmount,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
      };
      const txResponse1 = await wallet.sendTransaction(tx1);
      const txResponse2 = await wallet.sendTransaction(tx2);
      const txReceipt1 = await txResponse1.wait();
      const txReceipt2 = await txResponse2.wait();

      // Show success animation
      setShowSuccess(true);
      Animated.timing(tickOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('MainPage');
        }, 2000); // Show the success animation for 1 second before navigating
      });

    } catch (error) {
      Alert.alert('Transaction Failed', error.message);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        placeholderTextColor="#ABAFC4"
        onChangeText={text => setAmount(text)}
        value={amount}
        keyboardType="numeric"
      />
      {fetchingGasFee ? (
        <ActivityIndicator size="small" color="#FEBF32" />
      ) : (
        <Text style={styles.gasFeeText}>
          Gas Fee: {gasFee ? `${gasFee} ETH` : 'N/A'}
        </Text>
      )}
      {loading ? (
        <LottieView // Use LottieView when loading
          source={loaderAnimation}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      ) : (
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Send</Text>
        </TouchableOpacity>
      )}
      {showSuccess && (
        <LottieView
          source={successAnimation}
          autoPlay
          loop={false}
          style={styles.successAnimation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17171A',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: '#FFF',
    fontFamily: 'Poppins',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    width: 327,
    height: 64,
    borderWidth: 1,
    borderColor: '#2A2D3C',
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
    color: '#FEBF32',
    fontFamily: 'Poppins',
    fontSize: 40,
    fontWeight: '300',
    lineHeight: 56,
  },
  gasFeeText: {
    color: '#FFF',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 20,
  },
  nextButton: {
    width: 327,
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FEBF32',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  nextButtonText: {
    color: '#000',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  successAnimation: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: '80%',
    left: '57%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});

