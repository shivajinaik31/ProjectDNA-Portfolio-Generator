import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { DN, FontFamily, FontSize, Space, Radius, Shadow } from '@/constants/design-tokens';
import { supabase } from '@/lib/supabase';

type Skill = {
  id: string;
  name: string;
};

type TechAutocompleteProps = {
  onAddSkill: (skillName: string) => void;
};

export function TechAutocomplete({ onAddSkill }: TechAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search
  useEffect(() => {
    const search = inputValue.trim();
    if (!search || search.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('id, name')
          .ilike('name', `%${search}%`)
          .limit(5);

        if (!error && data) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Failed to fetch skills', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const handleAdd = (name: string) => {
    if (!name.trim()) return;
    onAddSkill(name);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const submitInput = () => {
    handleAdd(inputValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="e.g. React, Node.js"
          placeholderTextColor={DN.textPlaceholder}
          onSubmitEditing={submitInput}
          returnKeyType="done"
          onFocus={() => {
            if (inputValue.trim().length > 0) setShowSuggestions(true);
          }}
          onBlur={() => {
            // Slight delay to allow tap on suggestion to register
            setTimeout(() => setShowSuggestions(false), 200);
          }}
        />

        <TouchableOpacity
          style={styles.addBtn}
          onPress={submitInput}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={18} color={DN.cyan} />
        </TouchableOpacity>
      </View>

      {showSuggestions && (inputValue.trim().length > 0) && (
        <View style={styles.suggestionsContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={DN.cyan} />
            </View>
          ) : suggestions.length > 0 ? (
            suggestions.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={styles.suggestionItem}
                onPress={() => handleAdd(skill.name)}
              >
                <Feather name="code" size={14} color={DN.textMuted} style={styles.suggestionIcon} />
                <Text style={styles.suggestionText}>{skill.name}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleAdd(inputValue)}
            >
              <Feather name="plus-circle" size={14} color={DN.cyan} style={styles.suggestionIcon} />
              <Text style={styles.newTagText}>Add "{inputValue.trim()}"</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Space.sm,
  },
  input: {
    flex: 1,
    backgroundColor: DN.bgInput,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderLight,
    color: DN.textPrimary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    paddingHorizontal: Space.md,
    height: 48,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: DN.cyanMuted,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    width: '100%',
    marginTop: Space.xs,
    backgroundColor: DN.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: DN.borderFocus,
    maxHeight: 200,
    ...Shadow.card,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: Space.md,
    alignItems: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Space.md,
    borderBottomWidth: 1,
    borderBottomColor: DN.border,
  },
  suggestionIcon: {
    marginRight: Space.sm,
  },
  suggestionText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.textPrimary,
  },
  newTagText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: DN.cyan,
  },
});
