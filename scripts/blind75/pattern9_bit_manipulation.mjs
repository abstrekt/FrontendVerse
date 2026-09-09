export const pattern9 = [
  {
    id: 9,
    title: "[Pattern 9/9] Bit Manipulation Blueprint",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Imagine you are operating a control board of 32 physical light switches:
- Instead of keeping a heavy diary or allocating new shelves in memory to record numbers, each switch represents a binary digit (\`1\` for ON, \`0\` for OFF).
- When you do **Bit Manipulation**, you are directly flipping, testing, and clearing electrical currents at hardware speed inside CPU registers. There are no allocations, no garbage collection overhead, and zero extra memory.

---

## 📊 Visual Architecture: The 6 Bitwise Pillars & XOR Annihilator

![Bit Manipulation Pattern](/diagrams/blind75/bit_manipulation.svg)

---

## 🧠 The 6 Core Bitwise Operators in JavaScript

| Operator | Syntax | Description | Example |
| :--- | :--- | :--- | :--- |
| **AND** | \`a & b\` | 1 only if **both** bits are 1 | \`5 & 3\` (101 & 011 = 001 = 1) |
| **OR** | \`a \| b\` | 1 if **either** bit is 1 | \`5 \| 3\` (101 \| 011 = 111 = 7) |
| **XOR** | \`a ^ b\` | 1 if bits are **different** | \`5 ^ 3\` (101 ^ 011 = 110 = 6) |
| **NOT** | \`~a\` | Inverts all 32 bits (\`-(a + 1)\`) | \`~5\` = \`-6\` |
| **Left Shift** | \`a << k\` | Shifts bits left by $k$ (multiplies by $2^k$) | \`3 << 2\` = \`12\` |
| **Unsigned Right Shift** | \`a >>> k\` | Shifts bits right by $k$, fills 0 from left | \`-1 >>> 0\` = \`4294967295\` |

---

## ⚡ The 3 Golden Bit Tricks (Memorize These!)

### 1. The Universal Annihilator (XOR Magic)
- \`x ^ x = 0\` (any number XORed with itself cancels out to zero)
- \`x ^ 0 = x\` (any number XORed with zero remains unchanged)
- XOR is commutative and associative: \`a ^ b ^ a = (a ^ a) ^ b = 0 ^ b = b\`!
- **Use Case:** Finding the single unique element among duplicates or finding missing numbers.

### 2. Brian Kernighan’s Trick (Clear Lowest Set Bit)
\`\`\`javascript
n = n & (n - 1);
\`\`\`
- Subtracting 1 flips the lowest \`1\` bit and turns all subsequent trailing zeros to \`1\`s.
- ANDing \`n\` with \`n - 1\` instantly extinguishes the lowest \`1\` bit in $O(1)$!
- **Use Case:** Count set bits in $O(K)$ time (where $K$ is number of 1-bits, not 32).

### 3. Extract Lowest Set Bit
\`\`\`javascript
const lowestSetBit = n & (-n);
\`\`\`
- In two's complement, \`-n === ~n + 1\`.
- ANDing \`n\` with \`-n\` isolates the single lowest \`1\` bit as a power of 2.

---

## ⚠️ Critical JavaScript Gotchas with Bits
1. **32-Bit Truncation:** In JavaScript, bitwise operators cast double-precision 64-bit floats to **32-bit signed two's complement integers**.
2. **Logical vs Arithmetic Right Shift:**
   - \`>>\` preserves the sign bit (copies the sign bit from the left).
   - \`>>>\` is **unsigned zero-fill right shift**. Always use \`>>>\` when dealing with unsigned 32-bit integers (e.g., LeetCode 190, 191).
3. Convert to Unsigned: \`val >>> 0\` forces JavaScript to return a positive unsigned number up to $2^{32}-1$.`
  },
  {
    id: 80,
    title: "Single Number (LeetCode #136)",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "XOR", "easy"],
    source: "https://leetcode.com/problems/single-number/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a non-empty array of integers \`nums\`, every element appears twice except for one unique element. Find that single one. You must implement a solution with linear runtime complexity and use only constant extra space.

Example: \`nums = [4, 1, 2, 1, 2]\` -> Output: \`4\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"XOR cancels twins! a ^ a = 0. All duplicates extinguish each other, leaving only the loner standing!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Finds the element appearing once when all others appear twice.
 * @param {number[]} nums
 * @return {number}
 */
function singleNumber(nums) {
  let result = 0;

  // XORing all elements together
  for (const num of nums) {
    result ^= num;
  }

  return result;
}

// Visual Walkthrough: [4, 1, 2, 1, 2]
// 0 ^ 4 = 4
// 4 ^ 1 = 5
// 5 ^ 2 = 7
// 7 ^ 1 = 6  (1 cancels 1)
// 6 ^ 2 = 4  (2 cancels 2)
// Final result = 4!
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through the array.
- **Space Complexity:** $O(1)$ — Only a single accumulator variable.`
  },
  {
    id: 81,
    title: "Number of 1 Bits / Hamming Weight (LeetCode #191)",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "Brian Kernighan", "easy"],
    source: "https://leetcode.com/problems/number-of-1-bits/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Write a function that takes the binary representation of a positive integer and returns the number of set bits (\`1\`s) it contains (also known as the Hamming weight).

Example: \`n = 11\` (binary \`00000000000000000000000000001011\`) -> Output: \`3\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Brian Kernighan's trick: n & (n - 1) wipes out the lowest set bit on every iteration! Loops only as many times as there are 1s, skipping all 0s!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Counts the number of set bits (1s) in a 32-bit integer.
 * @param {number} n
 * @return {number}
 */
function hammingWeight(n) {
  let count = 0;

  while (n !== 0) {
    // Clears the lowest set 1-bit
    n = n & (n - 1);
    count++;
  }

  return count;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(K)$ where $K$ is the number of \`1\` bits (at most 32). Much faster than testing all 32 bits!
- **Space Complexity:** $O(1)$ constant space.`
  },
  {
    id: 82,
    title: "Counting Bits (LeetCode #338)",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "DP", "easy"],
    source: "https://leetcode.com/problems/counting-bits/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer \`n\`, return an array \`ans\` of length \`n + 1\` such that for each \`i\` (\`0 <= i <= n\`), \`ans[i]\` is the number of \`1\`s in the binary representation of \`i\`. You should solve it in linear $O(N)$ time.

