import React, { useState } from 'react';
import { Image, StyleSheet, Platform, View, Text, Button, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { HelloWave } from '@/components/HelloWave';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export default function HomeScreen() {
    const [cardData, setCardData] = useState(null);
    const [tech, setTech] = useState('IsoDep');  // Default to IsoDep, can toggle to Nfca

    async function readNfcCard() {
        try {
            // Requesting the selected technology
            await NfcManager.requestTechnology(tech);

            // Depending on your specific use-case, adjust how you interact with the NFC card
            const tag = await NfcManager.getTag();
            setCardData(JSON.stringify(tag)); // Displaying raw data from the tag

        } catch (ex) {
            console.warn(`Error reading NFC with ${tech}:`, ex);
            Alert.alert('Error', `Failed to read the NFC card with ${tech}. Please try again.`);
        } finally {
            await NfcManager.cancelTechnologyRequest();
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />
            </View>
            <View style={styles.contentContainer}>
                <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Welcome!</Text>
                    <HelloWave />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => setTech('IsoDep')} style={tech === 'IsoDep' ? styles.techButtonSelected : styles.techButton}>
                        <Text>Use IsoDep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTech('Nfca')} style={tech === 'Nfca' ? styles.techButtonSelected : styles.techButton}>
                        <Text>Use Nfca</Text>
                    </TouchableOpacity>
                </View>
                <Button title={`Scan NFC Card (${tech})`} onPress={readNfcCard} />
                {cardData && (
                    <View style={styles.cardDataContainer}>
                        <Text style={styles.cardDataText}>Card Data:</Text>
                        <Text>{cardData}</Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        backgroundColor: '#A1CEDC',
    },
    contentContainer: {
        padding: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    techButton: {
        padding: 10,
        marginHorizontal: 5,
        backgroundColor: '#ddd',
        borderRadius: 5,
    },
    techButtonSelected: {
        padding: 10,
        marginHorizontal: 5,
        backgroundColor: '#bbb',
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#888',
    },
    cardDataContainer: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    cardDataText: {
        fontWeight: 'bold',
    },
    reactLogo: {
        height: 178,
        width: 290,
        alignSelf: 'center',
        marginVertical: 20,
    },
});
