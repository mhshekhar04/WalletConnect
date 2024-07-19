import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const dexLinks = [
  { name: '1inch.io', url: 'https://1inch.io' },
  { name: 'Curve', url: 'https://curve.fi' },
  { name: 'Pancakeswap', url: 'https://pancakeswap.finance' },
  { name: 'Aerodrome', url: 'https://aerodrome.com' },
  { name: 'Gmx', url: 'https://gmx.io' },
];

export default function Discover({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    let url = searchQuery.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    navigation.navigate('WebViewScreen', { url });
  };

  const handleLinkPress = (url) => {
    navigation.navigate('WebViewScreen', { url });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Paste link here..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        keyboardType="url"
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <Text style={styles.searchButtonText}>Go</Text>
      </TouchableOpacity>
      <ScrollView>
        {dexLinks.map((dex) => (
          <TouchableOpacity
            key={dex.name}
            style={styles.link}
            onPress={() => handleLinkPress(dex.url)}
          >
            <Text style={styles.linkText}>{dex.name}</Text>
            <FontAwesome name="external-link" size={16} color="#FEBF32" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    color: '#FFF',
    backgroundColor: '#333',
  },
  searchButton: {
    backgroundColor: '#FEBF32',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#1C1C1C',
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
  },
  linkText: {
    color: '#FFF',
    fontSize: 16,
  },
});

// import React, { useState, useRef } from 'react';
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// // import WalletConnect from '@walletconnect/client';
// // import QRCodeModal from '@walletconnect/qrcode-modal';
// const dexLinks = [
//   { name: '1inch.io', url: 'https://1inch.io' },
//   { name: 'Curve', url: 'https://curve.fi' },
//   { name: 'Pancakeswap', url: 'https://pancakeswap.finance' },
//   { name: 'Aerodrome', url: 'https://aerodrome.com' },
//   { name: 'Gmx', url: 'https://gmx.io' },
// ];
// export default function Discover({ navigation, route }) {
//   const { selectedAccount } = route.params;
//   const [searchQuery, setSearchQuery] = useState('');
//   const connector = useRef(null);
//   const handleSearch = () => {
//     let url = searchQuery;
//     // Check if the search query is a valid URL
//     if (!/^https?:\/\//i.test(searchQuery)) {
//       url = `https://${searchQuery}`;
//     }
//     navigation.navigate('WebViewScreen', { url });
//   };
//   const handleWalletConnect = async (url) => {
//     try {
//       connector.current = new WalletConnect({
//         bridge: 'https://bridge.walletconnect.org', // Required
//         qrcodeModal: QRCodeModal,
//       });
//       if (!connector.current.connected) {
//         await connector.current.createSession();
//       }
//       connector.current.on('connect', (error, payload) => {
//         if (error) {
//           throw error;
//         }
//         const { accounts } = payload.params[0];
//         console.log('Connected', accounts);
//       });
//       connector.current.on('session_update', (error, payload) => {
//         if (error) {
//           throw error;
//         }
//         const { accounts } = payload.params[0];
//         console.log('Updated', accounts);
//       });
//       connector.current.on('disconnect', (error, payload) => {
//         if (error) {
//           throw error;
//         }
//         console.log('Disconnected');
//       });
//       navigation.navigate('WebViewScreen', { url, selectedAccount });
//     } catch (error) {
//       console.error('WalletConnect error:', error);
//     }
//   };
//   return (
//     <View style={styles.container}>
//       <TextInput
//         style={styles.searchBar}
//         placeholder="Paste link here..."
//         value={searchQuery}
//         onChangeText={setSearchQuery}
//         keyboardType="url"
//         autoCapitalize="none"
//       />
//       <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
//         <Text style={styles.searchButtonText}>Go</Text>
//       </TouchableOpacity>
//       <ScrollView>
//         {dexLinks.map((dex) => (
//           <TouchableOpacity
//             key={dex.name}
//             style={styles.link}
//             onPress={() => handleWalletConnect(dex.url)}
//           >
//             <Text style={styles.linkText}>{dex.name}</Text>
//             <FontAwesome name="external-link" size={16} color="#FEBF32" />
//           </TouchableOpacity>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#1C1C1C',
//     paddingTop: 50,
//     paddingHorizontal: 20,
//   },
//   searchBar: {
//     height: 40,
//     borderColor: 'gray',
//     borderWidth: 1,
//     marginBottom: 16,
//     paddingLeft: 8,
//     color: '#FFF',
//     backgroundColor: '#333',
//   },
//   searchButton: {
//     backgroundColor: '#FEBF32',
//     borderRadius: 5,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     marginBottom: 20,
//     alignItems: 'center',
//   },
//   searchButtonText: {
//     color: '#1C1C1C',
//   },
//   link: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: '#333',
//     padding: 15,
//     borderRadius: 5,
//     marginVertical: 5,
//   },
//   linkText: {
//     color: '#FFF',
//     fontSize: 16,
//   },
// });