Example: \`n = 5\` -> \`[0, 1, 1, 2, 1, 2]\` (binary: 0->0, 1->1, 2->1, 3->2, 4->1, 5->2).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"DP on bit shift: Shifting i right by 1 (i >> 1) is a problem we already solved! ans[i] = ans[i >> 1] + (i & 1)."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Returns number of 1 bits for all integers from 0 to n.
 * @param {number} n
 * @return {number[]}
 */
function countBits(n) {
  const ans = new Array(n + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    // i >> 1 drops the last bit (its bit count is already memoized in ans)
    // (i & 1) checks if the dropped bit was a 1
    ans[i] = ans[i >> 1] + (i & 1);
  }

  return ans;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Exactly one computation per number up to $n$.
- **Space Complexity:** $O(1)$ auxiliary space (excluding the returned array of size $N + 1$).`
  },
  {
    id: 83,
    title: "Reverse Bits (LeetCode #190)",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "bit shifts", "easy"],
    source: "https://leetcode.com/problems/reverse-bits/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Reverse the bits of a given 32-bit unsigned integer.

Example: Input \`00000010100101000001111010011100\` -> Output \`00111001011110000010100101000000\` (964176192).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Assembly line reversal: At each of 32 steps, shift result left, attach n's lowest bit, and shift n unsigned-right (>>> 1). End with >>> 0 for unsigned!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Reverses the bits of a 32-bit unsigned integer.
 * @param {number} n
 * @return {number}
 */
function reverseBits(n) {
  let result = 0;

  for (let i = 0; i < 32; i++) {
    // Shift result left to make room for the new bit
    // Attach the lowest bit of n (n & 1)
    result = (result << 1) | (n & 1);

    // Unsigned right shift n by 1 to inspect the next bit
    n = n >>> 1;
  }

  // >>> 0 converts signed 32-bit integer to unsigned 32-bit number
  return result >>> 0;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(1)$ — Always runs exactly 32 loop iterations.
- **Space Complexity:** $O(1)$ — Only a single integer result variable.`
  },
  {
    id: 84,
    title: "Missing Number (LeetCode #268)",
    pattern: "Bit Manipulation",
    difficulty: "easy",
    tags: ["Bit Manipulation", "XOR", "math", "easy"],
    source: "https://leetcode.com/problems/missing-number/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array \`nums\` containing \`n\` distinct numbers in the range \`[0, n]\`, return the only number in the range that is missing from the array.

Example: \`nums = [3, 0, 1]\` (length is 3, expected range [0, 3]). Missing number: \`2\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Two XOR sweeps: XOR all indices 0..n and XOR all array values. Everything matches up except the missing number!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Finds the missing number in range [0, n] using XOR.
 * @param {number[]} nums
 * @return {number}
 */
function missingNumber(nums) {
  const n = nums.length;
  let xor = n; // Start with n

  for (let i = 0; i < n; i++) {
    // XOR both index i and the element nums[i]
    xor ^= i ^ nums[i];
  }

  return xor;
}

// Alternative Mathematical Gauss Sum Formula:
// function missingNumberGauss(nums) {
//   const n = nums.length;
//   const expectedSum = (n * (n + 1)) / 2;
//   const actualSum = nums.reduce((acc, curr) => acc + curr, 0);
//   return expectedSum - actualSum;
// }
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through the array.
- **Space Complexity:** $O(1)$ — Pure constant memory.`
  },
  {
    id: 85,
    title: "Sum of Two Integers (LeetCode #371)",
    pattern: "Bit Manipulation",
    difficulty: "medium",
    tags: ["Bit Manipulation", "half adder", "medium"],
    source: "https://leetcode.com/problems/sum-of-two-integers/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given two integers \`a\` and \`b\`, return the sum of the two integers without using the operators \`+\` and \`-\`.

Example: \`a = 2, b = 3\` -> Output: \`5\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Hardware half-adder: a ^ b is the sum without carry. (a & b) << 1 is the carry! Keep repeating until carry becomes 0!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
/**
 * Adds two integers without using + or - operators.
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
function getSum(a, b) {
  while (b !== 0) {
    // Carry bits occur where both bits are 1, shifted left by 1
    const carry = (a & b) << 1;

    // Sum without carry (XOR simulates addition without carrying)
    a = a ^ b;

    // Advance carry to next iteration
    b = carry;
  }

  return a;
}

// Trace: a = 2 (010), b = 3 (011)
// Iteration 1:
// carry = (010 & 011) << 1 = 010 << 1 = 100 (4)
// a = 010 ^ 011 = 001 (1)
// b = 100 (4)
// Iteration 2:
// carry = (001 & 100) << 1 = 000 << 1 = 0
// a = 001 ^ 100 = 101 (5)
// b = 0
// Loop ends, returns 5!
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(1)$ — At most 32 iterations since integers are 32-bit.
- **Space Complexity:** $O(1)$ constant space.`
  }
];
