import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator, Animated } from 'react-native';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';
import LottieView from 'lottie-react-native'; // Import LottieView
import loaderAnimation from '../assets/transaction_loader.json'; // Import your Lottie JSON file for loader
import successAnimation from '../assets/payment.json'; // Import your Lottie JSON file for success

export default function TransferToken({ route, navigation }) {
  const { fromAccount, toAccount, tokenAddress, selectedNetwork } = route.params;
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0.00'); // Initialize balance as a string with two decimal places
  const [gasFee, setGasFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingGasFee, setFetchingGasFee] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const tickOpacity = useState(new Animated.Value(0))[0];

  const selectedToken = {
    tokenAddress,
    abi: [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [{ "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "name": "", "type": "string" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "name": "", "type": "uint8" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "", "type": "uint256" }],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          { "name": "_to", "type": "address" },
          { "name": "_value", "type": "uint256" }
        ],
        "name": "transfer",
        "outputs": [{ "name": "", "type": "bool" }],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ]
  };

  const adminWalletAddress = "0x41956fdADAe085BCABF9a1e085EE5c246Eb82b44";

  const decryptPrivateKey = (encryptedPrivateKey) => {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, 'your-secret-key');
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.networkurl);
        const decryptedPrivateKey = decryptPrivateKey(fromAccount.encryptedPrivateKey);
        const wallet = new ethers.Wallet(decryptedPrivateKey, provider);
        const balanceInWei = await wallet.getBalance();
        const balanceInEth = ethers.utils.formatEther(balanceInWei);
        setBalance(parseFloat(balanceInEth).toFixed(2)); // Format to 2 decimal places
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch balance');
      }
    };
    fetchBalance();
  }, [fromAccount]);

  useEffect(() => {
    let gasFeeInterval;
    if (amount) {
      fetchGasFee();
      gasFeeInterval = setInterval(fetchGasFee, 5000); // Fetch gas fee every 5 seconds
    } else {
      setGasFee(null);
    }
    return () => clearInterval(gasFeeInterval);
  }, [amount]);

  const fetchGasFee = async () => {
    setFetchingGasFee(true);
    try {
      const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.networkurl);
      const decryptedPrivateKey = decryptPrivateKey(fromAccount.encryptedPrivateKey);
      const wallet = new ethers.Wallet(decryptedPrivateKey, provider);
      const tokenContract = new ethers.Contract(selectedToken.tokenAddress, selectedToken.abi, provider);
      const tokenWithSigner = tokenContract.connect(wallet);
      const totalGasCost = await txGasEstimation(tokenWithSigner, toAccount.address, amount, adminWalletAddress, provider);
      setGasFee(ethers.utils.formatEther(totalGasCost));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch gas fee');
      console.error('Fetch Gas Fee Error:', error);
    } finally {
      setFetchingGasFee(false);
    }
  };

  const txGasEstimation = async (tokenWithSigner, to, amount, adminWalletAddress, provider) => {
    const decimals = await tokenWithSigner.decimals();
    const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
    const recipientAmount = amountInWei.mul(9975).div(10000); // 99.75%
    const adminAmount = amountInWei.sub(recipientAmount); // 0.25%
    const gasEstimate1 = await tokenWithSigner.estimateGas.transfer(to, recipientAmount);
    const gasEstimate2 = await tokenWithSigner.estimateGas.transfer(adminWalletAddress, adminAmount);
    const totalGasEstimate = gasEstimate1.add(gasEstimate2);
    const gasPrice = await provider.getGasPrice();
    const totalGasCost = totalGasEstimate.mul(gasPrice);
    return totalGasCost;
  };

  const handleNext = async () => {
    try {
      const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.networkurl);
      const decryptedPrivateKey = decryptPrivateKey(fromAccount.encryptedPrivateKey);
      const wallet = new ethers.Wallet(decryptedPrivateKey, provider);
      const tokenContract = new ethers.Contract(selectedToken.tokenAddress, selectedToken.abi, provider);
      const tokenWithSigner = tokenContract.connect(wallet);
  
      // Fetch token decimals
      const decimals = await tokenContract.decimals();
  
      // Convert amount to the token's smallest unit using the fetched decimals
      const amountInWei = ethers.utils.parseUnits(amount.toString(), decimals);
  
      if (gasFee && ethers.utils.parseEther(gasFee.toString()).gt(balance)) {
        Alert.alert(
          "Insufficient Balance",
          "You do not have enough Native Token in your account to pay for transaction fees on Your network. Deposit Native Token from another account."
        );
        return;
      }
  
      const tokenBalance = await tokenWithSigner.balanceOf(fromAccount.address);
  
      if (amountInWei.gt(tokenBalance)) {
        Alert.alert(
          "Insufficient Tokens",
          "You do not have enough tokens in your account to complete this transaction."
        );
        return;
      }
  
      setLoading(true);
  
      const tx1 = await tokenWithSigner.transfer(
        toAccount.address,
        amountInWei.mul(9975).div(10000) // 99.75% of the amount
      );
  
      const tx2 = await tokenWithSigner.transfer(
        adminWalletAddress,
        amountInWei.sub(amountInWei.mul(9975).div(10000)) // 0.25% of the amount
      );
  
      const txReceipt1 = await tx1.wait();
      const txReceipt2 = await tx2.wait();

      // Show success animation
      setShowSuccess(true);
      Animated.timing(tickOpacity, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setShowSuccess(false);
          navigation.navigate('MainPage', {
            amount: ethers.utils.formatUnits(amountInWei, decimals),
            gasFee: gasFee,
            fromAddress: fromAccount.address,
            toAddress: toAccount.address,
            tokenBalance: ethers.utils.formatUnits(tokenBalance, decimals)
          });
        }, 2000); // Show the tick for 1 second before navigating
      });
    } catch (error) {
      console.error("Transaction Error:", error);
      Alert.alert('Transaction Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Transfer token</Text>
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
        <Text style={styles.gasFeeText}>Gas Fee: {gasFee ? `${gasFee} ETH` : 'N/A'}</Text>
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
      <Text style={styles.balanceText}>Balance: {balance} SepoliaETH</Text>
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
    color: '#FFF',
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
    color: '#17171A',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '500',
  },
  balanceText: {
    color: '#FFF',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '400',
    marginTop: 20,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  successAnimation: {
    width: 100,
    height: 100,
    position: 'absolute',
    top: '80%', // Adjusted to move it down
    left: '57%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
  },
});
