import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Dimensions, ScrollView, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { PieChart } from 'react-native-chart-kit';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ today: 0, week: 0, month: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [categories, setCategories] = useState(['🍔 Food', '🚌 Transport', '🛍️ Shopping', '💡 Bills', '📌 Other']);
  const [monthlyBudget, setMonthlyBudget] = useState(10000);
  const [budgetExceeded, setBudgetExceeded] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      loadCategories();
      loadBudget();
    }, [])
  );

  
  const loadExpenses = async () => {
    try {
      const storedData = await AsyncStorage.getItem('expenses');
      const savedExpenses = storedData ? JSON.parse(storedData) : [];
      setExpenses(savedExpenses);
      calculateTotals(savedExpenses);
    } catch (error) {
      console.log("Error loading expenses:", error);
    }
  };

  
  const loadCategories = async () => {
    const stored = await AsyncStorage.getItem('categories');
    if (stored) setCategories(JSON.parse(stored));
  };

  
  const loadBudget = async () => {
    const storedBudget = await AsyncStorage.getItem('monthlyBudget');
    if (storedBudget) setMonthlyBudget(parseFloat(storedBudget));
  };

  
  const saveBudget = async () => {
    const numericBudget = parseFloat(budgetInput);
    if (!numericBudget || numericBudget <= 0) {
      alert("Enter a valid budget!");
      return;
    }
    await AsyncStorage.setItem('monthlyBudget', numericBudget.toString());
    setMonthlyBudget(numericBudget);
    setBudgetInput('');
    calculateTotals(expenses); 
  };


  const calculateTotals = (expenseList) => {
    const now = new Date();
    let today = 0, week = 0, month = 0;

    expenseList.forEach(item => {
      const itemDate = new Date(item.date);
      const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);

      if (
        now.getFullYear() === itemDate.getFullYear() &&
        now.getMonth() === itemDate.getMonth() &&
        now.getDate() === itemDate.getDate()
      ) today += item.amount;

      if (diffDays < 7) week += item.amount;

      if (
        now.getFullYear() === itemDate.getFullYear() &&
        now.getMonth() === itemDate.getMonth()
      ) month += item.amount;
    });

    setTotals({ today, week, month });
    setBudgetExceeded(month > monthlyBudget);
  };

  
  const filteredExpenses = expenses
    .filter(exp =>
      (selectedCategory === 'All' ? true : exp.category === selectedCategory) &&
      exp.note?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'latest') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'highest') return b.amount - a.amount;
      return 0;
    });

  
  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const totalSpending = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

  const pieData = Object.keys(categoryTotals).map((cat, index) => ({
    name: cat,
    amount: categoryTotals[cat],
    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'][index % 5],
    legendFontColor: '#333',
    legendFontSize: 14
  }));


  const groupedExpenses = filteredExpenses.reduce((acc, item) => {
    const dateStr = new Date(item.date).toLocaleDateString();
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(item);
    return acc;
  }, {});

  const flatData = Object.keys(groupedExpenses).map(date => ({
    date,
    data: groupedExpenses[date],
  }));

  return (
    <ScrollView style={styles.container}>
      
      <Text style={styles.heading}>📊 Expense Totals</Text>
      <View style={styles.totalsContainer}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>🟢 Today</Text>
          <Text style={styles.totalAmount}>₹{totals.today}</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>🔵 This Week</Text>
          <Text style={styles.totalAmount}>₹{totals.week}</Text>
        </View>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>🟣 This Month</Text>
          <Text style={styles.totalAmount}>₹{totals.month}</Text>
        </View>
      </View>

      
      {budgetExceeded && (
        <Text style={styles.budgetWarning}>
          ⚠️ You have exceeded your monthly budget of ₹{monthlyBudget}!
        </Text>
      )}

      
      <View style={{ marginVertical: 15 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>💵 Monthly Budget</Text>
        <View style={{ flexDirection: 'row', marginTop: 5, alignItems: 'center' }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 10,
            }}
            placeholder="Set your monthly budget"
            keyboardType="numeric"
            value={budgetInput}
            onChangeText={setBudgetInput}
          />
          <Button title="Set" onPress={saveBudget} />
        </View>
        {monthlyBudget > 0 && <Text style={{ marginTop: 5 }}>Current Budget: ₹{monthlyBudget}</Text>}
      </View>

      
      <Text style={styles.heading}>📂 Category Breakdown</Text>
      {totalSpending === 0 ? (
        <Text>No expenses to show</Text>
      ) : (
        <>
          <PieChart
            data={pieData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`
            }}
            accessor={"amount"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
          {pieData.map(item => (
            <Text key={item.name}>
              {item.name}: ₹{item.amount} ({((item.amount / totalSpending) * 100).toFixed(1)}%)
            </Text>
          ))}
        </>
      )}

      
      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedCategory}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        >
          <Picker.Item label="All" value="All" />
          {categories.map(cat => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>

        <Picker
          selectedValue={sortBy}
          style={styles.picker}
          onValueChange={(itemValue) => setSortBy(itemValue)}
        >
          <Picker.Item label="Latest First" value="latest" />
          <Picker.Item label="Highest Amount" value="highest" />
        </Picker>
      </View>

      
      <TextInput
        style={styles.searchBar}
        placeholder="🔍 Search notes..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      
      <Text style={styles.heading}>🧾 Expenses</Text>
      {filteredExpenses.length === 0 ? (
        <Text style={styles.empty}>No expenses found.</Text>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 15 }}>
              <Text style={styles.dateHeader}>{item.date}</Text>
              {item.data.map(exp => (
                <View key={exp.id} style={styles.item}>
                  <Text style={styles.amount}>₹{exp.amount}</Text>
                  <Text style={styles.category}>{exp.category}</Text>
                  {exp.note ? <Text style={styles.note}>📝 {exp.note}</Text> : null}
                </View>
              ))}
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  totalCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  budgetWarning: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  totalLabel: { fontSize: 14, color: "#666" },
  totalAmount: { fontSize: 18, fontWeight: "bold", marginTop: 5 },

  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  picker: { flex: 1, height: 40, marginHorizontal: 5 },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  empty: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#555' },
  dateHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  item: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  amount: { fontSize: 18, fontWeight: "bold", color: "red" },
  category: { fontSize: 14, fontWeight: "bold", color: "#555", marginTop: 3 },
  note: { fontSize: 12, fontWeight: "bold", color: "#777", marginTop: 2 },
});
