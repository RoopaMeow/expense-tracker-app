import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

export default function AddExpenseScreen() {
  const router = useRouter();
  const DEFAULT_CATEGORIES = ['🍔 Food', '🚌 Transport', '🛍️ Shopping', '💡 Bills', '📌 Other'];

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const stored = await AsyncStorage.getItem('categories');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCategories(parsed);
          setCategory(parsed[0]);
        } else {
          await AsyncStorage.setItem('categories', JSON.stringify(DEFAULT_CATEGORIES));
          setCategories(DEFAULT_CATEGORIES);
          setCategory(DEFAULT_CATEGORIES[0]);
        }
      } catch (error) {
        console.log(error);
      }
    };
    loadCategories();
  }, []);

  const saveExpense = async () => {
    const numericAmount = parseFloat(amount);
    if (!amount || !category) {
      Alert.alert('Error', 'Please enter amount and select category.');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      amount: numericAmount,
      category,
      note,
      date: new Date().toISOString(),
    };

    try {
      const storedData = await AsyncStorage.getItem('expenses');
      const expenses = storedData ? JSON.parse(storedData) : [];
      expenses.push(expense);
      await AsyncStorage.setItem('expenses', JSON.stringify(expenses));

      setAmount('');
      setNote('');
      setCategory(categories[0]);

      Alert.alert('Success', 'Expense added!');
      router.push('/');
    } catch (error) {
      console.log('Error saving expense:', error);
      Alert.alert('Error', 'Could not save expense.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>➕ Add Expense</Text>

      <Text style={styles.label}>💰 Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="Enter amount"
      />

      <Text style={styles.label}>📂 Category</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)}>
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>📝 Note (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Any notes..."
        value={note}
        onChangeText={setNote}
      />

      <Button title="💾 Save Expense" onPress={saveExpense} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginTop: 15 },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 10, marginTop: 5, borderRadius: 8 },
  pickerContainer: { borderWidth: 1, borderColor: '#aaa', borderRadius: 8, marginTop: 5 },
});
