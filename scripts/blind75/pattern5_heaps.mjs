export const pattern5 = [
  {
    id: 5,
    title: "[Pattern 5/9] Heap & Priority Queue Blueprint",
    pattern: "Heap / Priority Queue",
    difficulty: "medium",
    tags: ["Heap", "Priority Queue", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Think of a **Heap** as an **Emergency Room Triage Desk**:
- At a normal doctor's office, people enter a Queue (First-In, First-Out).
- At the Emergency Room, patients are prioritized by urgency. A heart-attack patient who just arrived skips ahead of someone with a sprained ankle who has waited 2 hours.
- A **Min-Heap** always gives you the smallest element in $O(1)$ time.
- A **Max-Heap** always gives you the largest element in $O(1)$ time.
- Inserting a patient or discharging the top patient rearranges the tree in just $O(\\log K)$ time.

---

## 📊 Visual Architecture: Top-K & Dual-Heap Median Finder

![Heap and Priority Queue Pattern](/diagrams/blind75/heap_priority_queue.svg)

---

## 🧠 Two Canonical Archetypes

### 1. Top-K Elements with a Bounded Min-Heap
To find the $K$ largest elements from a stream of $N$ numbers:
- Keep a **Min-Heap** of size $K$.
- As new numbers arrive, insert them.
- If \`heap.size > K\`, pop the top element.
- Since it's a Min-Heap, the smallest element is always evicted! After processing all $N$ elements, the $K$ surviving elements in the heap are the **$K$ Largest**!
- Time: $O(N \\log K)$ instead of $O(N \\log N)$ sorting.

### 2. The Dual-Heap Median Finder
How do you find the median of a stream of numbers where data never stops arriving?
Split the numbers into two halves:
- \`maxHeap\`: Stores the smaller half of the numbers.
- \`minHeap\`: Stores the larger half of the numbers.
- Keep the sizes balanced (difference $\\le 1$). The median is either the top of the larger heap or the average of both tops!

---

## 💻 Canonical JavaScript Heap Implementation

JavaScript has no built-in PriorityQueue (in standard browser runtime), so knowing a concise MinHeap implementation is essential for interviews:

\`\`\`javascript
class MinHeap {
  constructor() {
    this.data = [];
  }
  push(val) {
    this.data.push(val);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const bottom = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = bottom;
      this._bubbleDown(0);
    }
    return top;
  }
  peek() {
    return this.data[0] ?? null;
  }
  size() {
    return this.data.length;
  }
  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.data[idx] < this.data[parent]) {
        [this.data[idx], this.data[parent]] = [this.data[parent], this.data[idx]];
        idx = parent;
      } else break;
    }
  }
  _bubbleDown(idx) {
    const last = this.data.length - 1;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;
      if (left <= last && this.data[left] < this.data[smallest]) smallest = left;
      if (right <= last && this.data[right] < this.data[smallest]) smallest = right;
      if (smallest !== idx) {
        [this.data[idx], this.data[smallest]] = [this.data[smallest], this.data[idx]];
        idx = smallest;
      } else break;
    }
  }
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Find Median from Data Stream](/blind75/48)
- [Kth Largest Element in an Array](/blind75/49)
- [Task Scheduler](/blind75/50)`
  },
  {
    id: 48,
    title: "Find Median from Data Stream (LeetCode #295)",
    pattern: "Heap / Priority Queue",
    difficulty: "hard",
    tags: ["Heap", "Priority Queue", "hard"],
    source: "https://leetcode.com/problems/find-median-from-data-stream/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
The median is the middle value in an ordered integer list. Design a data structure that continuously accepts a stream of numbers and returns the median at any moment in $O(1)$ time.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Two Heaps Meeting at the Equator: Max-Heap holds the small half, Min-Heap holds the large half. The median is right at their border!"*

1. **Smaller half:** Kept in a Max-Heap (\`small\`).
2. **Larger half:** Kept in a Min-Heap (\`large\`).
3. **Invariants:**
   - Every element in \`small\` $\\le$ every element in \`large\`.
   - Size difference between heaps $\\le 1$.
4. **Result:**
   - Odd count: Top of the bigger heap.
   - Even count: Average of \`small.peek()\` and \`large.peek()\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
class MedianFinder {
  constructor() {
    this.small = []; // Max-heap (simulated with binary insertion)
    this.large = []; // Min-heap
  }

  addNum(num) {
    // Binary insert into small or large maintaining order
    // In practice, use 2 priority queues or sorted array bisect
    let left = 0, right = this.small.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.small[mid] < num) left = mid + 1;
      else right = mid;
    }
    this.small.splice(left, 0, num);
  }

  findMedian() {
    const n = this.small.length;
    const mid = Math.floor(n / 2);
    if (n % 2 === 1) {
      return this.small[mid];
    }
    return (this.small[mid - 1] + this.small[mid]) / 2;
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(\\log N)$ insertion with heaps ($O(N)$ with binary splice), $O(1)$ lookup for median.
- **Space Complexity:** $O(N)$ to store stream elements.`
  },
  {
    id: 49,
    title: "Kth Largest Element in an Array (LeetCode #215)",
    pattern: "Heap / Priority Queue",
    difficulty: "medium",
    tags: ["Heap", "quickselect", "medium"],
    source: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an integer array \`nums\` and an integer \`k\`, return the $k^{\\text{th}}$ largest element in the array without sorting the entire array in $O(N \\log N)$.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"QuickSelect: Partition around a pivot like QuickSort, but only recurse into the one half that contains K ($O(N)$ average time)!"*

Instead of sorting the whole array:
1. Pick a random pivot.
2. Partition the array into elements greater than pivot, equal to pivot, and less than pivot.
3. Check which partition $K$ falls into, and only recurse into that single partition!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function findKthLargest(nums, k) {
  // Quickselect algorithm (O(N) average time)
  function quickSelect(arr, kTarget) {
    const pivot = arr[Math.floor(Math.random() * arr.length)];
    const left = [];   // > pivot
    const mid = [];    // === pivot
    const right = [];  // < pivot

    for (const num of arr) {
      if (num > pivot) left.push(num);
      else if (num < pivot) right.push(num);
      else mid.push(num);
    }

    if (kTarget <= left.length) {
      return quickSelect(left, kTarget);
    }
    if (kTarget <= left.length + mid.length) {
      return pivot;
    }
    return quickSelect(right, kTarget - left.length - mid.length);
  }

  return quickSelect(nums, k);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ average time ($N + N/2 + N/4 + \\dots = 2N$).
- **Space Complexity:** $O(N)$ recursion memory.`
  },
  {
    id: 50,
    title: "Task Scheduler (LeetCode #621)",
    pattern: "Heap / Priority Queue",
    difficulty: "medium",
    tags: ["Heap", "greedy", "math", "medium"],
    source: "https://leetcode.com/problems/task-scheduler/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a characters array \`tasks\` representing tasks a CPU needs to do, and a non-negative integer \`n\` representing the cooldown period between two **same** tasks. Return the minimum number of intervals the CPU will take to finish all the given tasks.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"The task with the maximum frequency creates the framework! Formula: \`(maxFreq - 1) × (n + 1) + countOfMaxFreq\`."*

If task \`A\` appears 3 times with cooldown $n=2$:
\`A _ _ A _ _ A\`
There are \`maxFreq - 1\` full blocks, each of size \`n + 1\`. Then add any other tasks that also share that same maximum frequency! If there are so many other tasks that no idle slots remain, the answer is just \`tasks.length\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function leastInterval(tasks, n) {
  const counts = new Map();
  let maxFreq = 0;

  for (const t of tasks) {
    const freq = (counts.get(t) ?? 0) + 1;
    counts.set(t, freq);
    maxFreq = Math.max(maxFreq, freq);
  }

  // Count how many tasks share the highest frequency
  let maxFreqCount = 0;
  for (const freq of counts.values()) {
    if (freq === maxFreq) maxFreqCount++;
  }

  const emptySlots = (maxFreq - 1) * (n + 1) + maxFreqCount;
  return Math.max(tasks.length, emptySlots);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single frequency tally.
- **Space Complexity:** $O(1)$ — At most 26 uppercase task letters.`
  }
];
