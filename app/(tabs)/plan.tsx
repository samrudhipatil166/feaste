import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput,
} from "react-native";
import Modal from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useAppStore } from "@/store/useAppStore";
import { DARK_THEME, MACRO_COLORS, TYPE } from "@/constants/theme";
import { PHASE_INFO, getPhaseForDay } from "@/constants/cycle";
import { GlowCard } from "@/components/GlowCard";
import { CyclePhase, FoodEntry, UserProfile } from "@/types";

type MealSlot = "Breakfast" | "Lunch" | "Dinner" | "Snack";

type WeekMeal = {
  meal: MealSlot;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
  cookTime: string;
  cookTimeMinutes: number;
  cuisine: string[];
  allergens: string[];
  dietary: string[];
  phases: CyclePhase[] | "all";
  insight: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  proTip: string;
};

type WeekDay = {
  dayLabel: string;
  dateLabel: string;
  phase: CyclePhase;
  meals: WeekMeal[];
  isPast: boolean;
};

// ── Meal Library ───────────────────────────────────────────────────────────────
const MEAL_LIBRARY: WeekMeal[] = [
  // BREAKFASTS
  {
    meal: "Breakfast", name: "Berry Protein Smoothie Bowl", emoji: "🫐",
    description: "Blended berries, protein powder, topped with flax & granola",
    calories: 380, protein: 28, carbs: 42, fat: 10,
    cookTime: "10 min", cookTimeMinutes: 10,
    cuisine: ["American"], allergens: [], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Iron-boosting berries support your cycle ✨",
    tags: ["high-protein", "antioxidants", "gluten-free"],
    ingredients: ["1 cup mixed berries", "1 scoop protein powder", "½ banana", "1 tbsp flaxseed", "¼ cup granola", "½ cup almond milk"],
    steps: ["Blend berries, banana, protein powder and almond milk.", "Pour into bowl.", "Top with granola and flaxseed."],
    proTip: "Frozen berries make it thicker — no ice needed.",
  },
  {
    meal: "Breakfast", name: "Avocado Egg Toast", emoji: "🥑",
    description: "Smashed avo, poached eggs, chili flakes on gluten-free sourdough",
    calories: 410, protein: 22, carbs: 32, fat: 22,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["American", "Mediterranean"], allergens: ["Eggs"], dietary: ["vegetarian", "gluten-free"],
    phases: "all",
    insight: "Healthy fats from avocado support hormone production",
    tags: ["gluten-free", "high-protein", "omega-3"],
    ingredients: ["2 slices GF sourdough", "1 ripe avocado", "2 eggs", "Chili flakes", "Lemon juice", "Salt & pepper"],
    steps: ["Toast bread.", "Smash avocado with lemon, salt.", "Poach eggs for 3 min.", "Assemble and top with chili flakes."],
    proTip: "Add a pinch of nutritional yeast for extra B12.",
  },
  {
    meal: "Breakfast", name: "Chia Pudding Parfait", emoji: "🍮",
    description: "Coconut chia pudding, mango, toasted coconut flakes, honey",
    calories: 340, protein: 14, carbs: 38, fat: 16,
    cookTime: "5 min (+ overnight)", cookTimeMinutes: 5,
    cuisine: ["American", "Caribbean"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "luteal"],
    insight: "Chia seeds are rich in omega-3 & fiber for hormone balance",
    tags: ["omega-3", "dairy-free", "high-fiber"],
    ingredients: ["3 tbsp chia seeds", "1 cup coconut milk", "½ mango diced", "1 tbsp honey", "2 tbsp toasted coconut flakes"],
    steps: ["Mix chia seeds with coconut milk and honey.", "Refrigerate overnight.", "Top with mango and coconut flakes."],
    proTip: "Prep 4 jars on Sunday for the whole week.",
  },
  {
    meal: "Breakfast", name: "Banana Oat Pancakes", emoji: "🥞",
    description: "Fluffy 3-ingredient banana pancakes with maple syrup",
    calories: 390, protein: 16, carbs: 52, fat: 14,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["American"], allergens: ["Eggs"], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: ["luteal"],
    insight: "Bananas boost serotonin — perfect for the luteal phase mood dip",
    tags: ["gluten-free", "dairy-free", "natural-sugar"],
    ingredients: ["2 ripe bananas", "2 eggs", "1 tsp cinnamon", "Maple syrup", "Coconut oil for cooking"],
    steps: ["Mash bananas well.", "Whisk in eggs and cinnamon.", "Cook on medium heat 2-3 min per side.", "Serve with maple syrup."],
    proTip: "The riper the banana, the sweeter and fluffier.",
  },
  {
    meal: "Breakfast", name: "Spiced Masala Oats", emoji: "🌾",
    description: "Warming oats with cardamom, cinnamon, saffron, dates & almonds",
    calories: 360, protein: 12, carbs: 56, fat: 10,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["Indian"], allergens: ["Gluten", "Nuts"], dietary: ["vegetarian", "dairy-free"],
    phases: ["luteal", "menstrual"],
    insight: "Saffron supports mood and reduces cramps during luteal & menstrual phases",
    tags: ["warming", "iron-rich", "antioxidants"],
    ingredients: ["½ cup oats", "1½ cups water", "3 dates chopped", "1 tbsp almonds", "¼ tsp cardamom", "¼ tsp cinnamon", "Pinch of saffron"],
    steps: ["Soak saffron in 2 tbsp warm water.", "Simmer oats in water 5 min.", "Stir in spices, saffron water, dates.", "Top with almonds."],
    proTip: "Add a splash of rose water for a beautiful floral note.",
  },
  {
    meal: "Breakfast", name: "Ginger Congee", emoji: "🍚",
    description: "Creamy rice porridge with ginger, scallions & sesame oil",
    calories: 290, protein: 8, carbs: 54, fat: 6,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Chinese", "Asian"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual"],
    insight: "Ginger soothes cramps and aids digestion during your period",
    tags: ["warming", "anti-inflammatory", "gluten-free"],
    ingredients: ["½ cup jasmine rice", "4 cups vegetable broth", "1-inch fresh ginger grated", "3 scallions sliced", "1 tsp sesame oil", "Tamari to taste"],
    steps: ["Simmer rice in broth with ginger on medium-low heat.", "Stir every 5 min for 20-25 min until porridge-like.", "Ladle into bowl, top with scallions and sesame oil."],
    proTip: "Add a soft-boiled egg for extra protein. Miso paste adds great umami and gut benefits.",
  },
  {
    meal: "Breakfast", name: "Egg Bhurji", emoji: "🍳",
    description: "Indian spiced scrambled eggs with tomatoes, onion & fresh coriander",
    calories: 370, protein: 24, carbs: 14, fat: 24,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["Indian"], allergens: ["Eggs"], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Turmeric in the spice blend is a powerful anti-inflammatory",
    tags: ["high-protein", "gluten-free", "anti-inflammatory"],
    ingredients: ["4 eggs", "1 small onion diced", "1 tomato diced", "½ tsp cumin seeds", "¼ tsp turmeric", "1 green chili (optional)", "Fresh coriander"],
    steps: ["Sauté onion and cumin in oil until golden.", "Add tomato, turmeric, chili, cook 2 min.", "Add whisked eggs, stir continuously on medium heat.", "Remove before fully set. Top with fresh coriander."],
    proTip: "Serve with a warm GF roti or on toast for a fuller meal.",
  },
  {
    meal: "Breakfast", name: "Plantain Egg Scramble", emoji: "🍌",
    description: "Pan-fried sweet plantain with spiced egg scramble & bell peppers",
    calories: 420, protein: 18, carbs: 46, fat: 20,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Jamaican", "Caribbean"], allergens: ["Eggs"], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: "all",
    insight: "Plantains provide resistant starch that feeds beneficial gut bacteria",
    tags: ["gluten-free", "dairy-free", "natural-sugar"],
    ingredients: ["1 ripe plantain sliced", "3 eggs", "½ red bell pepper diced", "¼ tsp jerk seasoning", "1 tbsp coconut oil"],
    steps: ["Fry plantain slices in coconut oil 2-3 min per side until golden.", "Remove plantain, sauté peppers in same pan.", "Add whisked eggs with jerk seasoning, scramble.", "Plate with plantains on the side."],
    proTip: "The riper and darker the plantain, the sweeter.",
  },

  {
    meal: "Breakfast", name: "Spinach & Feta Omelette", emoji: "🥚",
    description: "Fluffy omelette stuffed with wilted spinach, feta & sun-dried tomatoes",
    calories: 390, protein: 28, carbs: 8, fat: 28,
    cookTime: "10 min", cookTimeMinutes: 10,
    cuisine: ["Greek", "Mediterranean"], allergens: ["Eggs", "Dairy"], dietary: ["vegetarian", "gluten-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Spinach is one of the best plant sources of iron — key during the follicular phase",
    tags: ["high-protein", "gluten-free", "iron-rich"],
    ingredients: ["3 eggs", "1 cup baby spinach", "30g feta crumbled", "2 tbsp sun-dried tomatoes", "1 tsp olive oil", "Salt & pepper"],
    steps: ["Whisk eggs with salt and pepper.", "Heat olive oil in pan, wilt spinach 1 min.", "Pour eggs over, cook on medium-low until almost set.", "Add feta and tomatoes, fold in half.", "Slide onto plate."],
    proTip: "Don't rush the eggs — low and slow makes the fluffiest omelette.",
  },
  {
    meal: "Breakfast", name: "Turkish Menemen", emoji: "🍅",
    description: "Silky eggs poached in spiced tomato & pepper sauce",
    calories: 350, protein: 22, carbs: 18, fat: 22,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["Turkish", "Middle Eastern"], allergens: ["Eggs"], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Lycopene in tomatoes is anti-inflammatory — great for easing period cramps",
    tags: ["anti-inflammatory", "gluten-free", "warming"],
    ingredients: ["3 eggs", "2 tomatoes diced", "1 green pepper diced", "1 small onion diced", "½ tsp paprika", "¼ tsp cumin", "1 tbsp olive oil", "Fresh parsley"],
    steps: ["Sauté onion and pepper in olive oil until soft.", "Add tomatoes, paprika, cumin — simmer 5 min.", "Make wells in sauce, crack in eggs.", "Cover and cook 4-5 min until whites are set.", "Top with parsley."],
    proTip: "Serve with GF sourdough or rice cakes for dipping.",
  },
  {
    meal: "Breakfast", name: "Overnight Bircher Muesli", emoji: "🥣",
    description: "Rolled oats soaked in apple juice with grated apple, yogurt & honey",
    calories: 370, protein: 14, carbs: 58, fat: 10,
    cookTime: "5 min (+ overnight)", cookTimeMinutes: 5,
    cuisine: ["American", "Mediterranean"], allergens: ["Gluten", "Dairy", "Nuts"], dietary: ["vegetarian"],
    phases: ["follicular", "luteal"],
    insight: "Oats support steady estrogen levels — ideal in the follicular phase",
    tags: ["high-fiber", "slow-release", "prebiotic"],
    ingredients: ["½ cup rolled oats", "½ cup apple juice", "1 apple grated", "¼ cup Greek yogurt", "1 tbsp honey", "1 tbsp walnuts chopped", "Cinnamon"],
    steps: ["Mix oats with apple juice.", "Stir in grated apple, yogurt and honey.", "Refrigerate overnight.", "Top with walnuts and a pinch of cinnamon."],
    proTip: "Make a batch of 4 jars on Sunday — breakfast sorted for the week.",
  },
  {
    meal: "Breakfast", name: "Korean Breakfast Rice Bowl", emoji: "🍚",
    description: "Warm brown rice with kimchi, soft-boiled egg, sesame oil & nori",
    calories: 410, protein: 20, carbs: 52, fat: 14,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["Korean"], allergens: ["Eggs", "Soy"], dietary: ["gluten-free", "dairy-free"],
    phases: "all",
    insight: "Kimchi is a probiotic powerhouse — supports the gut-hormone axis",
    tags: ["probiotic", "gluten-free", "gut-health"],
    ingredients: ["1 cup cooked brown rice", "½ cup kimchi", "1 soft-boiled egg", "1 sheet nori torn", "1 tsp sesame oil", "1 tsp tamari", "1 tsp sesame seeds"],
    steps: ["Warm rice in pan or microwave.", "Soft-boil egg 6-7 min, peel and halve.", "Arrange rice, kimchi, egg and nori in bowl.", "Drizzle sesame oil and tamari, top with sesame seeds."],
    proTip: "Leftover rice from dinner makes this a 5-minute breakfast.",
  },
  {
    meal: "Breakfast", name: "Coconut Mango Yogurt Bowl", emoji: "🥭",
    description: "Thick coconut yogurt, fresh mango, toasted coconut & pumpkin seeds",
    calories: 320, protein: 10, carbs: 44, fat: 14,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Caribbean", "American"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["ovulatory", "follicular"],
    insight: "Mango is rich in vitamin B6 which supports progesterone production",
    tags: ["vegan", "gluten-free", "dairy-free", "antioxidants"],
    ingredients: ["¾ cup coconut yogurt", "½ mango diced", "2 tbsp toasted coconut flakes", "1 tbsp pumpkin seeds", "1 tsp honey", "Lime zest"],
    steps: ["Spoon yogurt into bowl.", "Top with mango, coconut flakes and pumpkin seeds.", "Drizzle honey and grate lime zest over top."],
    proTip: "Freeze the mango if you want a more ice-cream-like texture.",
  },
  {
    meal: "Breakfast", name: "Savoury Oat Porridge", emoji: "🫕",
    description: "Creamy oats cooked in broth, topped with a poached egg & chili oil",
    calories: 380, protein: 20, carbs: 48, fat: 14,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["American", "Asian"], allergens: ["Eggs", "Gluten"], dietary: ["vegetarian", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Oats in broth provide warmth and slow-burning energy during the menstrual phase",
    tags: ["warming", "slow-release", "iron-rich"],
    ingredients: ["½ cup rolled oats", "1½ cups vegetable broth", "1 poached egg", "1 tsp chili oil", "2 scallions sliced", "Tamari to taste", "Sesame seeds"],
    steps: ["Cook oats in broth over medium heat, stirring for 5-7 min.", "Season with tamari.", "Poach egg in simmering water 3 min.", "Top oats with egg, chili oil, scallions and sesame seeds."],
    proTip: "Use miso broth for extra gut benefits and depth of flavour.",
  },
  {
    meal: "Breakfast", name: "Açaí Power Bowl", emoji: "🫐",
    description: "Blended açaí, banana & almond milk topped with granola, seeds & berries",
    calories: 400, protein: 12, carbs: 54, fat: 16,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["American", "Caribbean"], allergens: ["Nuts"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Açaí is packed with anthocyanins that reduce oxidative stress and inflammation",
    tags: ["antioxidants", "vegan", "gluten-free", "dairy-free"],
    ingredients: ["100g frozen açaí", "1 banana frozen", "½ cup almond milk", "¼ cup granola", "1 tbsp hemp seeds", "½ cup mixed berries", "1 tsp honey"],
    steps: ["Blend açaí, frozen banana and almond milk until thick and smooth.", "Pour into bowl.", "Top with granola, hemp seeds and berries.", "Drizzle with honey."],
    proTip: "Keep the blend thick — add liquid sparingly or it becomes a drink.",
  },

  // LUNCHES
  {
    meal: "Lunch", name: "Mediterranean Quinoa Bowl", emoji: "🥗",
    description: "Quinoa, grilled chicken, cucumber, cherry tomatoes, tahini drizzle",
    calories: 520, protein: 38, carbs: 48, fat: 16,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Mediterranean"], allergens: ["Sesame"], dietary: ["gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "High fiber quinoa supports estrogen metabolism",
    tags: ["high-protein", "anti-inflammatory", "high-fiber"],
    ingredients: ["¾ cup quinoa", "150g grilled chicken", "½ cucumber diced", "1 cup cherry tomatoes", "2 tbsp tahini", "Lemon juice", "Fresh parsley"],
    steps: ["Cook quinoa per packet.", "Grill chicken with olive oil and herbs.", "Assemble bowl.", "Drizzle tahini thinned with lemon and water."],
    proTip: "Batch cook quinoa on Sunday — it keeps all week.",
  },
  {
    meal: "Lunch", name: "Shakshuka", emoji: "🍳",
    description: "Poached eggs in spiced tomato sauce with feta crumbles",
    calories: 360, protein: 20, carbs: 28, fat: 18,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Middle Eastern", "Mediterranean"], allergens: ["Eggs", "Dairy"], dietary: ["vegetarian", "gluten-free"],
    phases: ["menstrual"],
    insight: "Lycopene in tomatoes supports hormone health & iron-rich eggs help replenish",
    tags: ["vegetarian", "anti-inflammatory", "iron-rich"],
    ingredients: ["4 eggs", "1 can crushed tomatoes", "1 onion", "2 garlic cloves", "1 tsp cumin", "½ tsp paprika", "50g feta"],
    steps: ["Sauté onion and garlic.", "Add tomatoes and spices, simmer 10 min.", "Make wells and crack eggs in.", "Cover and cook 5-7 min. Top with feta."],
    proTip: "Great for breakfast too — and even better the next day.",
  },
  {
    meal: "Lunch", name: "Jerk Chicken Rice Bowl", emoji: "🌶️",
    description: "Spiced jerk chicken on coconut rice with mango slaw & black beans",
    calories: 560, protein: 42, carbs: 54, fat: 12,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Jamaican", "Caribbean"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["ovulatory", "luteal"],
    insight: "High protein supports muscle repair during the ovulatory energy surge",
    tags: ["high-protein", "gluten-free", "dairy-free"],
    ingredients: ["200g chicken thighs", "1 tbsp jerk seasoning", "1 cup rice", "½ cup coconut milk", "½ cup black beans", "½ mango diced", "Cabbage, lime juice for slaw"],
    steps: ["Marinate chicken in jerk seasoning 10 min.", "Grill or pan-fry 6-7 min each side.", "Cook rice in coconut milk.", "Assemble with beans and mango slaw."],
    proTip: "Jerk chicken freezes beautifully — make a double batch.",
  },
  {
    meal: "Lunch", name: "Chinese Chicken Stir-Fry", emoji: "🥦",
    description: "Tender chicken, broccoli & shiitake mushrooms in ginger-soy sauce",
    calories: 480, protein: 36, carbs: 40, fat: 14,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Chinese", "Asian"], allergens: ["Gluten", "Soy"], dietary: ["dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Broccoli supports estrogen detoxification in the follicular phase",
    tags: ["high-protein", "anti-inflammatory", "dairy-free"],
    ingredients: ["200g chicken breast sliced", "2 cups broccoli florets", "1 cup shiitake mushrooms", "3 garlic cloves", "1-inch ginger grated", "3 tbsp soy sauce", "1 tbsp sesame oil", "1 cup rice"],
    steps: ["Cook rice.", "Stir-fry chicken in high heat until golden, remove.", "Sauté garlic and ginger 30 sec.", "Add broccoli and mushrooms 3-4 min.", "Return chicken, add soy sauce and sesame oil. Toss."],
    proTip: "High heat is the secret — don't overcrowd the pan.",
  },
  {
    meal: "Lunch", name: "Black Bean Burrito Bowl", emoji: "🌮",
    description: "Spiced black beans, brown rice, corn, avocado, pico de gallo & lime",
    calories: 510, protein: 18, carbs: 78, fat: 14,
    cookTime: "15 min", cookTimeMinutes: 15,
    cuisine: ["Mexican"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["luteal"],
    insight: "Magnesium in black beans helps reduce PMS cramping and mood swings",
    tags: ["vegan", "gluten-free", "high-fiber"],
    ingredients: ["1 can black beans drained", "1 cup brown rice cooked", "½ cup corn", "1 avocado", "2 tomatoes diced", "½ red onion", "Lime, cumin, fresh coriander"],
    steps: ["Warm beans with cumin and a pinch of salt.", "Make pico: tomato, onion, coriander, lime.", "Assemble bowl: rice, beans, corn, avocado, pico.", "Finish with lime juice."],
    proTip: "Add hot sauce or chipotle crema if you like heat.",
  },
  {
    meal: "Lunch", name: "Indian Red Dal & Rice", emoji: "🫘",
    description: "Spiced red lentil dal with turmeric & ginger on brown rice",
    calories: 490, protein: 22, carbs: 76, fat: 8,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Indian"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Lentils are packed with iron and folate — essential during menstrual phase",
    tags: ["vegan", "gluten-free", "iron-rich"],
    ingredients: ["¾ cup red lentils", "1 cup brown rice", "1 can crushed tomatoes", "1 tsp turmeric", "1 tsp cumin", "1-inch ginger grated", "2 garlic cloves", "Fresh coriander"],
    steps: ["Cook rice.", "Simmer lentils in 2 cups water 15 min until soft.", "Temper: heat oil, add cumin, garlic, ginger 1 min.", "Add tomatoes, turmeric, lentils. Simmer 10 min.", "Serve over rice, top with coriander."],
    proTip: "A squeeze of lemon at the end brightens the whole dish.",
  },
  {
    meal: "Lunch", name: "Salmon Sushi Bowl", emoji: "🐟",
    description: "Sushi rice, salmon, avocado, cucumber, edamame & tamari drizzle",
    calories: 540, protein: 36, carbs: 58, fat: 18,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Japanese"], allergens: ["Fish", "Soy"], dietary: ["gluten-free", "dairy-free", "pescatarian"],
    phases: ["menstrual", "follicular"],
    insight: "Omega-3s in salmon reduce inflammation and support mood during your period",
    tags: ["omega-3", "high-protein", "anti-inflammatory"],
    ingredients: ["1 cup sushi rice", "150g sashimi-grade salmon cubed", "½ avocado", "½ cucumber julienned", "½ cup edamame", "1 tbsp tamari", "1 tsp sesame oil", "Sesame seeds, pickled ginger"],
    steps: ["Cook sushi rice with rice vinegar and a pinch of salt.", "Arrange salmon, avocado, cucumber, edamame in bowl.", "Drizzle tamari and sesame oil.", "Top with sesame seeds and pickled ginger."],
    proTip: "Use a rice paddle to fold vinegar into rice for authentic texture.",
  },

  {
    meal: "Lunch", name: "Greek Chicken Souvlaki Bowl", emoji: "🫙",
    description: "Marinated grilled chicken, tzatziki, tomatoes, cucumber & warm pitta",
    calories: 540, protein: 42, carbs: 44, fat: 18,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Greek", "Mediterranean"], allergens: ["Dairy", "Gluten"], dietary: [],
    phases: ["follicular", "ovulatory"],
    insight: "Lean chicken provides B6 which helps regulate hormones in the follicular phase",
    tags: ["high-protein", "mediterranean"],
    ingredients: ["200g chicken breast", "1 GF pitta", "½ cup Greek yogurt", "½ cucumber grated", "1 garlic clove", "1 tomato diced", "¼ red onion", "Fresh dill", "Lemon juice", "Olive oil", "Oregano"],
    steps: ["Marinate chicken in lemon, olive oil, oregano 10 min.", "Grill or pan-fry 5-6 min per side.", "Mix yogurt, cucumber, garlic, dill for tzatziki.", "Warm pitta. Slice chicken and assemble bowl."],
    proTip: "Marinate chicken the night before for deeper flavour.",
  },
  {
    meal: "Lunch", name: "Korean Bibimbap", emoji: "🍲",
    description: "Warm rice bowl with seasoned vegetables, gochujang sauce & a fried egg",
    calories: 510, protein: 22, carbs: 68, fat: 16,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Korean"], allergens: ["Eggs", "Soy"], dietary: ["vegetarian", "gluten-free", "dairy-free"],
    phases: "all",
    insight: "The variety of vegetables provides phytonutrients that support liver detox of excess hormones",
    tags: ["gut-health", "gluten-free", "probiotic"],
    ingredients: ["1 cup cooked brown rice", "1 egg", "1 cup spinach", "½ cup shredded carrot", "½ cup bean sprouts", "2 tbsp gochujang", "1 tsp sesame oil", "1 tsp tamari", "Sesame seeds"],
    steps: ["Sauté each vegetable separately in sesame oil with a dash of tamari.", "Fry egg sunny-side up.", "Place rice in bowl, arrange vegetables around edges.", "Top with egg and gochujang. Mix before eating."],
    proTip: "Use a hot stone bowl if you have one — the crispy rice bottom is incredible.",
  },
  {
    meal: "Lunch", name: "Thai Larb Salad", emoji: "🌿",
    description: "Minced chicken with toasted rice, lime, fish sauce, mint & chili",
    calories: 430, protein: 36, carbs: 24, fat: 18,
    cookTime: "20 min", cookTimeMinutes: 20,
    cuisine: ["Thai"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["ovulatory", "follicular"],
    insight: "Mint and lime support liver function which is essential for hormone clearance",
    tags: ["high-protein", "gluten-free", "dairy-free", "anti-inflammatory"],
    ingredients: ["250g minced chicken", "2 tbsp toasted rice powder", "2 shallots sliced", "Fresh mint & coriander", "2 tbsp lime juice", "1 tbsp fish sauce", "1 red chili sliced", "Lettuce cups to serve"],
    steps: ["Toast raw rice in dry pan until golden, grind to powder.", "Cook mince in pan until no longer pink.", "Remove from heat. Mix in lime, fish sauce, shallots, chili.", "Toss with herbs and rice powder.", "Serve in lettuce cups."],
    proTip: "Make extra toasted rice powder — it keeps in a jar for weeks.",
  },
  {
    meal: "Lunch", name: "Turkish Red Lentil Soup", emoji: "🫘",
    description: "Silky red lentil soup with cumin, paprika, lemon & a chili butter swirl",
    calories: 420, protein: 22, carbs: 58, fat: 12,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Turkish", "Middle Eastern"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Red lentils are high in folate and iron — essential during the menstrual phase",
    tags: ["iron-rich", "vegan", "gluten-free", "warming"],
    ingredients: ["1 cup red lentils", "1 onion diced", "2 garlic cloves", "1 tsp cumin", "1 tsp paprika", "4 cups vegetable broth", "1 tbsp olive oil", "Lemon juice", "Fresh parsley"],
    steps: ["Sauté onion and garlic in olive oil until soft.", "Add spices, cook 1 min.", "Add lentils and broth, simmer 20 min.", "Blend until smooth.", "Season with lemon juice. Top with a swirl of chili oil and parsley."],
    proTip: "Double the batch — this freezes perfectly for up to 3 months.",
  },
  {
    meal: "Lunch", name: "Ethiopian Misir Wat", emoji: "🫙",
    description: "Slow-cooked spiced red lentils with berbere, served with GF injera",
    calories: 480, protein: 24, carbs: 68, fat: 12,
    cookTime: "35 min", cookTimeMinutes: 35,
    cuisine: ["Ethiopian"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Berbere spice blend contains fenugreek which can help regulate blood sugar and reduce PMS",
    tags: ["iron-rich", "vegan", "gluten-free", "warming"],
    ingredients: ["1 cup red lentils", "2 onions finely diced", "3 tbsp berbere spice", "3 garlic cloves", "1-inch ginger", "3 tbsp olive oil", "2 cups vegetable broth", "GF injera or rice to serve"],
    steps: ["Cook onions in oil on low heat for 15 min until deeply caramelised.", "Add garlic, ginger, berbere — cook 3 min.", "Add lentils and broth, simmer 20 min stirring.", "Adjust thickness to taste. Serve on injera or rice."],
    proTip: "The key is low and slow for the onions — don't rush this step.",
  },
  {
    meal: "Lunch", name: "Peruvian Quinoa Salad", emoji: "🥗",
    description: "Tri-colour quinoa, roasted sweet potato, black beans, avocado & aji amarillo dressing",
    calories: 490, protein: 18, carbs: 62, fat: 20,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Peruvian", "American"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Quinoa is a complete protein containing all essential amino acids — rare for a plant food",
    tags: ["vegan", "gluten-free", "complete-protein"],
    ingredients: ["¾ cup tri-colour quinoa", "1 small sweet potato cubed", "½ cup black beans", "½ avocado sliced", "Fresh coriander", "Lime juice", "1 tsp aji amarillo paste", "Olive oil"],
    steps: ["Cook quinoa per packet. Roast sweet potato at 200°C for 20 min.", "Whisk lime juice, olive oil and aji amarillo for dressing.", "Combine quinoa, beans, sweet potato.", "Top with avocado and coriander, drizzle dressing."],
    proTip: "Aji amarillo paste is available in most Latin supermarkets — it's worth finding.",
  },
  {
    meal: "Lunch", name: "Vietnamese Chicken Pho", emoji: "🍜",
    description: "Fragrant chicken broth with rice noodles, bean sprouts, basil & lime",
    calories: 460, protein: 34, carbs: 52, fat: 10,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Vietnamese"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Bone broth-style soups support collagen production and reduce period inflammation",
    tags: ["gluten-free", "dairy-free", "warming", "anti-inflammatory"],
    ingredients: ["200g chicken breast", "150g rice noodles", "4 cups chicken broth", "Star anise", "Cinnamon stick", "1-inch ginger", "Bean sprouts", "Fresh Thai basil", "Lime wedges", "Hoisin sauce"],
    steps: ["Simmer broth with star anise, cinnamon, ginger for 15 min. Strain.", "Poach chicken in broth 12 min, slice thinly.", "Cook rice noodles per packet.", "Assemble bowl with noodles, chicken and hot broth.", "Serve with sprouts, basil, lime and hoisin on the side."],
    proTip: "The better the broth, the better the pho — use a good quality stock.",
  },
  {
    meal: "Lunch", name: "Spanish Chickpea & Spinach Stew", emoji: "🫘",
    description: "Andalusian-style chickpeas slow-cooked with smoked paprika, spinach & sherry vinegar",
    calories: 440, protein: 20, carbs: 54, fat: 14,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Spanish", "Mediterranean"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual", "follicular"],
    insight: "Chickpeas are rich in zinc which supports follicle development and ovulation",
    tags: ["iron-rich", "vegan", "gluten-free", "warming"],
    ingredients: ["1 can chickpeas drained", "2 cups baby spinach", "1 onion diced", "3 garlic cloves", "1 tsp smoked paprika", "½ tsp cumin", "1 can chopped tomatoes", "1 tbsp sherry vinegar", "Olive oil"],
    steps: ["Sauté onion in olive oil until soft.", "Add garlic, paprika, cumin — cook 1 min.", "Add tomatoes and chickpeas, simmer 15 min.", "Stir in spinach until wilted.", "Finish with sherry vinegar and season well."],
    proTip: "A splash of sherry vinegar at the end brightens the whole dish.",
  },

  // SNACKS
  {
    meal: "Snack", name: "Apple & Almond Butter", emoji: "🍎",
    description: "Sliced Granny Smith with 2 tbsp almond butter & cinnamon",
    calories: 220, protein: 6, carbs: 24, fat: 14,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["American"], allergens: ["Nuts"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: "all",
    insight: "Balanced blood sugar = steady hormones throughout the day",
    tags: ["no-cook", "natural-sugar", "healthy-fats"],
    ingredients: ["1 apple sliced", "2 tbsp almond butter", "Pinch of cinnamon"],
    steps: ["Slice apple.", "Serve with almond butter.", "Dust with cinnamon."],
    proTip: "Granny Smith has lower sugar than sweeter varieties.",
  },
  {
    meal: "Snack", name: "Greek Yogurt & Berries", emoji: "🫙",
    description: "Full-fat Greek yogurt with mixed berries, honey & crushed pistachios",
    calories: 190, protein: 14, carbs: 22, fat: 6,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Mediterranean", "American"], allergens: ["Dairy", "Nuts"], dietary: ["vegetarian", "gluten-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Probiotics in Greek yogurt support the gut-hormone axis",
    tags: ["probiotic", "high-protein", "gluten-free"],
    ingredients: ["¾ cup full-fat Greek yogurt", "½ cup mixed berries", "1 tsp honey", "1 tbsp crushed pistachios"],
    steps: ["Spoon yogurt into bowl.", "Top with berries.", "Drizzle honey and add pistachios."],
    proTip: "Strain overnight for labneh-style thickness.",
  },
  {
    meal: "Snack", name: "Edamame with Sea Salt", emoji: "🟢",
    description: "Steamed edamame pods with flaky sea salt & a squeeze of lemon",
    calories: 160, protein: 14, carbs: 12, fat: 6,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Japanese", "Asian"], allergens: ["Soy"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Phytoestrogens in soy support estrogen balance in the follicular phase",
    tags: ["vegan", "high-protein", "gluten-free"],
    ingredients: ["1 cup frozen edamame", "Flaky sea salt", "Juice of ½ lemon"],
    steps: ["Steam or microwave edamame 3-4 min.", "Toss with sea salt and lemon."],
    proTip: "Sprinkle with chili flakes and furikake for extra flavour.",
  },
  {
    meal: "Snack", name: "Hummus & Rainbow Veg", emoji: "🥕",
    description: "Creamy hummus with carrots, cucumber & bell pepper for dipping",
    calories: 180, protein: 8, carbs: 20, fat: 8,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Middle Eastern", "Mediterranean"], allergens: ["Sesame"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: "all",
    insight: "Chickpeas are a great plant-based protein and fiber source",
    tags: ["vegan", "no-cook", "high-fiber"],
    ingredients: ["4 tbsp hummus", "2 carrots cut into sticks", "½ cucumber sliced", "1 bell pepper cut into strips"],
    steps: ["Cut vegetables.", "Serve with hummus."],
    proTip: "Blend canned chickpeas, tahini, lemon & garlic for 5-min homemade hummus.",
  },
  {
    meal: "Snack", name: "Dark Chocolate & Walnuts", emoji: "🍫",
    description: "3 squares 85% dark chocolate with a small handful of walnuts",
    calories: 200, protein: 4, carbs: 16, fat: 14,
    cookTime: "2 min", cookTimeMinutes: 2,
    cuisine: ["American"], allergens: ["Nuts"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["luteal"],
    insight: "Magnesium in dark chocolate reduces PMS cravings and mood swings",
    tags: ["magnesium", "no-cook", "antioxidants"],
    ingredients: ["3 squares 85% dark chocolate", "Small handful of walnuts"],
    steps: ["Plate chocolate and walnuts.", "Enjoy mindfully."],
    proTip: "85%+ keeps sugar low while maximising the magnesium hit.",
  },

  {
    meal: "Snack", name: "Dates & Almond Butter", emoji: "🌴",
    description: "Medjool dates stuffed with almond butter & a sprinkle of sea salt",
    calories: 200, protein: 4, carbs: 32, fat: 8,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Middle Eastern", "American"], allergens: ["Nuts"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["luteal", "menstrual"],
    insight: "Dates are rich in magnesium which eases cramps and supports sleep during luteal phase",
    tags: ["magnesium-rich", "vegan", "gluten-free", "natural-sugar"],
    ingredients: ["3 Medjool dates", "1 tbsp almond butter", "Flaky sea salt"],
    steps: ["Pit the dates.", "Fill each with a small spoon of almond butter.", "Sprinkle with sea salt."],
    proTip: "Freeze them for 20 min for a fudge-like texture.",
  },
  {
    meal: "Snack", name: "Mango Lassi", emoji: "🥭",
    description: "Chilled blended mango, yogurt, cardamom & honey",
    calories: 190, protein: 8, carbs: 34, fat: 3,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Indian"], allergens: ["Dairy"], dietary: ["vegetarian", "gluten-free"],
    phases: ["ovulatory", "follicular"],
    insight: "Yogurt provides probiotics that support the gut-hormone connection",
    tags: ["probiotic", "gluten-free", "gut-health"],
    ingredients: ["½ cup frozen mango", "½ cup Greek yogurt", "¼ cup milk or almond milk", "1 tsp honey", "Pinch of cardamom"],
    steps: ["Blend all ingredients until smooth.", "Add more milk to adjust consistency.", "Serve chilled."],
    proTip: "Use coconut yogurt to make it dairy-free.",
  },
  {
    meal: "Snack", name: "Rice Cakes with Avocado", emoji: "🫓",
    description: "Crispy rice cakes topped with smashed avocado, sesame & chili flakes",
    calories: 170, protein: 3, carbs: 22, fat: 9,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["American", "Korean"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: "all",
    insight: "Avocado's healthy fats are the building blocks for steroid hormones",
    tags: ["vegan", "gluten-free", "dairy-free", "healthy-fats"],
    ingredients: ["2 plain rice cakes", "½ small avocado", "Chili flakes", "Sesame seeds", "Lemon juice", "Salt"],
    steps: ["Smash avocado with lemon juice and salt.", "Spread onto rice cakes.", "Top with chili flakes and sesame seeds."],
    proTip: "Add a drizzle of tamari for a savoury umami kick.",
  },
  {
    meal: "Snack", name: "Pumpkin Seeds & Cranberries", emoji: "🎃",
    description: "Roasted pumpkin seeds with dried cranberries and a pinch of cinnamon",
    calories: 180, protein: 6, carbs: 18, fat: 10,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["American"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Pumpkin seeds are one of the richest plant sources of zinc — key for progesterone production",
    tags: ["zinc-rich", "vegan", "gluten-free", "dairy-free"],
    ingredients: ["3 tbsp pumpkin seeds", "2 tbsp dried cranberries", "Pinch of cinnamon", "Pinch of sea salt"],
    steps: ["Toast pumpkin seeds in dry pan 2-3 min until they pop.", "Mix with cranberries, cinnamon and salt.", "Cool before eating."],
    proTip: "Make a big batch and keep in a jar — great for topping salads too.",
  },
  {
    meal: "Snack", name: "Matcha Chia Pudding", emoji: "🍵",
    description: "Mini chia pudding with ceremonial matcha, coconut milk & honey",
    calories: 160, protein: 5, carbs: 18, fat: 8,
    cookTime: "5 min (+ 2h set)", cookTimeMinutes: 5,
    cuisine: ["Japanese", "American"], allergens: [], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Matcha's L-theanine supports calm focus — ideal during the high-energy ovulatory phase",
    tags: ["antioxidants", "vegan", "gluten-free", "dairy-free"],
    ingredients: ["2 tbsp chia seeds", "¾ cup coconut milk", "1 tsp ceremonial matcha", "1 tsp honey"],
    steps: ["Whisk matcha with 2 tbsp warm water until smooth.", "Mix with coconut milk and honey.", "Stir in chia seeds, mix well.", "Refrigerate at least 2 hours until set."],
    proTip: "Stir again after 30 min to prevent clumping at the bottom.",
  },
  {
    meal: "Snack", name: "Cucumber & Tzatziki", emoji: "🥒",
    description: "Fresh cucumber spears with garlicky Greek yogurt tzatziki",
    calories: 120, protein: 8, carbs: 10, fat: 4,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["Greek", "Mediterranean"], allergens: ["Dairy"], dietary: ["vegetarian", "gluten-free"],
    phases: "all",
    insight: "Cucumber is a natural diuretic that helps reduce bloating throughout the cycle",
    tags: ["probiotic", "gluten-free", "low-calorie"],
    ingredients: ["1 cucumber cut into spears", "½ cup Greek yogurt", "1 garlic clove grated", "1 tbsp fresh dill", "Lemon juice", "Salt"],
    steps: ["Grate garlic into yogurt.", "Stir in dill, lemon juice and salt.", "Serve cucumber spears alongside for dipping."],
    proTip: "Grate and squeeze excess water from the cucumber into the yogurt for a thicker dip.",
  },
  {
    meal: "Snack", name: "Banana & Walnut Bites", emoji: "🍌",
    description: "Sliced banana rounds topped with walnut pieces and a drizzle of honey",
    calories: 190, protein: 4, carbs: 30, fat: 8,
    cookTime: "5 min", cookTimeMinutes: 5,
    cuisine: ["American"], allergens: ["Nuts"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["luteal"],
    insight: "Walnuts are the richest plant source of omega-3 which helps reduce luteal phase inflammation",
    tags: ["omega-3", "vegan", "gluten-free", "natural-sugar"],
    ingredients: ["1 banana sliced", "2 tbsp walnuts roughly chopped", "1 tsp honey", "Pinch of cinnamon"],
    steps: ["Arrange banana rounds on a plate.", "Top each with a piece of walnut.", "Drizzle honey and dust with cinnamon."],
    proTip: "Freeze the banana first for a more satisfying, cold snack.",
  },

  // DINNERS
  {
    meal: "Dinner", name: "Lemon Herb Salmon & Sweet Potato", emoji: "🐟",
    description: "Baked salmon fillet, roasted sweet potato, steamed broccoli",
    calories: 580, protein: 42, carbs: 44, fat: 18,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Mediterranean", "American"], allergens: ["Fish"], dietary: ["gluten-free", "dairy-free", "pescatarian"],
    phases: ["menstrual", "follicular"],
    insight: "Omega-3s in salmon reduce inflammation and cramping",
    tags: ["omega-3", "high-protein", "anti-inflammatory"],
    ingredients: ["1 salmon fillet (180g)", "1 medium sweet potato cubed", "2 cups broccoli florets", "2 tbsp olive oil", "1 lemon", "Fresh dill & thyme"],
    steps: ["Preheat oven 200°C/400°F.", "Toss sweet potato with olive oil, roast 15 min.", "Add salmon, lemon, herbs, broccoli to tray.", "Roast 12-15 min until salmon flakes.", "Squeeze lemon over before serving."],
    proTip: "One tray, minimal dishes — sweet potato and salmon cook at the same temp.",
  },
  {
    meal: "Dinner", name: "Chickpea Comfort Bowl", emoji: "🫘",
    description: "Spiced chickpeas, roasted cauliflower, tahini drizzle & warm flatbread",
    calories: 510, protein: 20, carbs: 62, fat: 18,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Middle Eastern", "Mediterranean"], allergens: ["Sesame"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["luteal"],
    insight: "Chickpeas support progesterone production during the luteal phase",
    tags: ["vegan", "high-fiber", "iron-rich"],
    ingredients: ["1 can chickpeas drained", "½ head cauliflower", "2 tbsp tahini", "1 tsp cumin", "1 tsp turmeric", "Olive oil", "GF flatbread"],
    steps: ["Roast cauliflower at 200°C for 20 min.", "Fry chickpeas with spices until crispy.", "Thin tahini with water and lemon.", "Assemble bowl, drizzle tahini, serve with flatbread."],
    proTip: "Add a dollop of Greek yogurt if not vegan — extra creaminess and protein.",
  },
  {
    meal: "Dinner", name: "Jerk Chicken with Rice & Peas", emoji: "🍗",
    description: "Marinated jerk chicken with coconut rice & kidney beans, fresh thyme",
    calories: 620, protein: 46, carbs: 64, fat: 14,
    cookTime: "35 min", cookTimeMinutes: 35,
    cuisine: ["Jamaican", "Caribbean"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["ovulatory", "luteal"],
    insight: "Kidney beans provide iron and protein for high-energy ovulatory phase",
    tags: ["high-protein", "gluten-free", "iron-rich"],
    ingredients: ["2 chicken thighs", "2 tbsp jerk seasoning", "1 cup long-grain rice", "1 can kidney beans drained", "1 cup coconut milk", "2 garlic cloves", "Fresh thyme"],
    steps: ["Marinate chicken in jerk seasoning 30 min.", "Grill or bake at 200°C for 30-35 min.", "Simmer rice with coconut milk, beans, garlic and thyme.", "Serve chicken on coconut rice & peas."],
    proTip: "Overnight marinating makes a huge difference to depth of flavour.",
  },
  {
    meal: "Dinner", name: "Teriyaki Salmon Bowl", emoji: "🍱",
    description: "Glazed teriyaki salmon on brown rice with broccoli & sesame",
    calories: 560, protein: 38, carbs: 52, fat: 18,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Japanese"], allergens: ["Fish", "Gluten", "Soy"], dietary: ["dairy-free", "pescatarian"],
    phases: ["menstrual", "follicular"],
    insight: "DHA in salmon supports brain health and mood regulation",
    tags: ["omega-3", "high-protein", "anti-inflammatory"],
    ingredients: ["1 salmon fillet (180g)", "2 tbsp soy sauce", "1 tbsp mirin", "1 tsp honey", "1 cup brown rice", "2 cups broccoli florets", "1 tsp sesame seeds", "Pickled ginger"],
    steps: ["Cook brown rice.", "Mix soy, mirin, honey for teriyaki glaze.", "Pan-fry salmon 4 min per side, basting with glaze.", "Steam broccoli 4 min.", "Assemble bowl, top with sesame and ginger."],
    proTip: "Let the salmon rest 2 min before slicing — it'll flake beautifully.",
  },
  {
    meal: "Dinner", name: "Indian Butter Chicken (Light)", emoji: "🍛",
    description: "Tender chicken in lighter tomato-spiced sauce with Greek yogurt",
    calories: 560, protein: 42, carbs: 28, fat: 26,
    cookTime: "35 min", cookTimeMinutes: 35,
    cuisine: ["Indian"], allergens: ["Dairy"], dietary: ["gluten-free"],
    phases: ["follicular", "luteal"],
    insight: "Turmeric and ginger in this curry are powerfully anti-inflammatory",
    tags: ["high-protein", "gluten-free", "anti-inflammatory"],
    ingredients: ["200g chicken breast cubed", "1 can crushed tomatoes", "3 tbsp Greek yogurt", "1 tsp garam masala", "1 tsp turmeric", "1 tsp cumin", "2 garlic cloves", "1-inch ginger", "Fresh coriander", "Brown rice"],
    steps: ["Blend tomatoes, spices, garlic, ginger into sauce.", "Simmer sauce 10 min.", "Add chicken, cook 15 min.", "Stir in Greek yogurt off the heat.", "Serve over brown rice, top with coriander."],
    proTip: "Greek yogurt instead of cream cuts calories while keeping it creamy.",
  },
  {
    meal: "Dinner", name: "Mexican Chicken Taco Bowl", emoji: "🌮",
    description: "Spiced chicken, black beans, corn, avocado & fresh salsa",
    calories: 530, protein: 38, carbs: 52, fat: 16,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Mexican"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: "all",
    insight: "Cumin and chili support healthy circulation and metabolism",
    tags: ["high-protein", "gluten-free", "dairy-free"],
    ingredients: ["200g chicken breast", "1 tbsp taco spice mix", "½ cup black beans", "½ cup corn", "1 avocado", "2 tomatoes diced", "½ red onion", "Lime, fresh coriander", "Brown rice"],
    steps: ["Season chicken with taco spices, pan-fry 6-7 min each side.", "Slice chicken.", "Cook rice.", "Make salsa: tomato, onion, coriander, lime.", "Assemble bowl and finish with lime juice."],
    proTip: "Char the corn in a dry pan for smoky flavour — takes 3 min.",
  },
  {
    meal: "Dinner", name: "Ginger Beef & Bok Choy", emoji: "🥩",
    description: "Tender beef strips with bok choy & mushrooms in ginger-garlic sauce",
    calories: 540, protein: 38, carbs: 34, fat: 22,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Chinese", "Asian"], allergens: ["Gluten", "Soy"], dietary: ["dairy-free"],
    phases: ["menstrual", "follicular"],
    insight: "Iron-rich beef helps replenish what's lost during menstruation",
    tags: ["high-protein", "iron-rich", "anti-inflammatory"],
    ingredients: ["200g beef sirloin sliced thin", "2 heads bok choy halved", "1 cup shiitake mushrooms", "3 garlic cloves", "1-inch ginger", "3 tbsp soy sauce", "1 tbsp oyster sauce", "Steamed rice"],
    steps: ["Cook rice.", "Stir-fry beef in high heat 2-3 min, remove.", "Sauté garlic and ginger.", "Add mushrooms and bok choy 3 min.", "Return beef, add soy and oyster sauce, toss."],
    proTip: "Freeze beef 15 min before slicing for easier thin cuts.",
  },
  {
    meal: "Dinner", name: "Mediterranean Baked Cod", emoji: "🐠",
    description: "Herb-crusted cod with cherry tomatoes, olives & capers on lemon quinoa",
    calories: 490, protein: 40, carbs: 28, fat: 18,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Mediterranean"], allergens: ["Fish"], dietary: ["gluten-free", "dairy-free", "pescatarian"],
    phases: ["follicular", "ovulatory"],
    insight: "Light white fish supports the follicular energy surge without heaviness",
    tags: ["omega-3", "high-protein", "anti-inflammatory"],
    ingredients: ["1 cod fillet (180g)", "1 cup cherry tomatoes", "¼ cup olives", "2 tbsp capers", "2 garlic cloves", "Fresh parsley & oregano", "½ cup quinoa", "1 lemon", "Olive oil"],
    steps: ["Cook quinoa with lemon zest.", "Place cod in baking dish with tomatoes, olives, capers, garlic.", "Drizzle olive oil, season with herbs.", "Bake at 190°C for 18-20 min.", "Serve on quinoa, squeeze lemon over everything."],
    proTip: "Cod is done when it flakes easily with a fork — don't overcook.",
  },
  {
    meal: "Dinner", name: "Thai Green Curry", emoji: "🍛",
    description: "Creamy coconut green curry with chicken, courgette & jasmine rice",
    calories: 580, protein: 38, carbs: 52, fat: 22,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Thai"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["luteal", "menstrual"],
    insight: "Coconut milk contains lauric acid which supports immune function during the menstrual phase",
    tags: ["gluten-free", "dairy-free", "warming", "anti-inflammatory"],
    ingredients: ["200g chicken breast sliced", "1 can coconut milk", "2 tbsp green curry paste", "1 courgette sliced", "1 cup jasmine rice", "1 tbsp fish sauce", "1 tsp palm sugar", "Fresh Thai basil", "Lime"],
    steps: ["Cook rice per packet.", "Fry curry paste in pan 1 min.", "Add coconut milk, bring to simmer.", "Add chicken and courgette, cook 12-15 min.", "Season with fish sauce and sugar.", "Serve over rice with basil and lime."],
    proTip: "Don't boil the coconut milk too hard — it splits and loses its creaminess.",
  },
  {
    meal: "Dinner", name: "Korean Bulgogi Bowl", emoji: "🥩",
    description: "Marinated beef with pear, soy & sesame over rice with pickled vegetables",
    calories: 600, protein: 40, carbs: 56, fat: 20,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Korean"], allergens: ["Soy"], dietary: ["gluten-free", "dairy-free"],
    phases: ["menstrual", "follicular"],
    insight: "Red meat provides haem iron — the most bioavailable form, crucial during menstruation",
    tags: ["iron-rich", "gluten-free", "dairy-free", "high-protein"],
    ingredients: ["200g beef sirloin thinly sliced", "½ Asian pear grated", "3 tbsp tamari", "1 tbsp sesame oil", "3 garlic cloves", "1 tsp ginger", "1 cup cooked rice", "Pickled daikon", "Sesame seeds", "Scallions"],
    steps: ["Mix pear, tamari, sesame oil, garlic, ginger for marinade.", "Marinate beef at least 15 min.", "Cook beef in hot pan 2-3 min each side.", "Serve over rice with pickled daikon, scallions and sesame seeds."],
    proTip: "Freeze the beef slightly before slicing — it makes paper-thin cuts easy.",
  },
  {
    meal: "Dinner", name: "Greek Lemon Chicken Orzo", emoji: "🍋",
    description: "One-pan juicy chicken thighs with orzo, lemon, olives & feta",
    calories: 570, protein: 42, carbs: 48, fat: 22,
    cookTime: "35 min", cookTimeMinutes: 35,
    cuisine: ["Greek", "Mediterranean"], allergens: ["Dairy", "Gluten"], dietary: [],
    phases: ["follicular", "ovulatory"],
    insight: "Lemon supports liver detoxification — the liver processes and removes excess estrogen",
    tags: ["mediterranean", "high-protein", "one-pan"],
    ingredients: ["2 chicken thighs bone-in", "¾ cup orzo", "1 lemon zest & juice", "¼ cup kalamata olives", "50g feta", "2 garlic cloves", "2 cups chicken broth", "Fresh oregano", "Olive oil"],
    steps: ["Brown chicken thighs in olive oil 4 min per side, remove.", "Sauté garlic, add orzo and broth.", "Nestle chicken back in, add lemon zest and olives.", "Simmer covered 20 min until orzo is tender.", "Finish with lemon juice, feta and oregano."],
    proTip: "Use bone-in thighs — they stay juicy and add flavour to the broth.",
  },
  {
    meal: "Dinner", name: "Vietnamese Lemongrass Chicken", emoji: "🌿",
    description: "Caramelised lemongrass chicken thighs with jasmine rice & fresh herb salad",
    calories: 520, protein: 40, carbs: 44, fat: 18,
    cookTime: "30 min", cookTimeMinutes: 30,
    cuisine: ["Vietnamese"], allergens: ["Soy"], dietary: ["gluten-free", "dairy-free"],
    phases: ["ovulatory", "follicular"],
    insight: "Lemongrass has natural anti-inflammatory properties that support hormonal balance",
    tags: ["gluten-free", "dairy-free", "anti-inflammatory"],
    ingredients: ["2 chicken thighs boneless", "2 stalks lemongrass finely chopped", "3 garlic cloves", "1 tbsp fish sauce", "1 tsp palm sugar", "1 tbsp coconut oil", "1 cup jasmine rice", "Fresh mint, coriander, Thai basil", "Lime"],
    steps: ["Blend lemongrass, garlic, fish sauce and sugar into paste.", "Marinate chicken 15 min.", "Cook rice per packet.", "Pan-fry chicken in coconut oil 6-7 min per side until caramelised.", "Serve over rice with fresh herb salad and lime."],
    proTip: "Use only the bottom white part of the lemongrass — the green tops are too fibrous.",
  },
  {
    meal: "Dinner", name: "Moroccan Lamb Tagine", emoji: "🫕",
    description: "Slow-braised lamb with apricots, chickpeas, warming spices & couscous",
    calories: 620, protein: 40, carbs: 58, fat: 22,
    cookTime: "45 min", cookTimeMinutes: 45,
    cuisine: ["Middle Eastern", "Mediterranean"], allergens: ["Gluten"], dietary: ["dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Lamb is exceptionally rich in zinc and B12 which support the immune and hormonal systems",
    tags: ["iron-rich", "warming", "high-protein"],
    ingredients: ["250g lamb shoulder diced", "½ can chickpeas", "6 dried apricots halved", "1 onion", "2 garlic cloves", "1 tsp ras el hanout", "½ tsp cinnamon", "1 can tomatoes", "Couscous or rice to serve", "Fresh coriander"],
    steps: ["Brown lamb in oil, remove.", "Sauté onion and garlic, add spices 1 min.", "Return lamb, add tomatoes, chickpeas, apricots.", "Simmer covered 35-40 min until lamb is tender.", "Serve over couscous or rice with coriander."],
    proTip: "This tastes even better the next day — make it ahead.",
  },
  {
    meal: "Dinner", name: "Tofu & Broccoli Stir-Fry", emoji: "🥦",
    description: "Crispy tofu with tenderstem broccoli in a ginger miso glaze over brown rice",
    calories: 480, protein: 28, carbs: 52, fat: 18,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Japanese", "Asian"], allergens: ["Soy"], dietary: ["vegan", "gluten-free", "dairy-free"],
    phases: ["follicular", "ovulatory"],
    insight: "Miso is fermented and provides beneficial bacteria that support the gut-hormone axis",
    tags: ["vegan", "gluten-free", "probiotic", "plant-protein"],
    ingredients: ["200g firm tofu pressed & cubed", "200g tenderstem broccoli", "1 cup cooked brown rice", "2 tbsp white miso", "1 tbsp tamari", "1 tbsp rice vinegar", "1-inch ginger grated", "1 tbsp sesame oil", "Sesame seeds"],
    steps: ["Press tofu dry and pan-fry in oil until golden on all sides.", "Blanch broccoli 2 min.", "Whisk miso, tamari, vinegar, ginger for sauce.", "Toss tofu and broccoli in sauce over heat 2 min.", "Serve over rice with sesame seeds."],
    proTip: "Press the tofu overnight in the fridge for the crispiest results.",
  },
  {
    meal: "Dinner", name: "Baked Harissa Salmon", emoji: "🐟",
    description: "Salmon fillet roasted with harissa, lemon & served with turmeric cauliflower rice",
    calories: 540, protein: 42, carbs: 24, fat: 30,
    cookTime: "25 min", cookTimeMinutes: 25,
    cuisine: ["Middle Eastern", "Mediterranean"], allergens: [], dietary: ["gluten-free", "dairy-free"],
    phases: ["menstrual", "luteal"],
    insight: "Salmon omega-3s are the most effective natural remedy for reducing period pain",
    tags: ["omega-3", "gluten-free", "dairy-free", "anti-inflammatory"],
    ingredients: ["1 salmon fillet (200g)", "2 tbsp harissa paste", "1 lemon", "½ head cauliflower riced", "½ tsp turmeric", "1 garlic clove", "Fresh parsley", "Olive oil"],
    steps: ["Preheat oven to 200°C.", "Rub salmon with harissa and lemon juice, bake 15 min.", "Pulse cauliflower in food processor until rice-like.", "Sauté cauliflower rice with garlic and turmeric 5 min.", "Serve salmon over cauliflower rice with parsley."],
    proTip: "Don't overbake — salmon should still be slightly translucent in the centre.",
  },
];

// ── Ingredient extraction for grocery ─────────────────────────────────────────
const QTY_RE = /^([\d½¼¾⅓⅔\s]+(?:cup|tbsp|tsp|g|kg|oz|lb|ml|slices?|cans?|heads?|pieces?|handfuls?|pinch|drizzle|dash|scoop|squares?|bunches?|medium|large|small|ripe|frozen)s?\s+)/i;

function extractIngredientName(raw: string): string {
  return raw.replace(QTY_RE, "").replace(/^(a |an |some )/i, "").trim();
}

function categorizeIngredient(name: string): string {
  const l = name.toLowerCase();
  if (/\b(chicken|beef|salmon|cod|tuna|turkey|shrimp|prawn|fish|tofu|eggs?|lentils?|chickpeas?|black beans?|kidney beans?|dal)\b/.test(l)) return "Protein";
  if (/\b(broccoli|spinach|bok choy|cauliflower|tomatoes?|cucumber|onion|garlic|ginger|bell pepper|peppers?|scallion|spring onion|cabbage|mushroom|carrot|corn|kale|zucchini)\b/.test(l)) return "Vegetables";
  if (/\b(berries|mango|banana|apple|lemon|lime|plantain|dates?|avocado|cherry tomatoes?)\b/.test(l)) return "Fruits";
  if (/\b(rice|quinoa|oats?|pasta|bread|naan|flatbread|sushi rice|brown rice|long.grain rice)\b/.test(l)) return "Grains";
  if (/\b(yogurt|milk|feta|cheese|butter|cream)\b/.test(l)) return "Dairy";
  if (/\b(almond|walnut|pistachio|nuts?|seeds?|flaxseed|sesame|tahini|coconut flakes|granola|nut butter)\b/.test(l)) return "Seeds & Nuts";
  if (/\b(chocolate|honey|maple|sugar)\b/.test(l)) return "Treats";
  return "Pantry";
}

export function extractGroceryFromPlan(weekDays: WeekDay[]): import("@/types").GroceryItem[] {
  const map = new Map<string, { count: number; category: string }>();
  weekDays.forEach((day) => {
    day.meals.forEach((meal) => {
      meal.ingredients.forEach((raw) => {
        const name = extractIngredientName(raw);
        if (!name) return;
        const key = name.toLowerCase();
        const existing = map.get(key);
        if (existing) existing.count += 1;
        else map.set(key, { count: 1, category: categorizeIngredient(name) });
      });
    });
  });
  return Array.from(map.entries()).map(([key, { count, category }], i) => ({
    id: `plan-${Date.now()}-${i}`,
    name: count > 1 ? `${key} (×${count})` : key,
    category,
    checked: false,
  }));
}

// ── Meal selection logic ───────────────────────────────────────────────────────
function parseCookTimeLimit(cookingTime: string): number {
  const match = cookingTime.match(/\d+/);
  if (!match) return 60;
  const n = parseInt(match[0]);
  return n >= 60 ? 999 : n;
}

function getSlotCalTarget(slot: MealSlot, dailyGoal: number): number {
  return dailyGoal * ({ Breakfast: 0.25, Lunch: 0.35, Snack: 0.12, Dinner: 0.30 }[slot] ?? 0.25);
}

function getSlotProteinTarget(slot: MealSlot, dailyGoal: number): number {
  return dailyGoal * ({ Breakfast: 0.25, Lunch: 0.30, Snack: 0.10, Dinner: 0.35 }[slot] ?? 0.25);
}

function isMealSafe(m: WeekMeal, profile: UserProfile, enforCuisine = false): boolean {
  const userAllergies = profile.allergies.map((a) => a.toLowerCase());
  if (m.allergens.some((a) => userAllergies.includes(a.toLowerCase()))) return false;
  const diet = (profile.dietStyle || "").toLowerCase();
  if (diet.includes("vegan") && !m.dietary.includes("vegan")) return false;
  if (diet.includes("vegetarian") && !m.dietary.includes("vegetarian") && !m.dietary.includes("vegan")) return false;
  if (diet.includes("pescatarian") && !m.dietary.includes("vegan") && !m.dietary.includes("vegetarian") && !m.dietary.includes("pescatarian")) return false;
  const userDislikes = (profile.dislikes ?? []).map((d) => d.toLowerCase());
  if (userDislikes.length > 0) {
    const mealText = [m.name, m.description, ...m.ingredients].join(" ").toLowerCase();
    if (userDislikes.some((d) => mealText.includes(d))) return false;
  }
  if (enforCuisine && (profile.cuisines ?? []).length > 0) {
    if (!m.cuisine.some((c) => profile.cuisines.includes(c))) return false;
  }
  return true;
}

function scoreMeal(
  m: WeekMeal,
  phase: CyclePhase,
  profile: UserProfile,
  maxCookMin: number,
  likedMeals: string[],
): number {
  let score = 0;
  // Explicit likes
  if (likedMeals.includes(m.name)) score += 5;
  // Same cuisine as a liked meal
  const likedCuisines = MEAL_LIBRARY
    .filter((lib) => likedMeals.includes(lib.name))
    .flatMap((lib) => lib.cuisine);
  if (m.cuisine.some((c) => likedCuisines.includes(c))) score += 2;
  // Profile cuisine preference
  if (m.cuisine.some((c) => profile.cuisines.includes(c))) score += 3;
  // Phase fit
  if (m.phases === "all" || (m.phases as CyclePhase[]).includes(phase)) score += 2;
  // Cook time fits
  if (m.cookTimeMinutes <= maxCookMin) score += 1;
  return score;
}

function pickMealForSlot(
  slot: MealSlot,
  phase: CyclePhase,
  profile: UserProfile,
  safeLibrary: WeekMeal[],
  maxCookMin: number,
  usedDays: Map<string, number[]>,
  likedMeals: string[],
  dayIndex: number, // 0-6 week 1, 7-13 week 2
): WeekMeal {
  const weekStart = Math.floor(dayIndex / 7) * 7;
  const weekEnd = weekStart + 7;

  function isAllowed(m: WeekMeal): boolean {
    const days = usedDays.get(m.name) ?? [];
    const thisWeekDays = days.filter((d) => d >= weekStart && d < weekEnd);
    if (thisWeekDays.length >= 2) return false; // max 2x per week
    if (thisWeekDays.some((d) => Math.abs(dayIndex - d) < 3)) return false; // min 3 days apart
    return true;
  }

  const cuisineFiltered = MEAL_LIBRARY.filter((m) => isMealSafe(m, profile, true) && m.meal === slot);
  const basePool = cuisineFiltered.length >= 3 ? cuisineFiltered : safeLibrary.filter((m) => m.meal === slot);

  // Try allowed meals first, then relax to "not used this week", then full pool
  let candidates = basePool.filter(isAllowed);
  if (candidates.length === 0) candidates = basePool.filter((m) => !(usedDays.get(m.name) ?? []).some((d) => d >= weekStart && d < weekEnd));
  if (candidates.length === 0) candidates = basePool.length > 0 ? basePool : MEAL_LIBRARY.filter((m) => m.meal === slot);

  const calTarget = getSlotCalTarget(slot, profile.calorieGoal);
  const proteinTarget = getSlotProteinTarget(slot, profile.proteinGoal);
  const scored = candidates.map((m) => {
    const pref = scoreMeal(m, phase, profile, maxCookMin, likedMeals);
    const calDiff = Math.abs(m.calories - calTarget) / calTarget;
    const proteinDiff = Math.abs(m.protein - proteinTarget) / Math.max(proteinTarget, 1);
    const macro = 1 - (calDiff * 0.6 + proteinDiff * 0.4);
    return { meal: m, total: pref + macro };
  });
  scored.sort((a, b) => b.total - a.total);
  const picked = scored[0].meal;
  const existing = usedDays.get(picked.name) ?? [];
  usedDays.set(picked.name, [...existing, dayIndex]);
  return picked;
}

/** Build Mon–Sun for a given week offset (0 = current, 1 = next) */
function buildMonSunWeek(
  weekOffset: 0 | 1,
  profile: UserProfile,
  likedMeals: string[],
  usedDays: Map<string, number[]>,
  todayCycleDay?: number,
): WeekDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const safeLibrary = MEAL_LIBRARY.filter((m) => isMealSafe(m, profile));
  const maxCookMin = parseCookTimeLimit(profile.cookingTime || "30 min");
  const slots: MealSlot[] = profile.mealsPerDay >= 4
    ? ["Breakfast", "Lunch", "Snack", "Dinner"]
    : ["Breakfast", "Lunch", "Dinner"];
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: 7 }, (_, i) => {
    const dayIndex = weekOffset * 7 + i;
    const d = new Date(today);
    d.setDate(today.getDate() + daysToMonday + dayIndex);
    const daysFromToday = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    const baseDay = todayCycleDay ?? profile.cycleDay;
    const adjustedCycleDay = ((baseDay - 1 + daysFromToday) % profile.cycleLength) + 1;
    const phase = getPhaseForDay(adjustedCycleDay, profile.cycleLength);
    const meals = slots.map((slot) =>
      pickMealForSlot(slot, phase, profile, safeLibrary, maxCookMin, usedDays, likedMeals, dayIndex)
    );
    return {
      dayLabel: dayLabels[i],
      dateLabel: `${d.getDate()}/${d.getMonth() + 1}`,
      phase,
      meals,
      isPast: d < today,
    };
  });
}

function buildFullPlan(
  profile: UserProfile,
  likedMeals: string[],
  todayCycleDay?: number,
): { thisWeek: WeekDay[]; nextWeek: WeekDay[] } {
  const usedDays = new Map<string, number[]>();
  const thisWeek = buildMonSunWeek(0, profile, likedMeals, usedDays, todayCycleDay);
  const nextWeek = buildMonSunWeek(1, profile, likedMeals, usedDays, todayCycleDay);
  return { thisWeek, nextWeek };
}

function isPlanStale(generatedAt: string): boolean {
  const gen = new Date(generatedAt);
  const now = new Date();
  // Stale if generated before the start of the current Monday
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() + daysToMonday);
  thisMonday.setHours(0, 0, 0, 0);
  return gen < thisMonday;
}

// ── Meal Detail Modal ──────────────────────────────────────────────────────────
function MealDetailModal({ meal, visible, onClose, accentColor }: {
  meal: WeekMeal | null; visible: boolean; onClose: () => void; accentColor: string;
}) {
  if (!meal) return null;
  return (
    <Modal
      isVisible={visible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      swipeDirection="down"
      style={styles.rnModal}
      propagateSwipe
    >
      <View style={styles.modalSheet}>
        <View style={styles.modalHandle} />
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.detailTitle}>{meal.emoji} {meal.name}</Text>

            <View style={styles.detailMacroRow}>
              <View style={styles.detailMacroItem}>
                <Ionicons name="flame" size={12} color={DARK_THEME.textMuted} />
                <Text style={styles.detailKcal}>{meal.calories} kcal</Text>
              </View>
              <Text style={styles.detailMacroChip}>P:{meal.protein}g</Text>
              <Text style={styles.detailMacroChip}>C:{meal.carbs}g</Text>
              <Text style={styles.detailMacroChip}>F:{meal.fat}g</Text>
              <View style={styles.detailMacroItem}>
                <Ionicons name="time-outline" size={12} color={DARK_THEME.textMuted} />
                <Text style={styles.detailKcal}>{meal.cookTime}</Text>
              </View>
            </View>

            <View style={[styles.insightPill, { borderColor: `${accentColor}30`, backgroundColor: `${accentColor}08` }]}>
              <Text style={{ fontSize: 14 }}>🌱</Text>
              <Text style={[styles.insightText, { color: accentColor }]}>{meal.insight}</Text>
            </View>

            <View style={styles.tagsRow}>
              {meal.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailSectionHeader}>
                <Ionicons name="restaurant-outline" size={16} color={DARK_THEME.textPrimary} />
                <Text style={styles.detailSectionTitle}>Ingredients</Text>
                <Text style={styles.detailSectionCount}>({meal.ingredients.length} items)</Text>
              </View>
              {meal.ingredients.map((ing, i) => (
                <View key={i} style={styles.ingredientRow}>
                  <View style={[styles.bullet, { backgroundColor: accentColor }]} />
                  <Text style={styles.ingredientText}>{ing}</Text>
                </View>
              ))}
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Steps</Text>
              {meal.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={[styles.stepNum, { backgroundColor: `${accentColor}20` }]}>
                    <Text style={[styles.stepNumText, { color: accentColor }]}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.proTipCard, { borderColor: `${accentColor}20` }]}>
              <View style={styles.proTipHeader}>
                <Ionicons name="bulb-outline" size={14} color={accentColor} />
                <Text style={[styles.proTipLabel, { color: accentColor }]}>Pro tip:</Text>
              </View>
              <Text style={styles.proTipText}>{meal.proTip}</Text>
            </View>

            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.closeBtnText}>Done</Text>
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
    </Modal>
  );
}

// ── Meal fit scoring ───────────────────────────────────────────────────────────
type FitRating = "great" | "ok" | "caution";

// What each phase needs nutritionally — used to explain phase mismatches
const PHASE_NUTRITION: Record<CyclePhase, { needs: string; thisMealIs: string }> = {
  menstrual: {
    needs: "iron-rich foods, omega-3s and warming anti-inflammatory ingredients to ease cramping and replenish blood loss",
    thisMealIs: "better suited to a higher-energy phase when your body isn't in recovery mode",
  },
  follicular: {
    needs: "light, estrogen-supporting foods like cruciferous vegetables, fermented ingredients and varied nutrients to match your rising energy",
    thisMealIs: "designed for a different hormonal window and may not support the follicular energy surge",
  },
  ovulatory: {
    needs: "high-fiber and antioxidant-rich foods to help clear excess estrogen and sustain your peak energy window",
    thisMealIs: "not specifically built around fibre and antioxidants that support ovulation",
  },
  luteal: {
    needs: "complex carbs and magnesium-rich foods to stabilise mood, blood sugar and serotonin before your period",
    thisMealIs: "not optimised to address the blood sugar dips and mood fluctuations common in the luteal phase",
  },
};

function getMealFit(
  m: WeekMeal,
  slot: MealSlot,
  phase: CyclePhase,
  profile: UserProfile,
): { rating: FitRating; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Phase fit
  const phaseFit = m.phases === "all" || (m.phases as CyclePhase[]).includes(phase);
  if (phaseFit) {
    score += 2;
  } else {
    const { needs, thisMealIs } = PHASE_NUTRITION[phase];
    reasons.push(`${PHASE_INFO[phase].label} phase benefits from ${needs}. This meal is ${thisMealIs}.`);
  }

  // Calorie fit (within 25% of slot target)
  const calTarget = getSlotCalTarget(slot, profile.calorieGoal);
  const calRatio = m.calories / calTarget;
  if (calRatio >= 0.75 && calRatio <= 1.25) {
    score += 1;
  } else if (calRatio < 0.75) {
    reasons.push(`${Math.round((1 - calRatio) * 100)}% fewer calories than your target for this meal`);
  } else {
    reasons.push(`${Math.round((calRatio - 1) * 100)}% more calories than your target for this meal`);
  }

  // Protein fit (within 30% of slot target)
  const proteinTarget = getSlotProteinTarget(slot, profile.proteinGoal);
  if (m.protein >= proteinTarget * 0.7) {
    score += 1;
  } else {
    reasons.push(`Low protein — ${m.protein}g vs ~${Math.round(proteinTarget)}g target`);
  }

  const rating: FitRating = score >= 3 ? "great" : score >= 2 ? "ok" : "caution";
  return { rating, reasons };
}

const FIT_CONFIG: Record<FitRating, { color: string; icon: string; label: string }> = {
  great:   { color: "#4ECDC4", icon: "✦",  label: "Great fit" },
  ok:      { color: "#FBD168", icon: "~",  label: "OK fit" },
  caution: { color: "#f87171", icon: "!",  label: "Check this" },
};

// ── Swap Modal ─────────────────────────────────────────────────────────────────
function SwapModal({ meal, phase, visible, onClose, onSwap, accentColor, profile, likedMeals }: {
  meal: WeekMeal | null; phase: CyclePhase; visible: boolean; onClose: () => void;
  onSwap: (replacement: WeekMeal) => void; accentColor: string;
  profile: UserProfile; likedMeals: string[];
}) {
  const [search, setSearch] = useState("");

  const slot: MealSlot = (meal?.meal ?? "Lunch") as MealSlot;
  const safeLibrary = MEAL_LIBRARY.filter((m) => isMealSafe(m, profile));
  const filtered = safeLibrary.filter((m) =>
    m !== meal &&
    (search === "" ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.cuisine.some((c) => c.toLowerCase().includes(search.toLowerCase())) ||
      m.tags.some((t) => t.includes(search.toLowerCase())))
  );

  // Sort: great fit first, then liked, then slot match
  const withFit = filtered.map((m) => ({
    meal: m,
    fit: getMealFit(m, slot, phase, profile),
    liked: likedMeals.includes(m.name),
  }));
  withFit.sort((a, b) => {
    const ratingOrder = { great: 0, ok: 1, caution: 2 };
    const ratingDiff = ratingOrder[a.fit.rating] - ratingOrder[b.fit.rating];
    if (ratingDiff !== 0) return ratingDiff;
    return (b.liked ? 1 : 0) - (a.liked ? 1 : 0);
  });

  const greatCount = withFit.filter((x) => x.fit.rating === "great").length;
  const phaseInfo = PHASE_INFO[phase];

  return (
    <Modal
      isVisible={visible}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}
      swipeDirection="down"
      style={styles.rnModal}
      propagateSwipe
    >
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.swapHeader}>
            <View style={styles.swapHeaderLeft}>
              <Ionicons name="swap-horizontal" size={18} color={DARK_THEME.textPrimary} />
              <Text style={styles.swapTitle}>Swap Meal</Text>
            </View>
            <Pressable onPress={onClose} style={styles.swapCloseBtn}>
              <Ionicons name="close" size={18} color={DARK_THEME.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.swapSubtitle}>
            Replacing: <Text style={{ color: accentColor }}>{meal?.name}</Text>
          </Text>

          {/* Phase context banner */}
          <View style={[styles.phaseCtx, { backgroundColor: `${phaseInfo.color}10`, borderColor: `${phaseInfo.color}25` }]}>
            <Text style={{ fontSize: 13 }}>{phaseInfo.emoji}</Text>
            <Text style={[styles.phaseCtxText, { color: phaseInfo.color }]}>
              {phaseInfo.label} phase · {greatCount} meals optimised for now
            </Text>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={DARK_THEME.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name, cuisine, tags..."
              placeholderTextColor={DARK_THEME.textMuted}
            />
          </View>

          {/* Legend */}
          <View style={styles.fitLegend}>
            {(["great", "ok", "caution"] as FitRating[]).map((r) => (
              <View key={r} style={styles.fitLegendItem}>
                <View style={[styles.fitDot, { backgroundColor: FIT_CONFIG[r].color }]} />
                <Text style={styles.fitLegendText}>{FIT_CONFIG[r].label}</Text>
              </View>
            ))}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {withFit.map(({ meal: m, fit, liked }, i) => {
              const fitCfg = FIT_CONFIG[fit.rating];
              return (
                <Pressable
                  key={i}
                  onPress={() => { onSwap({ ...m, meal: slot }); onClose(); }}
                  style={styles.swapMealRow}
                >
                  {/* Fit indicator bar on left edge */}
                  <View style={[styles.fitBar, { backgroundColor: fitCfg.color }]} />

                  <Text style={styles.swapMealEmoji}>{m.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.swapMealTop}>
                      <Text style={styles.swapMealName} numberOfLines={1}>{m.name}</Text>
                      {liked && (
                        <Ionicons name="heart" size={12} color="#f472b6" style={{ marginRight: 4 }} />
                      )}
                      {/* Fit badge */}
                      <View style={[styles.fitBadge, { backgroundColor: `${fitCfg.color}20` }]}>
                        <Text style={[styles.fitBadgeText, { color: fitCfg.color }]}>
                          {fitCfg.icon} {fitCfg.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.swapCuisine}>{m.cuisine[0]} · {m.cookTime}</Text>

                    <View style={styles.swapMealMacros}>
                      <Ionicons name="flame" size={11} color={DARK_THEME.textMuted} />
                      <Text style={styles.swapKcal}>{m.calories} kcal</Text>
                      <Text style={styles.swapMacroChip}>P:{m.protein}g</Text>
                      <Text style={styles.swapMacroChip}>C:{m.carbs}g</Text>
                      <Text style={styles.swapMacroChip}>F:{m.fat}g</Text>
                    </View>

                    {/* Reasons shown for non-great fit */}
                    {fit.reasons.length > 0 && (
                      <View style={[styles.fitWarning, { borderColor: `${fitCfg.color}25`, backgroundColor: `${fitCfg.color}08` }]}>
                        {fit.reasons.map((r, ri) => (
                          <Text key={ri} style={[styles.fitWarningText, { color: fitCfg.color }]}>
                            · {r}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
    </Modal>
  );
}

// ── Meal Card ──────────────────────────────────────────────────────────────────
function MealCard({ meal, phase, isLiked, onDetail, onSwap, onLike, isPast }: {
  meal: WeekMeal; phase: typeof PHASE_INFO[CyclePhase]; isLiked: boolean;
  onDetail: () => void; onSwap: () => void; onLike: () => void; isPast: boolean;
}) {
  return (
    <GlowCard style={[styles.mealCard, isPast && styles.mealCardPast]}>
      <View style={styles.mealTopRow}>
        <View style={styles.mealTopLeft}>
          <Text style={[styles.mealEmoji, isPast && { opacity: 0.5 }]}>{meal.emoji}</Text>
          <View>
            <Text style={[styles.mealType, { color: isPast ? DARK_THEME.textMuted : phase.color }]}>{meal.meal}</Text>
            <Text style={styles.mealCuisine}>{meal.cuisine[0]}</Text>
          </View>
        </View>
        <View style={styles.mealActions}>
          <Pressable onPress={onLike} style={styles.likeBtn} hitSlop={8}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={17}
              color={isLiked ? "#f472b6" : DARK_THEME.textMuted}
            />
          </Pressable>
          <Pressable onPress={onDetail} style={styles.detailBtn} hitSlop={8}>
            <Ionicons name="chevron-forward" size={16} color={DARK_THEME.textMuted} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.mealName, isPast && { color: DARK_THEME.textSecondary }]}>{meal.name}</Text>
      <Text style={styles.mealDesc}>{meal.description}</Text>
      <View style={styles.mealMacroRow}>
        <View style={styles.mealMacroLeft}>
          <Ionicons name="flame" size={12} color={DARK_THEME.textMuted} />
          <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
          <Text style={styles.mealMacroChip}>P:{meal.protein}g</Text>
          <Text style={styles.mealMacroChip}>C:{meal.carbs}g</Text>
          <Text style={styles.mealMacroChip}>F:{meal.fat}g</Text>
        </View>
        <View style={styles.mealTimeRow}>
          <Ionicons name="time-outline" size={12} color={DARK_THEME.textMuted} />
          <Text style={styles.mealKcal}>{meal.cookTime}</Text>
        </View>
      </View>
      {meal.insight ? (
        <Text style={[styles.mealInsight, { color: phase.color }]}>{meal.insight}</Text>
      ) : null}
      {!isPast && (
        <Pressable onPress={onSwap} style={styles.swapBtn}>
          <Ionicons name="swap-horizontal" size={13} color={phase.color} />
          <Text style={[styles.swapBtnText, { color: phase.color }]}>Swap meal</Text>
        </Pressable>
      )}
    </GlowCard>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function PlanScreen() {
  const profile = useAppStore((s) => s.profile);
  const accentColor = useAppStore((s) => s.accentColor());
  const currentCycleDay = useAppStore((s) => s.currentCycleDay());
  const likedMeals = useAppStore((s) => s.likedMeals);
  const toggleLikedMeal = useAppStore((s) => s.toggleLikedMeal);
  const weekPlanData = useAppStore((s) => s.weekPlanData);
  const setWeekPlanData = useAppStore((s) => s.setWeekPlanData);
  const setPlanGroceryItems = useAppStore((s) => s.setPlanGroceryItems);
  const addFoodEntry = useAppStore((s) => s.addFoodEntry);

  const [planView, setPlanView] = useState<"today" | "week">("today");
  const [weekTab, setWeekTab] = useState<"this" | "next">("this");
  const todayDow = new Date().getDay();
  const todayDefaultIndex = todayDow === 0 ? 6 : todayDow - 1;
  const [selectedIndex, setSelectedIndex] = useState(todayDefaultIndex);
  const [loggedMeals, setLoggedMeals] = useState<Set<string>>(new Set());
  const [detailMeal, setDetailMeal] = useState<WeekMeal | null>(null);
  const [swapMeal, setSwapMeal] = useState<{ meal: WeekMeal; mealIndex: number } | null>(null);
  const [groceryAdded, setGroceryAdded] = useState(false);

  // Hydrate or generate plan
  const [plan, setPlan] = useState<{ thisWeek: WeekDay[]; nextWeek: WeekDay[] } | null>(null);

  const generateAndSave = useCallback(() => {
    const newPlan = buildFullPlan(profile, likedMeals, currentCycleDay);
    setPlan(newPlan);
    setWeekPlanData({ thisWeek: newPlan.thisWeek as any, nextWeek: newPlan.nextWeek as any, generatedAt: new Date().toISOString() });
    setGroceryAdded(false);
  }, [profile, likedMeals]);

  useEffect(() => {
    if (!weekPlanData || isPlanStale(weekPlanData.generatedAt)) {
      generateAndSave();
    } else {
      setPlan({ thisWeek: weekPlanData.thisWeek as any, nextWeek: weekPlanData.nextWeek as any });
    }
  }, []);

  if (!plan) return null;

  const activeWeek: WeekDay[] = weekTab === "this" ? plan.thisWeek : plan.nextWeek;
  const selectedDay = activeWeek[selectedIndex];
  const phase = PHASE_INFO[selectedDay.phase];

  const dayTotals = selectedDay.meals.reduce(
    (acc, m) => ({ cal: acc.cal + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleSwap = (mealIndex: number, replacement: WeekMeal) => {
    setPlan((prev) => {
      if (!prev) return prev;
      const weekKey = weekTab === "this" ? "thisWeek" : "nextWeek";
      const updated = [...prev[weekKey]];
      const day = { ...updated[selectedIndex] };
      const meals = [...day.meals];
      meals[mealIndex] = { ...replacement, meal: meals[mealIndex].meal };
      day.meals = meals;
      updated[selectedIndex] = day;
      const newPlan = { ...prev, [weekKey]: updated };
      setWeekPlanData({ thisWeek: newPlan.thisWeek as any, nextWeek: newPlan.nextWeek as any, generatedAt: weekPlanData?.generatedAt ?? new Date().toISOString() });
      return newPlan;
    });
  };

  const handleAddToGrocery = () => {
    const items = extractGroceryFromPlan(plan.nextWeek);
    setPlanGroceryItems(items);
    setGroceryAdded(true);
  };

  // Find today's index in this week
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const todayMonIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon...6=Sun

  // In "today" view, always show today's day
  const todayDay = plan.thisWeek[todayMonIndex];
  const todayPhase = PHASE_INFO[todayDay.phase];

  const handleAddToLog = (meal: WeekMeal) => {
    const key = meal.name;
    const entry: FoodEntry = {
      id: Date.now().toString(),
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      meal: meal.meal.toLowerCase() as any,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      source: "plan",
    };
    addFoodEntry(entry);
    setLoggedMeals((prev) => new Set(prev).add(key));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View>
            <Text style={styles.title}>Plan</Text>
            <Text style={styles.subtitle}>
              {likedMeals.length > 0 ? `${likedMeals.length} liked meal${likedMeals.length > 1 ? "s" : ""} shaping your plan` : "Cycle-aware · allergy-safe · macro-matched"}
            </Text>
          </View>
          <Pressable onPress={generateAndSave} style={styles.regenBtn}>
            <Ionicons name="refresh" size={17} color={accentColor} />
          </Pressable>
        </Animated.View>

        {/* Today / Week toggle */}
        <View style={styles.planViewToggle}>
          <Pressable
            onPress={() => setPlanView("today")}
            style={[styles.planViewBtn, planView === "today" && { backgroundColor: accentColor }]}
          >
            <Text style={[styles.planViewBtnText, planView === "today" && { color: "#0a0e1a" }]}>Today</Text>
          </Pressable>
          <Pressable
            onPress={() => setPlanView("week")}
            style={[styles.planViewBtn, planView === "week" && { backgroundColor: accentColor }]}
          >
            <Text style={[styles.planViewBtnText, planView === "week" && { color: "#0a0e1a" }]}>Week</Text>
          </Pressable>
        </View>

        {planView === "week" && (
          <View style={styles.weekTabRow}>
            <Pressable
              onPress={() => { setWeekTab("this"); setSelectedIndex(todayMonIndex); }}
              style={[styles.weekTab, weekTab === "this" && { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}
            >
              <Text style={[styles.weekTabText, weekTab === "this" && { color: accentColor }]}>This Week</Text>
            </Pressable>
            <Pressable
              onPress={() => { setWeekTab("next"); setSelectedIndex(0); }}
              style={[styles.weekTab, weekTab === "next" && { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}
            >
              <Text style={[styles.weekTabText, weekTab === "next" && { color: accentColor }]}>Next Week</Text>
              <View style={[styles.groceryBadge, { backgroundColor: accentColor }]}>
                <Ionicons name="cart-outline" size={10} color="#0a0e1a" />
              </View>
            </Pressable>
          </View>
        )}

        {/* ── TODAY VIEW ─────────────────────────────────────── */}
        {planView === "today" && (
          <>
            <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.phaseRow}>
              <Text style={styles.phaseEmoji}>{todayPhase.emoji}</Text>
              <Text style={[styles.phaseLabel, { color: todayPhase.color }]}>{todayPhase.label}</Text>
              <Text style={styles.phaseDateLabel}>{todayDay.dateLabel}</Text>
            </Animated.View>

            {(() => {
              const totals = todayDay.meals.reduce(
                (acc, m) => ({ cal: acc.cal + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
                { cal: 0, protein: 0, carbs: 0, fat: 0 }
              );
              return (
                <View style={styles.macroSummaryRow}>
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.protein }]}>{totals.protein}g</Text>
                    <Text style={styles.macroSummaryLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroSummaryDivider} />
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.carbs }]}>{totals.carbs}g</Text>
                    <Text style={styles.macroSummaryLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroSummaryDivider} />
                  <View style={styles.macroSummaryItem}>
                    <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.fat }]}>{totals.fat}g</Text>
                    <Text style={styles.macroSummaryLabel}>Fat</Text>
                  </View>
                  <View style={styles.macroSummaryDivider} />
                  <View style={styles.macroSummaryItem}>
                    <Text style={styles.macroSummaryVal}>{totals.cal}</Text>
                    <Text style={styles.macroSummaryLabel}>kcal / {profile.calorieGoal}</Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.mealList}>
              {todayDay.meals.map((meal, i) => {
                const logged = loggedMeals.has(meal.name);
                return (
                  <Animated.View key={`today-${i}-${meal.name}`} entering={FadeInDown.delay(i * 70).duration(350)}>
                    <GlowCard style={styles.mealCard}>
                      <View style={styles.mealTopRow}>
                        <View style={styles.mealTopLeft}>
                          <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                          <View>
                            <Text style={[styles.mealType, { color: todayPhase.color }]}>{meal.meal}</Text>
                            <Text style={styles.mealCuisine}>{meal.cuisine[0]}</Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => !logged && handleAddToLog(meal)}
                          style={[styles.logBtn, { backgroundColor: logged ? `${accentColor}20` : accentColor }]}
                        >
                          <Ionicons name={logged ? "checkmark" : "add"} size={14} color={logged ? accentColor : "#0a0e1a"} />
                          <Text style={[styles.logBtnText, { color: logged ? accentColor : "#0a0e1a" }]}>
                            {logged ? "Logged" : "Log"}
                          </Text>
                        </Pressable>
                      </View>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealDesc}>{meal.description}</Text>
                      <View style={styles.mealMacroRow}>
                        <View style={styles.mealMacroLeft}>
                          <Ionicons name="flame" size={12} color={DARK_THEME.textMuted} />
                          <Text style={styles.mealKcal}>{meal.calories} kcal</Text>
                          <Text style={styles.mealMacroChip}>P:{meal.protein}g</Text>
                          <Text style={styles.mealMacroChip}>C:{meal.carbs}g</Text>
                          <Text style={styles.mealMacroChip}>F:{meal.fat}g</Text>
                        </View>
                        <View style={styles.mealTimeRow}>
                          <Ionicons name="time-outline" size={12} color={DARK_THEME.textMuted} />
                          <Text style={styles.mealKcal}>{meal.cookTime}</Text>
                        </View>
                      </View>
                      {meal.insight ? <Text style={[styles.mealInsight, { color: todayPhase.color }]}>{meal.insight}</Text> : null}
                      <Pressable onPress={() => setDetailMeal(meal)} style={styles.recipeBtn}>
                        <Ionicons name="book-outline" size={13} color={accentColor} />
                        <Text style={[styles.recipeBtnText, { color: accentColor }]}>See Recipe</Text>
                      </Pressable>
                    </GlowCard>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}

        {/* ── WEEK VIEW ──────────────────────────────────────── */}
        {planView === "week" && (
          <>
            {/* Day selector */}
            <ScrollView
              horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorContent}
              style={styles.daySelector}
            >
              {activeWeek.map((day, i) => {
                const p = PHASE_INFO[day.phase];
                const active = i === selectedIndex;
                const isToday = weekTab === "this" && i === todayMonIndex;
                return (
                  <Pressable
                    key={i} onPress={() => setSelectedIndex(i)}
                    style={[
                      styles.dayBtn,
                      active && { backgroundColor: `${p.color}18`, borderColor: `${p.color}50` },
                      day.isPast && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={[styles.dayBtnLabel, active && { color: p.color }]}>{day.dayLabel}</Text>
                    <Text style={styles.dayBtnEmoji}>{p.emoji}</Text>
                    <Text style={[styles.dayBtnDate, active && { color: p.color }]}>{day.dateLabel.split("/")[0]}</Text>
                    {isToday && <View style={[styles.todayDot, { backgroundColor: accentColor }]} />}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Phase + macro summary */}
            <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.phaseRow}>
              <Text style={styles.phaseEmoji}>{phase.emoji}</Text>
              <Text style={[styles.phaseLabel, { color: phase.color }]}>{phase.label}</Text>
              <Text style={styles.phaseDateLabel}>{selectedDay.dateLabel}</Text>
            </Animated.View>

            <View style={styles.macroSummaryRow}>
              <View style={styles.macroSummaryItem}>
                <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.protein }]}>{dayTotals.protein}g</Text>
                <Text style={styles.macroSummaryLabel}>Protein</Text>
              </View>
              <View style={styles.macroSummaryDivider} />
              <View style={styles.macroSummaryItem}>
                <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.carbs }]}>{dayTotals.carbs}g</Text>
                <Text style={styles.macroSummaryLabel}>Carbs</Text>
              </View>
              <View style={styles.macroSummaryDivider} />
              <View style={styles.macroSummaryItem}>
                <Text style={[styles.macroSummaryVal, { color: MACRO_COLORS.fat }]}>{dayTotals.fat}g</Text>
                <Text style={styles.macroSummaryLabel}>Fat</Text>
              </View>
              <View style={styles.macroSummaryDivider} />
              <View style={styles.macroSummaryItem}>
                <Text style={styles.macroSummaryVal}>{dayTotals.cal}</Text>
                <Text style={styles.macroSummaryLabel}>kcal / {profile.calorieGoal}</Text>
              </View>
            </View>

            {/* Meal cards */}
            <View style={styles.mealList}>
              {selectedDay.meals.map((meal, i) => (
                <Animated.View key={`${weekTab}-${selectedIndex}-${i}-${meal.name}`} entering={FadeInDown.delay(i * 70).duration(350)}>
                  <MealCard
                    meal={meal}
                    phase={phase}
                    isLiked={likedMeals.includes(meal.name)}
                    onDetail={() => setDetailMeal(meal)}
                    onSwap={() => setSwapMeal({ meal, mealIndex: i })}
                    onLike={() => toggleLikedMeal(meal.name)}
                    isPast={selectedDay.isPast}
                  />
                </Animated.View>
              ))}
            </View>

            {/* Next week grocery CTA */}
            {weekTab === "next" && (
              <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                <Pressable
                  onPress={handleAddToGrocery}
                  style={[styles.groceryCta, { borderColor: groceryAdded ? `${accentColor}50` : `${accentColor}30`, backgroundColor: groceryAdded ? `${accentColor}12` : `${accentColor}08` }]}
                >
                  <Ionicons name={groceryAdded ? "checkmark-circle" : "cart-outline"} size={20} color={accentColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.groceryCtaTitle, { color: accentColor }]}>
                      {groceryAdded ? "Grocery list updated!" : "Add next week to Grocery List"}
                    </Text>
                    <Text style={styles.groceryCtaSub}>
                      {groceryAdded ? "Check the Grocery tab to shop" : "All ingredients auto-extracted & grouped"}
                    </Text>
                  </View>
                  {!groceryAdded && <Ionicons name="chevron-forward" size={16} color={accentColor} />}
                </Pressable>
              </Animated.View>
            )}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      <MealDetailModal
        meal={detailMeal}
        visible={detailMeal !== null}
        onClose={() => setDetailMeal(null)}
        accentColor={accentColor}
      />

      <SwapModal
        meal={swapMeal?.meal ?? null}
        phase={selectedDay.phase}
        visible={swapMeal !== null}
        onClose={() => setSwapMeal(null)}
        onSwap={(replacement) => swapMeal && handleSwap(swapMeal.mealIndex, replacement)}
        accentColor={accentColor}
        profile={profile}
        likedMeals={likedMeals}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: DARK_THEME.bg },
  scrollContent: { padding: 16, paddingTop: 12 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  title: { fontFamily: "Georgia", fontSize: 26, color: DARK_THEME.textPrimary, fontWeight: "600" },
  subtitle: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary, marginTop: 4 },
  regenBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },

  planViewToggle: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14, padding: 3, marginBottom: 16,
  },
  planViewBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center",
  },
  planViewBtnText: { fontSize: TYPE.md, fontWeight: "600", color: DARK_THEME.textMuted },

  logBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  logBtnText: { fontSize: TYPE.xs, fontWeight: "700" },

  weekTabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  weekTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 14,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1.5, borderColor: "transparent",
  },
  weekTabText: { fontSize: TYPE.body, fontWeight: "600", color: DARK_THEME.textMuted },
  groceryBadge: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  daySelector: { marginBottom: 16 },
  daySelectorContent: { gap: 8, paddingHorizontal: 2 },
  dayBtn: {
    alignItems: "center", paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 16, minWidth: 56,
    backgroundColor: DARK_THEME.cardBg, borderWidth: 1.5, borderColor: "transparent", gap: 2,
  },
  dayBtnLabel: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, fontWeight: "500" },
  dayBtnEmoji: { fontSize: 15 },
  dayBtnDate: { fontSize: TYPE.lg, color: DARK_THEME.textPrimary, fontWeight: "700" },
  todayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },

  phaseRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  phaseEmoji: { fontSize: 16 },
  phaseLabel: { fontSize: TYPE.lg, fontWeight: "600" },
  phaseDateLabel: { fontSize: TYPE.body, color: DARK_THEME.textMuted, marginLeft: "auto" as any },

  macroSummaryRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: DARK_THEME.cardBg, borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 16,
    marginBottom: 16, borderWidth: 1, borderColor: DARK_THEME.borderColor,
  },
  macroSummaryItem: { flex: 1, alignItems: "center" },
  macroSummaryVal: { fontSize: TYPE.lg, fontWeight: "700", color: DARK_THEME.textPrimary },
  macroSummaryLabel: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 2 },
  macroSummaryDivider: { width: 1, height: 28, backgroundColor: DARK_THEME.borderColor },

  mealInsight: { fontSize: TYPE.xs, fontWeight: "600", marginTop: 8, marginBottom: 2 },
  recipeBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, alignSelf: "flex-start" },
  recipeBtnText: { fontSize: TYPE.sm, fontWeight: "600" },

  mealList: { gap: 12 },
  mealCard: {},
  mealCardPast: { opacity: 0.65 },
  mealTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mealTopLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  mealEmoji: { fontSize: 26 },
  mealType: { fontSize: TYPE.body, fontWeight: "600" },
  mealCuisine: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginTop: 1 },
  mealActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  likeBtn: { padding: 4 },
  detailBtn: { padding: 4 },
  mealName: { fontFamily: "Georgia", fontSize: 17, color: DARK_THEME.textPrimary, marginBottom: 6, fontWeight: "600" },
  mealDesc: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, lineHeight: 19, marginBottom: 10 },
  mealMacroRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mealMacroLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  mealKcal: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  mealMacroChip: { fontSize: TYPE.sm, fontWeight: "500", color: DARK_THEME.textMuted },
  mealTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  swapBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)",
  },
  swapBtnText: { fontSize: TYPE.body, fontWeight: "600" },

  groceryCta: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 8,
  },
  groceryCtaTitle: { fontSize: TYPE.body, fontWeight: "700" },
  groceryCtaSub: { fontSize: TYPE.sm, color: DARK_THEME.textMuted, marginTop: 2 },

  // Modals
  rnModal: { justifyContent: "flex-end", margin: 0 },
  modalSheet: {
    backgroundColor: "#0f1525", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, height: "88%", paddingBottom: 0,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 16,
  },
  detailTitle: { fontFamily: "Georgia", fontSize: 18, color: DARK_THEME.textPrimary, fontWeight: "600", marginBottom: 12 },
  detailMacroRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  detailMacroItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailKcal: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  detailMacroChip: { fontSize: TYPE.sm, fontWeight: "600", color: DARK_THEME.textSecondary },
  insightPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12,
  },
  insightText: { fontSize: TYPE.body, fontWeight: "500", flex: 1 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.06)" },
  tagText: { fontSize: TYPE.sm, color: DARK_THEME.textSecondary },
  detailSection: { marginBottom: 20 },
  detailSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  detailSectionTitle: { fontFamily: "Georgia", fontSize: TYPE.lg, color: DARK_THEME.textPrimary },
  detailSectionCount: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  ingredientRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3 },
  ingredientText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, flex: 1 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  stepNumText: { fontSize: TYPE.sm, fontWeight: "700" },
  stepText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, flex: 1, lineHeight: 20 },
  proTipCard: {
    padding: 14, borderRadius: 12, borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)", marginBottom: 16,
  },
  proTipHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  proTipLabel: { fontSize: TYPE.body, fontWeight: "700" },
  proTipText: { fontSize: TYPE.body, color: DARK_THEME.textSecondary, lineHeight: 20 },
  closeBtn: { borderRadius: 14, paddingVertical: 12, alignItems: "center", marginBottom: 8 },
  closeBtnText: { fontSize: TYPE.lg, fontWeight: "700", color: "#0a0e1a" },

  swapHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  swapHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  swapTitle: { fontFamily: "Georgia", fontSize: 18, color: DARK_THEME.textPrimary },
  swapCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  swapSubtitle: { fontSize: TYPE.body, color: DARK_THEME.textMuted, marginBottom: 10 },
  phaseCtx: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  phaseCtxText: { fontSize: TYPE.sm, fontWeight: "600" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: DARK_THEME.inputBg, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: TYPE.body, color: DARK_THEME.textPrimary },
  fitLegend: { flexDirection: "row", gap: 12, marginBottom: 10 },
  fitLegendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  fitDot: { width: 7, height: 7, borderRadius: 4 },
  fitLegendText: { fontSize: TYPE.xs, color: DARK_THEME.textMuted },
  swapMealRow: {
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    paddingLeft: 0, overflow: "hidden",
  },
  fitBar: { width: 3, borderRadius: 2, alignSelf: "stretch", marginRight: 2, minHeight: 40 },
  swapMealEmoji: { fontSize: 28, width: 38, textAlign: "center", marginTop: 2 },
  swapMealTop: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2, flexWrap: "wrap" },
  swapMealName: { fontSize: TYPE.body, color: DARK_THEME.textPrimary, fontWeight: "600", flex: 1 },
  fitBadge: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
  },
  fitBadgeText: { fontSize: TYPE.xs, fontWeight: "700" },
  swapCuisine: { fontSize: TYPE.xs, color: DARK_THEME.textMuted, marginBottom: 4 },
  swapMealMacros: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  swapKcal: { fontSize: TYPE.sm, color: DARK_THEME.textMuted },
  swapMacroChip: { fontSize: TYPE.sm, fontWeight: "500", color: DARK_THEME.textMuted },
  fitWarning: {
    padding: 8, borderRadius: 8, borderWidth: 1, gap: 2,
  },
  fitWarningText: { fontSize: TYPE.xs, lineHeight: 16 },
});
