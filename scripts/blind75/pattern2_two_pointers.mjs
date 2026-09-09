export const pattern2 = [
  {
    id: 2,
    title: "[Pattern 2/9] Two Pointers & Sliding Window Blueprint",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "easy",
    tags: ["Two Pointers", "Sliding Window", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Imagine two searchlights scanning a stage:
1. **Converging Pointers:** Two searchlights start at opposite ends of a long line and walk toward each other. Every time they take a step, they permanently eliminate half the stage without needing to check it.
2. **Sliding Window:** Like a sliding viewfinder or camera lens on a rail. You stretch the right edge of the lens to capture more content, and when the frame gets blurry (violates a rule), you slide the left edge forward until the image is crystal clear again.

---

## 📊 Visual Architecture: Converging Pointers & Dynamic Window

![Two Pointers and Sliding Window Pattern](/diagrams/blind75/two_pointers_sliding_window.svg)

---

## 🧠 Two Distinct Archetypes

### 1. Inward Converging Two Pointers (Sorted Arrays)
- **Invariant:** \`arr[left] + arr[right]\`
- If sum is too small -> \`left++\` (need larger elements)
- If sum is too big -> \`right--\` (need smaller elements)
- Eliminates $O(N^2)$ checks in a single $O(N)$ sweep.

### 2. Sliding Window (Substrings & Subarrays)
- **Invariant:** Window \`[left, right]\` satisfies problem condition (e.g. at most $K$ distinct letters, no duplicates).
- Loop \`right\` across array: expand window state.
- While condition broken: contract from \`left\` and shrink state.
- Record optimal window size \`(right - left + 1)\`.

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// Blueprint 1: Converging Pointers
function twoPointersSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}

// Blueprint 2: Variable-Size Sliding Window
function slidingWindow(s) {
  const windowState = new Map();
  let left = 0, best = 0;

  for (let right = 0; right < s.length; right++) {
    // 1. Add s[right] into windowState
    windowState.set(s[right], (windowState.get(s[right]) ?? 0) + 1);

    // 2. Shrink while window is invalid
    while (/* window is invalid */ false) {
      windowState.set(s[left], windowState.get(s[left]) - 1);
      left++;
    }

    // 3. Record answer
    best = Math.max(best, right - left + 1);
  }

  return best;
}
\`\`\`

---

## ⚠️ Common Traps & Edge Cases
- **Off-by-one window length:** The length of \`[left, right]\` is always **\`right - left + 1\`**. Memorize that \`+ 1\`.
- **Amortized Time:** People often assume the inner \`while\` loop makes sliding window $O(N^2)$. It does **not**! Both \`left\` and \`right\` only move forward at most $N$ times. Total steps $\\le 2N$, which is strictly $O(N)$.

---

## 🎯 Blind 75 Problems in this Pattern
- [Valid Palindrome](/blind75/20)
- [3Sum](/blind75/21)
- [Container With Most Water](/blind75/22)
- [Trapping Rain Water](/blind75/23)
- [Longest Substring Without Repeating Characters](/blind75/24)
- [Longest Repeating Character Replacement](/blind75/25)
- [Minimum Window Substring](/blind75/26)
- [Maximum Product Subarray](/blind75/27)`
  },
  {
    id: 20,
    title: "Valid Palindrome (LeetCode #125)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "easy",
    tags: ["Two Pointers", "strings", "easy"],
    source: "https://leetcode.com/problems/valid-palindrome/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.

Example: \`"A man, a plan, a canal: Panama"\` -> \`true\` (\`"amanaplanacanalpanama"\`).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Two pointers meeting in the center; skip junk characters as you walk."*

Place \`left = 0\` and \`right = s.length - 1\`. Skip any character that isn't a letter or digit. When both are pointing at valid alphanumeric characters, compare lowercase values. If they differ, return \`false\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function isPalindrome(s) {
  // Normalize string: lowercase and remove non-alphanumeric
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let left = 0;
  let right = clean.length - 1;

  while (left < right) {
    if (clean[left] !== clean[right]) {
      return false;
    }
    left++;
    right--;
  }

  return true;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through string.
- **Space Complexity:** $O(1)$ extra space if skipping in-place, or $O(N)$ for the cleaned string.`
  },
  {
    id: 21,
    title: "3Sum (LeetCode #15)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "medium",
    tags: ["Two Pointers", "arrays", "medium"],
    source: "https://leetcode.com/problems/3sum/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, return all unique triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j != k\` and \`nums[i] + nums[j] + nums[k] === 0\`.
**Rule:** The solution set must not contain duplicate triplets.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Sort first! Fix one number, then run Two Sum with converging pointers on the rest. Skip consecutive duplicates."*

1. **Sort the array:** $O(N \\log N)$. Sorting allows us to easily skip duplicate values and use converging two pointers.
2. Loop \`i\` from 0 to $N-3$:
   - If \`nums[i] > 0\`, stop! Since the array is sorted, three positive numbers can never sum to 0.
   - If \`i > 0 && nums[i] === nums[i-1]\`, skip to avoid duplicate triplets.
   - Run two pointers: \`left = i + 1\`, \`right = nums.length - 1\`.
   - On match (\`sum === 0\`), push triplet and advance past all duplicate \`left\` and \`right\` values.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function threeSum(nums) {
  nums.sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < nums.length - 2; i++) {
    // Early termination: if smallest number is > 0, sum cannot be 0
    if (nums[i] > 0) break;

    // Skip duplicate first numbers
    if (i > 0 && nums[i] === nums[i - 1]) continue;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];

      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);

        // Skip duplicates for second and third numbers
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;

        left++;
        right--;
      } else if (sum < 0) {
        left++; // Need larger sum
      } else {
        right--; // Need smaller sum
      }
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N^2)$ — Outer loop runs $N$ times, inner two-pointer scan takes $O(N)$.
- **Space Complexity:** $O(1)$ extra space (ignoring output and sort stack).`
  },
  {
    id: 22,
    title: "Container With Most Water (LeetCode #11)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "medium",
    tags: ["Two Pointers", "greedy", "medium"],
    source: "https://leetcode.com/problems/container-with-most-water/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an integer array \`height\` representing vertical lines on a graph. Find two lines that, together with the x-axis, form a container that holds the most water. Return the maximum amount of water.

Water capacity = \`width × min(height[left], height[right])\`
where \`width = right - left\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Always advance the shorter wall. The shorter wall is the bottleneck; moving the taller wall can only ever decrease the area!"*

Start with the widest possible container: \`left = 0\`, \`right = height.length - 1\`.
Calculate the area. Now, to try and find a larger area with a smaller width, we **must** find a taller wall. Because the shorter wall dictates the water level, moving the taller wall is useless. Therefore, advance whichever pointer has the smaller height!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;

  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    maxWater = Math.max(maxWater, width * h);

    // Discard the limiting bottleneck wall
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }

  return maxWater;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — The two pointers traverse the array in a single pass.
- **Space Complexity:** $O(1)$ — Only a few numbers stored.`
  },
  {
    id: 23,
    title: "Trapping Rain Water (LeetCode #42)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "hard",
    tags: ["Two Pointers", "arrays", "hard"],
    source: "https://leetcode.com/problems/trapping-rain-water/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given $N$ non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Water trapped at index i depends strictly on: \`min(maxLeft, maxRight) - height[i]\`. Use two pointers tracking leftMax and rightMax inward!"*

Instead of storing precomputed arrays for left-max and right-max, maintain two pointers \`left\` and \`right\`:
- Whichever side has the smaller max determines the water level for that bar!
- If \`maxLeft < maxRight\`, water above \`left\` is \`maxLeft - height[left]\`, then \`left++\`.
- Otherwise water above \`right\` is \`maxRight - height[right]\`, then \`right--\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function trap(height) {
  let left = 0, right = height.length - 1;
  let leftMax = 0, rightMax = 0;
  let totalWater = 0;

  while (left < right) {
    if (height[left] <= height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        totalWater += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        totalWater += rightMax - height[right];
      }
      right--;
    }
  }

  return totalWater;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(1)$ — No extra arrays needed!`
  },
  {
    id: 24,
    title: "Longest Substring Without Repeating Characters (LeetCode #3)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "medium",
    tags: ["Sliding Window", "strings", "medium"],
    source: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a string \`s\`, find the length of the longest contiguous substring without repeating characters.

Example: \`s = "abcabcbb"\` -> Answer is \`3\` (\`"abc"\`).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Sliding Window with a Set: Expand right; shrink left while the incoming char is already inside the window."*

Maintain a \`Set\` representing all distinct characters currently in the window \`[left, right]\`.
1. Expand \`right\`.
2. If \`set.has(s[right])\`, shrink the window from \`left\` (deleting from set) until the duplicate is gone.
3. Add \`s[right]\` to the set and update \`best = Math.max(best, right - left + 1)\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function lengthOfLongestSubstring(s) {
  const seen = new Set();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    // Contract from left while the incoming character is a duplicate
    while (seen.has(s[right])) {
      seen.delete(s[left]);
      left++;
    }

    seen.add(s[right]);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Each character is visited by \`right\` once and \`left\` at most once.
- **Space Complexity:** $O(\\min(N, M))$ where $M$ is the size of the alphabet.
- **In-App Practice:** [/coding/41](/coding/41)`
  },
  {
    id: 25,
    title: "Longest Repeating Character Replacement (LeetCode #424)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "medium",
    tags: ["Sliding Window", "strings", "medium"],
    source: "https://leetcode.com/problems/longest-repeating-character-replacement/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given a string \`s\` and an integer \`k\`. You can choose any character of the string and change it to any other uppercase English character at most \`k\` times.
Return the length of the longest substring containing the same letter after performing at most \`k\` replacements.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Window is valid if: \`(Window Length - Max Frequency in Window) <= k\`."*

If a window of length 5 has three \`'A'\`s and two other letters, we need $5 - 3 = 2$ replacements. If $k=2$, this window is valid!
If \`(right - left + 1) - maxFreq > k\`, the window has too many distinct characters to convert; shift \`left++\` to shrink.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function characterReplacement(s, k) {
  const count = new Map();
  let left = 0;
  let maxFreq = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    count.set(char, (count.get(char) ?? 0) + 1);
    maxFreq = Math.max(maxFreq, count.get(char));

    // If characters that need replacing exceed k, shrink window
    while ((right - left + 1) - maxFreq > k) {
      count.set(s[left], count.get(s[left]) - 1);
      left++;
    }

    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Linear scan.
- **Space Complexity:** $O(1)$ — At most 26 uppercase English letters in the map.`
  },
  {
    id: 26,
    title: "Minimum Window Substring (LeetCode #76)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "hard",
    tags: ["Sliding Window", "strings", "hard"],
    source: "https://leetcode.com/problems/minimum-window-substring/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given two strings \`s\` and \`t\`, return the minimum window substring of \`s\` such that every character in \`t\` (including duplicates) is included in the window. If there is no such substring, return the empty string \`""\`.

Example: \`s = "ADOBECODEBANC", t = "ABC"\` -> \`"BANC"\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Track 'have' vs 'need'. When have === need, shrink from the left to find the tightest valid window!"*

1. Create a frequency map \`need\` for \`t\`. We need \`need.size\` distinct characters satisfied.
2. Expand \`right\`. When \`windowCount.get(char) === need.get(char)\`, increment \`have++\`.
3. Whenever \`have === needCount\`, the window is valid! Try shrinking \`left++\` while updating the minimum window substring until it becomes invalid again.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function minWindow(s, t) {
  if (!s || !t || s.length < t.length) return "";

  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1);

  const window = new Map();
  let have = 0;
  const needCount = need.size;

  let result = [-1, -1];
  let minLen = Infinity;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    window.set(c, (window.get(c) ?? 0) + 1);

    if (need.has(c) && window.get(c) === need.get(c)) {
      have++;
    }

    // Try to shrink the window while it's valid
    while (have === needCount) {
      if (right - left + 1 < minLen) {
        minLen = right - left + 1;
        result = [left, right];
      }

      const leftChar = s[left];
      window.set(leftChar, window.get(leftChar) - 1);
      if (need.has(leftChar) && window.get(leftChar) < need.get(leftChar)) {
        have--;
      }
      left++;
    }
  }

  return minLen === Infinity ? "" : s.substring(result[0], result[1] + 1);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N + M)$ where $N = \\text{len}(s), M = \\text{len}(t)$.
- **Space Complexity:** $O(N + M)$ for frequency maps.`
  },
  {
    id: 27,
    title: "Maximum Product Subarray (LeetCode #152)",
    pattern: "Two Pointers & Sliding Window",
    difficulty: "medium",
    tags: ["Two Pointers", "dynamic programming", "medium"],
    source: "https://leetcode.com/problems/maximum-product-subarray/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, find a subarray that has the largest product, and return the product.
**The Catch:** Negative numbers flip signs! Multiplying two negative numbers creates a positive number, so a small negative product can suddenly become the largest positive product!

Example: \`[2, 3, -2, 4]\` -> Output is \`6\` (\`[2, 3]\`).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Track BOTH \`currentMax\` and \`currentMin\` at every step. When you encounter a negative number, swap them!"*

Because multiplying by a negative turns a min into a max, maintain:
- \`currentMax = Math.max(num, num * currentMax, num * currentMin)\`
- \`currentMin = Math.min(num, num * currentMax, num * currentMin)\`

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxProduct(nums) {
  let result = nums[0];
  let currentMax = 1;
  let currentMin = 1;

  for (const num of nums) {
    // If num is negative, max and min flip!
    if (num < 0) {
      const temp = currentMax;
      currentMax = currentMin;
      currentMin = temp;
    }

    currentMax = Math.max(num, currentMax * num);
    currentMin = Math.min(num, currentMin * num);

    result = Math.max(result, currentMax);
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(1)$ — Constant extra space.`
  }
];
