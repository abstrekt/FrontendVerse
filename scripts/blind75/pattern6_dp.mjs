export const pattern6 = [
  {
    id: 6,
    title: "[Pattern 6/9] Dynamic Programming Blueprint",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Dynamic Programming is simply: **Remembering what you already computed so you never solve the same problem twice.**

Imagine someone asks you:
- *"What is 1 + 1 + 1 + 1 + 1?"* -> You count and say: *"5"*.
- Now they write another \`+ 1\` at the end and ask: *"What is it now?"*
- Do you recount all six ones from the beginning? **Of course not!** You remember that the first part was 5, add 1, and immediately say *"6"*.

That is Dynamic Programming. If a problem has **overlapping subproblems** (the same question asked millions of times) and **optimal substructure** (the big answer is built from optimal smaller answers), DP collapses exponential $O(2^N)$ algorithms down to linear $O(N)$ or polynomial $O(N^2)$!

---

## 📊 Visual Architecture: Recursion Tree vs Tabulation

![Dynamic Programming Pattern](/diagrams/blind75/dynamic_programming.svg)

---

## 🧠 The Universal 4-Step DP Framework

Whenever you tackle a DP problem, follow this exact mental checklist:

1. **State Definition:** What does \`dp[i]\` mean in plain English? (e.g. \`dp[i]\` = minimum coins to make amount \`i\`).
2. **Base Cases:** What are the simplest possible answers? (e.g. \`dp[0] = 0\`).
3. **Recurrence Relation:** How does \`dp[i]\` transition from earlier states? (e.g. \`dp[i] = Math.min(dp[i - coin] + 1)\`).
4. **Order of Computation & Space Optimization:** Can we compute iteratively from 0 to $N$? Can we store only the last 2 variables instead of an entire array?

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// 1. Top-Down (Memoization)
function climbStairsMemo(n, memo = new Map()) {
  if (n <= 2) return n;
  if (memo.has(n)) return memo.get(n);

  const res = climbStairsMemo(n - 1, memo) + climbStairsMemo(n - 2, memo);
  memo.set(n, res);
  return res;
}

// 2. Bottom-Up (Tabulation with O(1) space)
function climbStairsTabulation(n) {
  if (n <= 2) return n;
  let prev2 = 1; // dp[1]
  let prev1 = 2; // dp[2]

  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }

  return prev1;
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Climbing Stairs](/blind75/51)
- [Coin Change](/blind75/52)
- [Longest Increasing Subsequence](/blind75/53)
- [Longest Common Subsequence](/blind75/54)
- [Word Break](/blind75/55)
- [Combination Sum](/blind75/56)
- [House Robber](/blind75/57)
- [House Robber II](/blind75/58)
- [Decode Ways](/blind75/59)
- [Unique Paths](/blind75/60)
- [Jump Game](/blind75/61)
- [Palindromic Substrings](/blind75/62)`
  },
  {
    id: 51,
    title: "Climbing Stairs (LeetCode #70)",
    pattern: "Dynamic Programming",
    difficulty: "easy",
    tags: ["Dynamic Programming", "fibonacci", "easy"],
    source: "https://leetcode.com/problems/climbing-stairs/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are climbing a staircase with $n$ steps. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"To land on step N, you must have taken 1 step from step (N-1) OR 2 steps from step (N-2). It's Fibonacci in disguise!"*

Ways to step $N$ = \`ways(N - 1) + ways(N - 2)\`.
Instead of recursion ($O(2^N)$), just track the last two numbers!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function climbStairs(n) {
  if (n <= 2) return n;

  let oneStepBefore = 2;
  let twoStepsBefore = 1;

  for (let i = 3; i <= n; i++) {
    const current = oneStepBefore + twoStepsBefore;
    twoStepsBefore = oneStepBefore;
    oneStepBefore = current;
  }

  return oneStepBefore;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single loop from 3 to $n$.
- **Space Complexity:** $O(1)$ — Only two scalar variables.`
  },
  {
    id: 52,
    title: "Coin Change (LeetCode #322)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "knapsack", "medium"],
    source: "https://leetcode.com/problems/coin-change/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an integer array \`coins\` and an integer \`amount\`. Return the **fewest number of coins** that you need to make up that amount. If that amount cannot be made up by any combination, return \`-1\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Bottom-Up DP: \`dp[i]\` = min coins to make amount \`i\`. For each coin, \`dp[i] = Math.min(dp[i], 1 + dp[i - coin])\`."*

1. Initialize \`dp\` array of size \`amount + 1\` filled with \`Infinity\`. Set \`dp[0] = 0\` (0 coins to make $0).
2. For each amount from 1 to \`amount\`, test every coin:
   If \`amount >= coin\`, try using it: \`dp[i] = Math.min(dp[i], 1 + dp[i - coin])\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0; // Base case

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (i - coin >= 0) {
        dp[i] = Math.min(dp[i], 1 + dp[i - coin]);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(\\text{amount} \\cdot \\text{coins.length})$.
- **Space Complexity:** $O(\\text{amount})$ for the dp array.`
  },
  {
    id: 53,
    title: "Longest Increasing Subsequence (LeetCode #300)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "binary search", "medium"],
    source: "https://leetcode.com/problems/longest-increasing-subsequence/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence (elements don't have to be contiguous).

Example: \`[10, 9, 2, 5, 3, 7, 101, 18]\` -> Longest is \`[2, 3, 7, 101]\`, return \`4\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Patience Sorting: Maintain an active tails array. Binary search to find where the new number can replace a larger number or extend the pile!"*

- **$O(N^2)$ DP:** \`dp[i] = 1 + max(dp[j])\` for all \`j < i\` where \`nums[j] < nums[i]\`.
- **$O(N \\log N)$ Patience Sort:** Keep an array \`tails\`. For each number:
  - If \`num > all tails\`, append it (sequence length grows!).
  - If not, use Binary Search to replace the smallest tail that is $\\ge num$ (making future extensions easier).

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function lengthOfLIS(nums) {
  const tails = [];

  for (const num of nums) {
    let left = 0, right = tails.length;

    // Binary search for insertion point
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }

    tails[left] = num; // Replace or extend
  }

  return tails.length;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log N)$ with binary search ($O(N^2)$ with classic DP).
- **Space Complexity:** $O(N)$ for the tails array.`
  },
  {
    id: 54,
    title: "Longest Common Subsequence (LeetCode #1143)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "2D DP", "medium"],
    source: "https://leetcode.com/problems/longest-common-subsequence/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return 0.

Example: \`"abcde"\` and \`"ace"\` -> Common subsequence is \`"ace"\`, return \`3\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"2D Grid DP: If characters match, take diagonal + 1. If they don't match, take max(top, left)!"*

- If \`text1[i-1] === text2[j-1]\`: \`dp[i][j] = 1 + dp[i-1][j-1]\`
- Else: \`dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1])\`

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = 1 + dp[i - 1][j - 1]; // Diagonal match
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$.
- **Space Complexity:** $O(M \\cdot N)$ (or $O(N)$ space-optimized).`
  },
  {
    id: 55,
    title: "Word Break (LeetCode #139)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "strings", "medium"],
    source: "https://leetcode.com/problems/word-break/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a string \`s\` and a dictionary of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

Example: \`s = "leetcode", wordDict = ["leet", "code"]\` -> \`true\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"dp[i] is true if any prefix dp[j] is true AND the substring s[j...i] is a valid dictionary word."*

\`dp[i]\` represents whether \`s.substring(0, i)\` can be segmented.
Base case: \`dp[0] = true\`.
For each index \`i\` from 1 to $N$, check all previous split points \`j\`. If \`dp[j]\` is true and \`wordSet.has(s.substring(j, i))\`, set \`dp[i] = true\`!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function wordBreak(s, wordDict) {
  const wordSet = new Set(wordDict);
  const dp = new Array(s.length + 1).fill(false);
  dp[0] = true; // Empty string is valid

  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && wordSet.has(s.substring(j, i))) {
        dp[i] = true;
        break; // Found a valid segmentation for length i
      }
    }
  }

  return dp[s.length];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N^3)$ due to nested loops and substring slicing.
- **Space Complexity:** $O(N)$ for the dp array.`
  },
  {
    id: 56,
    title: "Combination Sum (LeetCode #39)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "backtracking", "medium"],
    source: "https://leetcode.com/problems/combination-sum/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of distinct integers \`candidates\` and a target integer \`target\`, return a list of all unique combinations where the chosen numbers sum to \`target\`. The same number may be chosen unlimited times.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Backtracking Decision Tree: At each element, you have two choices: 1. Take candidate[i] again (target - candidate[i]). 2. Skip candidate[i] and move to i + 1."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function combinationSum(candidates, target) {
  const result = [];

  function dfs(index, currentSum, currentComb) {
    if (currentSum === target) {
      result.push([...currentComb]);
      return;
    }
    if (currentSum > target || index >= candidates.length) {
      return;
    }

    // Choice 1: Include candidates[index] (can reuse, so pass index)
    currentComb.push(candidates[index]);
    dfs(index, currentSum + candidates[index], currentComb);

    // Choice 2: Exclude candidates[index] and advance index
    currentComb.pop();
    dfs(index + 1, currentSum, currentComb);
  }

  dfs(0, 0, []);
  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(2^T)$ where $T = \\text{target} / \\min(\\text{candidates})$.
- **Space Complexity:** $O(T)$ recursion depth.`
  },
  {
    id: 57,
    title: "House Robber (LeetCode #198)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "medium"],
    source: "https://leetcode.com/problems/house-robber/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are a professional robber planning to rob houses along a street. Adjacent houses have security systems connected: robbing two adjacent houses on the same night will alert the police.
Maximize the money robbed without hitting two adjacent houses.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"At each house, choose: Rob this house + rob 2 houses ago, OR skip this house and keep whatever we robbed up to last house!"*

Formula: \`rob = Math.max(skipHouse, robHouse + num)\`.
Track only the last two maximums: \`rob1\` and \`rob2\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function rob(nums) {
  let rob1 = 0; // max money up to i-2
  let rob2 = 0; // max money up to i-1

  for (const num of nums) {
    const current = Math.max(rob2, rob1 + num);
    rob1 = rob2;
    rob2 = current;
  }

  return rob2;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(1)$ — Two scalar variables.`
  },
  {
    id: 58,
    title: "House Robber II (LeetCode #213)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "medium"],
    source: "https://leetcode.com/problems/house-robber-ii/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Same as House Robber I, but the houses are arranged in a **circle**! The first house is the neighbor of the last house, so you cannot rob both the first and the last house together.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Run House Robber I twice: once excluding the first house, once excluding the last house. Take the maximum of both!"*

- Case 1: Rob houses from index \`0\` to \`n - 2\` (exclude last house).
- Case 2: Rob houses from index \`1\` to \`n - 1\` (exclude first house).
- Return \`Math.max(case1, case2)\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function rob(nums) {
  if (nums.length === 1) return nums[0];

  function robLinear(houses) {
    let rob1 = 0, rob2 = 0;
    for (const money of houses) {
      const current = Math.max(rob2, rob1 + money);
      rob1 = rob2;
      rob2 = current;
    }
    return rob2;
  }

  return Math.max(
    robLinear(nums.slice(0, nums.length - 1)),
    robLinear(nums.slice(1))
  );
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Two linear passes.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 59,
    title: "Decode Ways (LeetCode #91)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "strings", "medium"],
    source: "https://leetcode.com/problems/decode-ways/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
A message containing letters from A-Z can be encoded into numbers using \`'A' -> "1"\`, \`'B' -> "2"\`, ..., \`'Z' -> "26"\`.
Given a string \`s\` containing only digits, return the number of ways to decode it.
Note: \`"06"\` is invalid because \`'0'\` has no mapping!

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Climbing Stairs with restrictions: You can step 1 digit (if between 1-9) or 2 digits (if between 10-26)."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function numDecodings(s) {
  if (!s || s[0] === '0') return 0;

  const n = s.length;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  dp[1] = 1;

  for (let i = 2; i <= n; i++) {
    const singleDigit = Number(s.substring(i - 1, i));
    const doubleDigit = Number(s.substring(i - 2, i));

    // Valid single digit 1-9
    if (singleDigit >= 1 && singleDigit <= 9) {
      dp[i] += dp[i - 1];
    }

    // Valid double digit 10-26
    if (doubleDigit >= 10 && doubleDigit <= 26) {
      dp[i] += dp[i - 2];
    }
  }

  return dp[n];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(N)$ (or $O(1)$ with two variables).`
  },
  {
    id: 60,
    title: "Unique Paths (LeetCode #62)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "2D DP", "matrix", "medium"],
    source: "https://leetcode.com/problems/unique-paths/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
A robot is located at the top-left corner of an \`m x n\` grid. The robot can only move either down or right at any point. Find the number of possible unique paths to reach the bottom-right corner.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"To land on cell (r, c), you came from above (r-1, c) OR left (r, c-1). \`dp[r][c] = dp[r-1][c] + dp[r][c-1]\`!"*

Initialize top row and left column to 1 (only 1 straight line to reach them). For every inner cell, sum the cell above and cell to the left.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function uniquePaths(m, n) {
  // Use a 1D row array to optimize space from O(M*N) to O(N)
  const row = new Array(n).fill(1);

  for (let r = 1; r < m; r++) {
    for (let c = 1; c < n; c++) {
      row[c] += row[c - 1]; // row[c] was above, row[c-1] is left
    }
  }

  return row[n - 1];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$.
- **Space Complexity:** $O(N)$ using a single 1D row buffer.`
  },
  {
    id: 61,
    title: "Jump Game (LeetCode #55)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "greedy", "medium"],
    source: "https://leetcode.com/problems/jump-game/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an integer array \`nums\`. You start at index 0, and each element represents your maximum jump length from that position. Return \`true\` if you can reach the last index.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Greedy Farthest Reach: Track \`maxReach\`. If your current position is beyond \`maxReach\`, you're stranded in quicksand!"*

Walk from index 0 to $N-1$:
- If \`i > maxReach\`, return \`false\`.
- \`maxReach = Math.max(maxReach, i + nums[i])\`.
- If \`maxReach >= nums.length - 1\`, return \`true\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function canJump(nums) {
  let maxReach = 0;

  for (let i = 0; i < nums.length; i++) {
    if (i > maxReach) return false; // Stranded!

    maxReach = Math.max(maxReach, i + nums[i]);
    if (maxReach >= nums.length - 1) return true;
  }

  return true;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass.
- **Space Complexity:** $O(1)$ — Only one variable.`
  },
  {
    id: 62,
    title: "Palindromic Substrings (LeetCode #647)",
    pattern: "Dynamic Programming",
    difficulty: "medium",
    tags: ["Dynamic Programming", "two pointers", "strings", "medium"],
    source: "https://leetcode.com/problems/palindromic-substrings/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a string \`s\`, return the number of palindromic substrings in it.
Example: \`s = "aaa"\` -> \`6\` (\`"a"\`, \`"a"\`, \`"a"\`, \`"aa"\`, \`"aa"\`, \`"aaa"\`).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Expand around centers: Every palindrome expands outward from a single character (odd length) or two identical characters (even length)!"*

For each index \`i\`:
1. Expand outward with \`left = i, right = i\` (odd palindromes).
2. Expand outward with \`left = i, right = i + 1\` (even palindromes).

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function countSubstrings(s) {
  let count = 0;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // Odd-length centers
    expand(i, i + 1); // Even-length centers
  }

  return count;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N^2)$ — $2N$ centers, each expanding up to $N$ steps.
- **Space Complexity:** $O(1)$ — Constant memory.`
  }
];
