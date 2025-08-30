import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const navigation = useNavigation();

  const loadCategories = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem("categories");
      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const saveCategories = async (updatedCategories) => {
    try {
      await AsyncStorage.setItem("categories", JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  const addCategory = () => {
    if (newCategory.trim() === "") {
      Alert.alert("Error", "Category name cannot be empty");
      return;
    }
    const updatedCategories = [...categories, newCategory.trim()];
    saveCategories(updatedCategories);
    setNewCategory("");
  };

  const deleteCategory = (category) => {
    const updatedCategories = categories.filter((c) => c !== category);
    saveCategories(updatedCategories);
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Success", "All data cleared");
      navigation.navigate("Home"); // 
    } catch (error) {
      console.error("Error clearing all data:", error);
    }
  };

  React.useEffect(() => {
    loadCategories();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Categories</Text>

      <TextInput
        style={styles.input}
        placeholder="New Category"
        value={newCategory}
        onChangeText={setNewCategory}
      />
      <Button title="Add Category" onPress={addCategory} />

      <FlatList
        data={categories}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.categoryRow}>
            <Text>{item}</Text>
            <Button title="Delete" onPress={() => deleteCategory(item)} />
          </View>
        )}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Clear All Data" color="red" onPress={clearAllData} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
});

