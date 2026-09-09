export const pattern1 = [
  {
    id: 1,
    title: "[Pattern 1/9] Arrays & Hashing Blueprint",
    pattern: "Arrays & Hashing",
    difficulty: "easy",
    tags: ["Arrays & Hashing", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Imagine you drop your winter coat off at a huge theatre cloakroom. 
- **The Brute Force Way ($O(N^2)$):** When you return to pick it up, the attendant walks row-by-row through thousands of coats comparing every single tag to yours. You wait 45 minutes.
- **The Hash Map Way ($O(1)$):** The attendant gives you a ticket number \`#42\`. When you return, they walk straight to hook \`#42\` and hand you your coat in 2 seconds.

A **Hash Map** or **Set** trades a tiny bit of extra memory to make search **instant ($O(1)$)**. Whenever an interviewer asks you a question that involves *"have I seen this before?"*, *"find a pair that matches X"*, or *"count frequencies"*, reaching for a Hash Map or Set should be muscle memory.

---

## 📊 Visual Architecture: The Cloakroom Ticket

![Arrays and Hashing Pattern](/diagrams/blind75/arrays_and_hashing.svg)

---

## 🧠 The 3 Core Archetypes in this Pattern

### 1. The Complement / Reverse Lookup
Instead of checking every pair with nested loops, walk the array once. For each element \`curr\`, calculate what you **need** (\`target - curr\`). Ask the map: *"Did someone earlier leave \`need\` in the cloakroom?"*
- Examples: **Two Sum**

### 2. Frequency Counting / Histogram
Count how often each letter or number appears using a Map or fixed 26-element array.
- Examples: **Valid Anagram**, **Top K Frequent Elements**

### 3. Prefix Accumulation (Running State)
Store running totals or products from left-to-right, then right-to-left.
- Examples: **Product of Array Except Self**, **Maximum Subarray (Kadane's)**

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// Archetype 1: Complement Lookup (O(N) time, O(N) space)
function complementLookup(nums, target) {
  const seen = new Map(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}

// Archetype 2: Frequency Counter
function frequencyCounter(items) {
  const freq = new Map();
  for (const item of items) {
    freq.set(item, (freq.get(item) ?? 0) + 1);
  }
  return freq;
}
\`\`\`

---

## ⚠️ Traps & Interview Gotchas
1. **Never check after inserting:** In Two Sum, if you insert \`nums[i]\` into the Map *before* checking \`seen.has(need)\`, an element can pair with itself (e.g., target 6 on \`[3]\` would wrongly return \`[0, 0]\`). Always check **first**, insert **after**.
2. **Plain Objects vs \`Map\` in JavaScript:** Plain \`{}\` keys are always coerced to strings (\`obj[1]\` is \`obj["1"]\`) and can collide with prototype keys (e.g. \`"toString"\`). Use \`new Map()\` for arbitrary keys and safety.
3. **Array Mutation:** Methods like \`.sort()\` mutate the array in place and convert elements to strings by default! Always pass a numerical comparator: \`.sort((a, b) => a - b)\`.

---

## 🎯 Blind 75 Problems in this Pattern
- [Two Sum](/blind75/10)
- [Contains Duplicate](/blind75/11)
- [Valid Anagram](/blind75/12)
- [Group Anagrams](/blind75/13)
- [Top K Frequent Elements](/blind75/14)
- [Product of Array Except Self](/blind75/15)
- [Longest Consecutive Sequence](/blind75/16)
- [Encode and Decode Strings](/blind75/17)
- [Best Time to Buy and Sell Stock](/blind75/18)
- [Maximum Subarray](/blind75/19)`
  },
  {
    id: 10,
    title: "Two Sum (LeetCode #1)",
    pattern: "Arrays & Hashing",
    difficulty: "easy",
    tags: ["Arrays & Hashing", "hash map", "easy"],
    source: "https://leetcode.com/problems/two-sum/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You have a list of numbers and a \`target\` sum. Find the **indices** of the two numbers that add up to that target. You can assume there's exactly one correct answer, and you cannot use the same element twice.

Example: \`nums = [2, 7, 11, 15], target = 9\` -> \`[0, 1]\` because \`2 + 7 = 9\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Don't look forward for partners; look backward in your notes."*

The naive way is nested loops ($O(N^2)$): for every number, scan the entire rest of the array. That's slow!
Instead, carry a notepad (a JavaScript \`Map\`). As you walk through the array, at each number \`curr\`, ask: **"What number do I need to reach \`target\`?"** (\`need = target - curr\`).
- If \`need\` is already written in your notepad, **you're done!** Return its index and your current index.
- If not, write \`curr -> current_index\` in your notepad and take the next step.

---

## 📊 Visual Trace
\`\`\`
nums = [3, 2, 4], target = 6

Step 1: i=0, num=3. Need = 6 - 3 = 3.
        Is 3 in map? No.
        Map becomes: { 3: 0 }

Step 2: i=1, num=2. Need = 6 - 2 = 4.
        Is 4 in map? No.
        Map becomes: { 3: 0, 2: 1 }

Step 3: i=2, num=4. Need = 6 - 4 = 2.
        Is 2 in map? YES! Index is 1.
        Return [1, 2]! (Done in 1 pass)
\`\`\`

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function twoSum(nums, target) {
  // Map stores: value -> its index in the array
  const seen = new Map();

  for (let i = 0; i < nums.length; i++) {
    const current = nums[i];
    const complement = target - current;

    // Check BEFORE inserting to ensure we don't pair an element with itself
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }

    // Remember this number and its position for future elements
    seen.set(current, i);
  }

  return [];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through the array. Hash map \`.has()\` and \`.get()\` are $O(1)$ on average.
- **Space Complexity:** $O(N)$ — In the worst case, we store up to $N$ elements in the map.

---

## ⚠️ Traps & Follow-ups
- **Trap:** Inserting into the map *before* checking. E.g. with \`nums = [3, 3], target = 6\`, checking first guarantees index 0 matches index 1 correctly.
- **Follow-up:** *"What if the array is already sorted?"* -> Use **Two Pointers** from both ends for $O(1)$ extra space!
- **In-App Practice:** [/coding/40](/coding/40)`
  },
  {
    id: 11,
    title: "Contains Duplicate (LeetCode #217)",
    pattern: "Arrays & Hashing",
    difficulty: "easy",
    tags: ["Arrays & Hashing", "Set", "easy"],
    source: "https://leetcode.com/problems/contains-duplicate/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, return \`true\` if any value appears at least twice in the array, and return \`false\` if every element is distinct.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"A Set cannot hold duplicates. Compare array length to Set size, or use early exit."*

In JavaScript, a \`Set\` only stores unique values. If you throw all elements into a Set, any duplicate is automatically swallowed.
- **One-liner:** \`new Set(nums).size !== nums.length\`
- **Early-exit optimization:** Walk through the array and add elements to a Set. The moment \`set.has(num)\` is true, return \`true\` immediately without checking the rest of the array!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
// Method 1: Early exit (optimal in practice when duplicates occur early)
function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}

// Method 2: Concise one-liner
function containsDuplicateOneLiner(nums) {
  return new Set(nums).size !== nums.length;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Adding to and checking a Set is $O(1)$ on average.
- **Space Complexity:** $O(N)$ — To store the unique elements.`
  },
  {
    id: 12,
    title: "Valid Anagram (LeetCode #242)",
    pattern: "Arrays & Hashing",
    difficulty: "easy",
    tags: ["Arrays & Hashing", "strings", "hash map", "easy"],
    source: "https://leetcode.com/problems/valid-anagram/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise. An anagram is a word formed by rearranging the letters of another word using all original letters exactly once.

Example: \`s = "anagram", t = "nagaram"\` -> \`true\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Character tally balance sheet: count up for s, count down for t. If everything hits zero, it's an anagram."*

1. Quick exit: If their lengths aren't equal, they can't be anagrams.
2. Build a frequency table for \`s\`.
3. Subtract counts using letters from \`t\`. If any letter runs out or doesn't exist, return \`false\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function isAnagram(s, t) {
  if (s.length !== t.length) return false;

  const counts = new Map();

  // Tally letters from s
  for (const char of s) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  // Deduct letters using t
  for (const char of t) {
    const count = counts.get(char);
    if (!count) return false; // Absent or already exhausted
    counts.set(char, count - 1);
  }

  return true;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Linear scan of strings of length $N$.
- **Space Complexity:** $O(1)$ — Since the English alphabet has at most 26 lowercase letters, the map never exceeds 26 entries!`
  },
  {
    id: 13,
    title: "Group Anagrams (LeetCode #49)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "hash map", "strings", "medium"],
    source: "https://leetcode.com/problems/group-anagrams/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of strings, group all anagrams together into sub-lists.
Example: \`["eat","tea","tan","ate","nat","bat"]\`
Result: \`[["eat","tea","ate"], ["tan","nat"], ["bat"]]\`

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Every anagram family shares the exact same sorted string as its fingerprint."*

If you sort the characters of \`"eat"\`, \`"tea"\`, and \`"ate"\`, all three turn into \`"aet"\`.
Therefore, use the sorted string as the **key** in a Hash Map, and the value will be an array of all words with that fingerprint!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function groupAnagrams(strs) {
  const groups = new Map();

  for (const word of strs) {
    // Fingerprint: sorted letters
    const key = word.split('').sort().join('');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(word);
  }

  return Array.from(groups.values());
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\cdot K \\log K)$ where $N$ is the number of words and $K$ is the max length of a word (sorting each word takes $K \\log K$).
- **Space Complexity:** $O(N \\cdot K)$ to store all grouped words.
- **In-App Practice:** [/coding/46](/coding/46)`
  },
  {
    id: 14,
    title: "Top K Frequent Elements (LeetCode #347)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "bucket sort", "heap", "medium"],
    source: "https://leetcode.com/problems/top-k-frequent-elements/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements.
Example: \`nums = [1,1,1,2,2,3], k = 2\` -> \`[1, 2]\` (1 appears thrice, 2 appears twice).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Bucket Sort by Frequency: an element can appear at most N times, so use frequency as the array index!"*

Normally people think of sorting ($O(N \\log N)$) or a Heap ($O(N \\log K)$). But we can do it in **$O(N)$ linear time** using **Bucket Sort**:
1. Count frequencies using a Map.
2. Create an array of buckets where \`buckets[freq]\` holds all numbers that appeared \`freq\` times.
3. Iterate backwards from bucket $N$ down to 1 and collect elements until you have $k$ items!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function topKFrequent(nums, k) {
  const count = new Map();
  for (const n of nums) {
    count.set(n, (count.get(n) ?? 0) + 1);
  }

  // buckets[i] will store all numbers with frequency i
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of count.entries()) {
    buckets[freq].push(num);
  }

  const result = [];
  // Traverse from highest possible frequency down to 1
  for (let freq = buckets.length - 1; freq >= 0 && result.length < k; freq--) {
    for (const num of buckets[freq]) {
      result.push(num);
      if (result.length === k) break;
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Counting takes $O(N)$, populating buckets takes $O(N)$, and draining buckets takes $O(N)$.
- **Space Complexity:** $O(N)$ — For the map and buckets.`
  },
  {
    id: 15,
    title: "Product of Array Except Self (LeetCode #238)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "prefix sum", "medium"],
    source: "https://leetcode.com/problems/product-of-array-except-self/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all elements of \`nums\` except \`nums[i]\`.
**Rule:** You must solve it in $O(N)$ time **without using the division operator \`/\`**!

Example: \`[1, 2, 3, 4]\` -> \`[24, 12, 8, 6]\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Everything except self = (Everything to my left) × (Everything to my right)."*

1. Make a first pass from left to right: store the prefix product (product of all numbers to the left of $i$).
2. Make a second pass from right to left: maintain a running suffix product and multiply it into the prefix result!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  // Pass 1: Prefix products (everything to the left)
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  // Pass 2: Suffix products (everything to the right)
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Two sequential passes through the array.
- **Space Complexity:** $O(1)$ extra space — We reuse the output array!`
  },
  {
    id: 16,
    title: "Longest Consecutive Sequence (LeetCode #128)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "Set", "medium"],
    source: "https://leetcode.com/problems/longest-consecutive-sequence/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an unsorted array of integers \`nums\`, return the length of the longest consecutive elements sequence (e.g. 1, 2, 3, 4).
You must write an algorithm that runs in $O(N)$ time!

Example: \`nums = [100, 4, 200, 1, 3, 2]\` -> Sequence is \`[1, 2, 3, 4]\`, so return \`4\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Only start counting a sequence from the true beginning. How do you know? If (num - 1) is NOT in the set!"*

If you check every number's sequence naively, you repeat work. 
Put everything in a \`Set\`. Then, only check sequences starting from numbers where \`!set.has(num - 1)\`. That guarantees each consecutive streak is traversed only once!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function longestConsecutive(nums) {
  const set = new Set(nums);
  let longest = 0;

  for (const num of set) {
    // Check if 'num' is the start of a streak
    if (!set.has(num - 1)) {
      let currentNum = num;
      let currentStreak = 1;

      while (set.has(currentNum + 1)) {
        currentNum += 1;
        currentStreak += 1;
      }

      longest = Math.max(longest, currentStreak);
    }
  }

  return longest;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Each number is visited at most twice (once in the outer loop, and at most once inside the while loop).
- **Space Complexity:** $O(N)$ — To store the numbers in a Set.`
  },
  {
    id: 17,
    title: "Encode and Decode Strings (LeetCode #271)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "strings", "medium"],
    source: "https://leetcode.com/problems/encode-and-decode-strings/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Design an algorithm to encode a list of strings to a single string, and decode that string back to the original list.
**The catch:** The strings can contain any characters, including delimiters like commas, slashes, or hashes!

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Length Prefixing with a delimiter: \`[length]#[string]\`."*

For \`["neet", "code"]\`, encode as:
\`"4#neet4#code"\`
When decoding:
1. Read digits until you hit \`#\` to find the length $L$.
2. Read the next $L$ characters as the exact string! It doesn't matter if the string contains \`#\` itself because we know its exact length.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
class Codec {
  // Encodes a list of strings to a single string.
  encode(strs) {
    let result = '';
    for (const s of strs) {
      result += \`\${s.length}#\${s}\`;
    }
    return result;
  }

  // Decodes a single string to a list of strings.
  decode(s) {
    const result = [];
    let i = 0;

    while (i < s.length) {
      const hashIndex = s.indexOf('#', i);
      const length = Number(s.substring(i, hashIndex));
      const start = hashIndex + 1;
      const end = start + length;

      result.push(s.substring(start, end));
      i = end;
    }

    return result;
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ for both encode and decode.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 18,
    title: "Best Time to Buy and Sell Stock (LeetCode #121)",
    pattern: "Arrays & Hashing",
    difficulty: "easy",
    tags: ["Arrays & Hashing", "two pointers", "sliding window", "easy"],
    source: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on day \`i\`.
You want to maximize your profit by choosing **one day** to buy and **one different day in the future** to sell.

Example: \`[7, 1, 5, 3, 6, 4]\` -> Buy on day 2 (price = 1), sell on day 5 (price = 6), profit = $6 - 1 = 5$.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Remember the lowest valley seen so far, and calculate potential profit on every new peak."*

As you walk across days:
1. Track \`minPrice\` seen so far.
2. Calculate \`profit = currentPrice - minPrice\`.
3. Keep the max profit found.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    if (price < minPrice) {
      minPrice = price; // Found a cheaper day to buy
    } else {
      maxProfit = Math.max(maxProfit, price - minPrice); // Potential sale
    }
  }

  return maxProfit;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through prices.
- **Space Complexity:** $O(1)$ — Only two scalar variables.`
  },
  {
    id: 19,
    title: "Maximum Subarray — Kadane's Algorithm (LeetCode #53)",
    pattern: "Arrays & Hashing",
    difficulty: "medium",
    tags: ["Arrays & Hashing", "dynamic programming", "Kadane", "medium"],
    source: "https://leetcode.com/problems/maximum-subarray/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

Example: \`[-2, 1, -3, 4, -1, 2, 1, -5, 4]\` -> Subarray \`[4, -1, 2, 1]\` has largest sum \`6\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook (Kadane's Algorithm):** *"A negative prefix is toxic baggage. Discard it and start fresh!"*

If your running sum ever drops below 0, it can never help future numbers increase their total. So reset running sum to 0 whenever it turns negative!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxSubArray(nums) {
  let maxSoFar = nums[0];
  let currentSum = 0;

  for (const num of nums) {
    // If currentSum was negative, reset it to 0
    if (currentSum < 0) currentSum = 0;

    currentSum += num;
    maxSoFar = Math.max(maxSoFar, currentSum);
  }

  return maxSoFar;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — One loop.
- **Space Complexity:** $O(1)$ — Constant extra memory.`
  }
];
