import React, { useState } from 'react';
import { Image, StyleSheet, View, Text, Button, TouchableOpacity, ScrollView } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import emv from 'node-emv';

export default function HomeScreen() {
    const [cardData, setCardData] = useState(null);
    const [tech, setTech] = useState(NfcTech.IsoDep);

    const commands = {
        visa: [
            "00A404000E325041592E5359532E444446303100",
            "00A4040007A00000000310100E",
            "80A800002383212800000000000000000000000000000002500000000000097820052600E8DA935200"
        ],
        mastercard: [
            "00A4040007A00000000410100E",
            "80A8000002830000",
            "00B2011400",
            "00B2010C00",
            "00B2012400",
            "00B2022400"
        ]
    };

    const readCreditCard = async (type) => {
        try {
            await NfcManager.requestTechnology([NfcTech.IsoDep]);
            const commandSet = commands[type];
            const responses = await transceiveCommands(commandSet);
            const processedCardData = await processCardData(responses, type);
            console.log(processedCardData)
            setCardData(processedCardData);
        } catch (error) {
            console.error(error);
        } finally {
            NfcManager.cancelTechnologyRequest();
        }
    };

    const transceiveCommands = async (commandSet) => {
        const responses = [];
        for (const command of commandSet) {
            const response = await NfcManager.isoDepHandler.transceive(toByteArray(command));
            responses.push(response);
        }
        return responses;
    };

    const processCardData = (responses, type) => {
        if (!responses.length) return null;
        const targetResponse = responses[2]; // Choosing response based on type
        return getCardInfoFromResponse(toHexString(targetResponse), type);
    };

    const getCardInfoFromResponse = async (responseHex, type) => {
        const r = await getEmvInfo(responseHex);
        if (!r) return null;
        return type === 'visa' ? getCardInfoVisa(r) : getCardInfoMasterCard(r);
    };

    const getEmvInfo = (info) => new Promise((resolve) => {
        emv.describe(info, (data) => {
            resolve(data ? data : null);
        });
    });

    const toByteArray = (text) => text.match(/.{1,2}/g).map(b => parseInt(b, 16));

    const toHexString = (byteArr) => byteArr.reduce((acc, byte) => acc + ('00' + byte.toString(16).toUpperCase()).slice(-2), '');

    const getCardInfoVisa = (responses) => {
        let res
        let end = false
        for (let i = 0; i < responses.length; i++) {
            const r = responses[i]
            if (r.tag === "77" && r.value && r.value.length > 0) {
                for (let j = 0; j < r.value.length; j++) {
                    const e = r.value[j]
                    if (e.tag === "57" && e.value) {
                        const parts = e.value.split("D")
                        if (parts.length > 1) {
                            res = {
                                card: parts[0],
                                exp: parts[1].substring(0, 4)
                            }
                            end = true
                        }
                    }

                    if (end) {
                        break
                    }
                }

                if (end) {
                    break
                }
            }
        }
        return res
    };

    const getCardInfoMasterCard = (responses) => {
        let res
        let end = false
        for (let i = 0; i < responses.length; i++) {
            const r = responses[i]
            if (r.tag === "70" && r.value && r.value.length > 0) {
                for (let j = 0; j < r.value.length; j++) {
                    const e = r.value[j]
                    if (e.tag === "5A" && e.value) {
                        if (!res) {
                            res = {
                                card: e.value
                            }
                        } else {
                            res.card = e.value
                        }

                        if (res.card && res.exp) {
                            end = true
                        }
                    }

                    if (e.tag === "5F24" && e.value) {
                        if (!res) {
                            res = {
                                exp: e.value
                            }
                        } else {
                            res.exp = e.value
                        }

                        if (res.card && res.exp) {
                            end = true
                        }
                    }

                    if (end) {
                        break
                    }
                }

                if (end) {
                    break
                }
            }
        }
        return res
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={require('@/assets/images/partial-react-logo.png')} style={styles.reactLogo} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.titleText}>Welcome to NFC Reader!</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={() => setTech(NfcTech.IsoDep)} style={tech === NfcTech.IsoDep ? styles.techButtonSelected : styles.techButton}>
                        <Text>Use IsoDep</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTech(NfcTech.NfcA)} style={tech === NfcTech.NfcA ? styles.techButtonSelected : styles.techButton}>
                        <Text>Use NfcA</Text>
                    </TouchableOpacity>
                </View>
                <Button title={`Scan Visa Card (${tech})`} onPress={() => readCreditCard('visa')} />
                <Button title={`Scan Mastercard Card (${tech})`} onPress={() => readCreditCard('mastercard')} />
                {cardData && (
                    <View style={styles.cardDataContainer}>
                        <Text style={styles.cardDataText}>Card Number: {cardData.card}</Text>
                        <Text>Expiration: {cardData.exp}</Text>
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
    reactLogo: {
        height: 178,
        width: 290,
        alignSelf: 'center',
        marginVertical: 20,
    },
    contentContainer: {
        padding: 10,
    },
    titleText: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
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
});
