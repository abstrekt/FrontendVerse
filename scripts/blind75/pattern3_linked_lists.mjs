export const pattern3 = [
  {
    id: 3,
    title: "[Pattern 3/9] Linked Lists Blueprint",
    pattern: "Linked Lists",
    difficulty: "easy",
    tags: ["Linked Lists", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Think of a **Linked List** as a **scavenger hunt**:
- In an Array, clues are sitting side-by-side in labeled lockers \`0, 1, 2, 3\`. You can open locker \`#42\` instantly in $O(1)$ time.
- In a Linked List, each clue is hidden in a random place, and inside the box is a note with the GPS coordinates of the **next clue**. You cannot skip to clue #5 without physically walking through clues 1, 2, 3, and 4.

The superpower of a linked list is that inserting or removing an item in the middle doesn't require shifting thousands of items—you just erase one arrow and draw a new arrow in $O(1)$ time!

---

## 📊 Visual Architecture: 3-Pointer Reversal & Tortoise-Hare

![Linked Lists Pattern](/diagrams/blind75/linked_lists.svg)

---

## 🧠 The 3 Essential Master Tools

### 1. The Dummy Head (Sentinel Node)
Whenever the true head of the list might change or be deleted, allocate a fake dummy node:
\`\`\`javascript
const dummy = { val: 0, next: head };
\`\`\`
Return \`dummy.next\` at the end. This eliminates 90% of messy \`if (head === null)\` or \`if (prev === null)\` edge cases!

### 2. In-Place Reversal (The 3-Pointer Dance)
Three pointers: \`prev\`, \`current\`, and \`next\`.
**The golden rule:** You must save \`const next = current.next\` **before** you overwrite \`current.next = prev\`. The moment you overwrite the link, the rest of the list is lost in memory forever!

### 3. Fast & Slow Pointers (Floyd's Tortoise and Hare)
- Move \`slow\` by 1 step. Move \`fast\` by 2 steps.
- **Find middle:** When \`fast\` hits the end, \`slow\` is standing exactly in the middle.
- **Cycle detection:** If there is a loop, \`fast\` is guaranteed to lap \`slow\` from behind. They must meet.

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// Blueprint 1: Reverse Linked List (O(N) time, O(1) space)
function reverseList(head) {
  let prev = null;
  let current = head;

  while (current) {
    const next = current.next; // 1. Save link
    current.next = prev;       // 2. Reverse arrow
    prev = current;            // 3. Advance prev
    current = next;            // 4. Advance current
  }

  return prev; // New head of reversed list
}

// Blueprint 2: Floyd's Cycle Detection
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true; // Lapped!
  }

  return false;
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Reverse Linked List](/blind75/28)
- [Merge Two Sorted Lists](/blind75/29)
- [Linked List Cycle](/blind75/30)
- [Reorder List](/blind75/31)
- [Remove Nth Node From End of List](/blind75/32)
- [Merge k Sorted Lists](/blind75/33)`
  },
  {
    id: 28,
    title: "Reverse Linked List (LeetCode #206)",
    pattern: "Linked Lists",
    difficulty: "easy",
    tags: ["Linked Lists", "pointers", "easy"],
    source: "https://leetcode.com/problems/reverse-linked-list/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.

Example: \`1 -> 2 -> 3 -> 4 -> 5\` becomes \`5 -> 4 -> 3 -> 2 -> 1\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Save next before you cut the wire! Four steps: save next, flip pointer, slide prev, slide current."*

1. \`const next = curr.next;\`
2. \`curr.next = prev;\`
3. \`prev = curr;\`
4. \`curr = next;\`
When \`curr\` becomes \`null\`, \`prev\` is the new head!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function reverseList(head) {
  let prev = null;
  let current = head;

  while (current) {
    const next = current.next; // Save next node
    current.next = prev;       // Reverse pointer
    prev = current;            // Step forward
    current = next;
  }

  return prev;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Visits every node once.
- **Space Complexity:** $O(1)$ — Only two pointer variables.
- **In-App Practice:** [/coding/44](/coding/44)`
  },
  {
    id: 29,
    title: "Merge Two Sorted Lists (LeetCode #21)",
    pattern: "Linked Lists",
    difficulty: "easy",
    tags: ["Linked Lists", "two pointers", "easy"],
    source: "https://leetcode.com/problems/merge-two-sorted-lists/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given the heads of two sorted linked lists \`list1\` and \`list2\`.
Merge the two lists into one sorted list by splicing together the nodes of the first two lists.

Example: \`1 -> 2 -> 4\` and \`1 -> 3 -> 4\` -> \`1 -> 1 -> 2 -> 3 -> 4 -> 4\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Use a Dummy Head. Compare list1 vs list2, append the smaller node to tail, and finally splice on whichever list has leftover nodes!"*

Create a dummy node \`dummy = { val: 0, next: null }\` and \`tail = dummy\`.
Compare \`list1.val\` vs \`list2.val\`. Attach the smaller to \`tail.next\` and advance that list. When one list runs out, directly attach the other list in $O(1)$!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function mergeTwoLists(list1, list2) {
  const dummy = { val: 0, next: null };
  let tail = dummy;

  while (list1 && list2) {
    if (list1.val <= list2.val) {
      tail.next = list1;
      list1 = list1.next;
    } else {
      tail.next = list2;
      list2 = list2.next;
    }
    tail = tail.next;
  }

  // Attach remaining elements in O(1)
  tail.next = list1 || list2;

  return dummy.next;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N + M)$ — Where $N, M$ are lengths of the lists.
- **Space Complexity:** $O(1)$ — Merged in place without allocating new list nodes.`
  },
  {
    id: 30,
    title: "Linked List Cycle (LeetCode #141)",
    pattern: "Linked Lists",
    difficulty: "easy",
    tags: ["Linked Lists", "Floyd", "two pointers", "easy"],
    source: "https://leetcode.com/problems/linked-list-cycle/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given \`head\`, the head of a linked list, determine if the linked list has a cycle in it. A cycle exists if some node in the list can be reached again by continuously following the \`next\` pointer.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Floyd's Tortoise and Hare: If two runners are on a circular track, the faster runner will always lap and collide with the slower runner."*

- \`slow\` moves 1 step at a time.
- \`fast\` moves 2 steps at a time.
- If there is no cycle, \`fast\` reaches \`null\`.
- If there is a cycle, the gap between \`fast\` and \`slow\` closes by 1 node on every single step until \`slow === fast\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function hasCycle(head) {
  let slow = head;
  let fast = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) {
      return true; // Cycle confirmed!
    }
  }

  return false;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — In the worst case, fast catches slow within $N$ steps.
- **Space Complexity:** $O(1)$ — No extra Set needed!`
  },
  {
    id: 31,
    title: "Reorder List (LeetCode #143)",
    pattern: "Linked Lists",
    difficulty: "medium",
    tags: ["Linked Lists", "two pointers", "medium"],
    source: "https://leetcode.com/problems/reorder-list/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the head of a singly linked list:
\`L0 → L1 → … → Ln - 1 → Ln\`
Reorder it to:
\`L0 → Ln → L1 → Ln - 1 → L2 → Ln - 2 → …\`

Example: \`1 -> 2 -> 3 -> 4\` becomes \`1 -> 4 -> 2 -> 3\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"The 3-act play: 1. Find middle with slow/fast. 2. Reverse second half. 3. Zipper merge the two halves together!"*

This problem is a masterclass because it combines all 3 linked list fundamentals in one:
1. Fast/slow pointers to split the list in half.
2. In-place reversal of the second half.
3. Two-pointer merge zipping nodes alternatingly.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function reorderList(head) {
  if (!head || !head.next) return;

  // 1. Find middle of list
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  // 2. Reverse second half
  let prev = null;
  let curr = slow.next;
  slow.next = null; // Split the two halves

  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  // 3. Zipper merge first half (head) and second half (prev)
  let first = head;
  let second = prev;

  while (second) {
    const temp1 = first.next;
    const temp2 = second.next;

    first.next = second;
    second.next = temp1;

    first = temp1;
    second = temp2;
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Half pass + reverse half + merge half = linear.
- **Space Complexity:** $O(1)$ — Complete in-place rewiring.`
  },
  {
    id: 32,
    title: "Remove Nth Node From End of List (LeetCode #19)",
    pattern: "Linked Lists",
    difficulty: "medium",
    tags: ["Linked Lists", "two pointers", "medium"],
    source: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the head of a linked list, remove the $n^{\\text{th}}$ node from the end of the list and return its head in **one single pass**.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Two pointers with a gap of N. When fast reaches the end, slow is standing right before the victim node!"*

1. Create a dummy head in front: \`dummy.next = head\`.
2. Advance \`fast\` pointer $n$ steps ahead.
3. Advance both \`slow\` and \`fast\` together until \`fast.next === null\`.
4. Now \`slow.next\` is the target! Delete it with:
   \`slow.next = slow.next.next\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function removeNthFromEnd(head, n) {
  const dummy = { val: 0, next: head };
  let slow = dummy;
  let fast = dummy;

  // Move fast pointer n steps ahead
  for (let i = 0; i < n; i++) {
    fast = fast.next;
  }

  // Move both until fast is at the tail
  while (fast.next) {
    slow = slow.next;
    fast = fast.next;
  }

  // Delete the nth node from end
  slow.next = slow.next.next;

  return dummy.next;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass traversal.
- **Space Complexity:** $O(1)$ — Dummy node and two pointers.`
  },
  {
    id: 33,
    title: "Merge k Sorted Lists (LeetCode #23)",
    pattern: "Linked Lists",
    difficulty: "hard",
    tags: ["Linked Lists", "divide and conquer", "heap", "hard"],
    source: "https://leetcode.com/problems/merge-k-sorted-lists/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an array of $k$ linked-lists \`lists\`, each linked-list is sorted in ascending order.
Merge all the linked-lists into one sorted linked-list and return it.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Divide and Conquer: Merge lists pairwise in tournament brackets like the FIFA World Cup ($O(N \\log K)$)."*

Merging lists one by one takes $O(k \\cdot N)$.
Instead, merge lists in pairs:
- Round 1: List 0 with 1, List 2 with 3... ($k/2$ lists remain)
- Round 2: Pair remaining lists... ($k/4$ lists remain)
In $\\log k$ rounds, all lists are merged cleanly into one!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function mergeKLists(lists) {
  if (!lists || lists.length === 0) return null;

  // Helper function to merge two sorted lists (LeetCode #21)
  function merge2Lists(l1, l2) {
    const dummy = { val: 0, next: null };
    let tail = dummy;
    while (l1 && l2) {
      if (l1.val <= l2.val) {
        tail.next = l1;
        l1 = l1.next;
      } else {
        tail.next = l2;
        l2 = l2.next;
      }
      tail = tail.next;
    }
    tail.next = l1 || l2;
    return dummy.next;
  }

  // Divide and conquer pairwise merge
  while (lists.length > 1) {
    const mergedList = [];
    for (let i = 0; i < lists.length; i += 2) {
      const l1 = lists[i];
      const l2 = i + 1 < lists.length ? lists[i + 1] : null;
      mergedList.push(merge2Lists(l1, l2));
    }
    lists = mergedList;
  }

  return lists[0];
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log K)$ where $N$ is total nodes across all lists, and $K$ is number of lists.
- **Space Complexity:** $O(1)$ extra space.`
  }
];
