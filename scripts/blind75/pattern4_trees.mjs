export const pattern4 = [
  {
    id: 4,
    title: "[Pattern 4/9] Trees & BST Blueprint",
    pattern: "Trees & BST",
    difficulty: "easy",
    tags: ["Trees & BST", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Think of a **Tree** as an **org chart** or **file system folder hierarchy**:
- The CEO is the \`root\`.
- Vice Presidents are \`children\`.
- An individual worker with no direct reports is a \`leaf\`.
- The beauty of trees is that **every sub-department is itself a valid tree!** This is why recursion feels like magic on trees: if you can write code that works on one manager and their two deputies, you have solved the problem for a million employees.

---

## 📊 Visual Architecture: Traversals & BST Invariant

![Trees and BST Pattern](/diagrams/blind75/trees_and_bst.svg)

---

## 🧠 The 4 Foundational Archetypes

### 1. Depth-First Search (DFS)
Go down to the leaves before coming back up. Three classic orders:
- **Pre-order (Visit -> Left -> Right):** Copying or serializing a tree.
- **In-order (Left -> Visit -> Right):** **Yields strictly sorted values on a Binary Search Tree (BST)!**
- **Post-order (Left -> Right -> Visit):** Bottom-up aggregation (computing depths, sub-tree sizes, deleting nodes).

### 2. Breadth-First Search (BFS / Level-Order)
Explore the tree floor-by-floor using a \`queue\`.
**The snapshot trick:** Snapshot \`levelSize = queue.length\` before the inner loop so you don't blend floors together.

### 3. The BST Invariant
For every node:
\`All Left Subtree Values < Node.val < All Right Subtree Values\`
Searching a BST is just Binary Search with pointers: $O(\\log N)$.

### 4. Prefix Tree (Trie)
A tree where each node holds an alphabet map (26 letters). Used for dictionary auto-complete, spell-check, and prefix searching in $O(L)$ time.

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// 1. Recursive DFS Skeleton (Bottom-up aggregation)
function maxDepth(root) {
  if (!root) return 0; // Base case: leaf reached
  const leftDepth = maxDepth(root.left);
  const rightDepth = maxDepth(root.right);
  return 1 + Math.max(leftDepth, rightDepth);
}

// 2. BFS Level-Order Traversal (Snapshot queue)
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length; // SNAPSHOT current floor
    const currentFloor = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentFloor.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(currentFloor);
  }

  return result;
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Invert Binary Tree](/blind75/34)
- [Maximum Depth of Binary Tree](/blind75/35)
- [Same Tree](/blind75/36)
- [Subtree of Another Tree](/blind75/37)
- [Lowest Common Ancestor of a BST](/blind75/38)
- [Binary Tree Level Order Traversal](/blind75/39)
- [Validate Binary Search Tree](/blind75/40)
- [Kth Smallest Element in a BST](/blind75/41)
- [Construct Binary Tree from Preorder and Inorder](/blind75/42)
- [Binary Tree Maximum Path Sum](/blind75/43)
- [Serialize and Deserialize Binary Tree](/blind75/44)
- [Implement Trie](/blind75/45)
- [Design Add and Search Words](/blind75/46)
- [Word Search II](/blind75/47)`
  },
  {
    id: 34,
    title: "Invert Binary Tree (LeetCode #226)",
    pattern: "Trees & BST",
    difficulty: "easy",
    tags: ["Trees & BST", "recursion", "easy"],
    source: "https://leetcode.com/problems/invert-binary-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the \`root\` of a binary tree, invert the tree (mirror image), and return its root.
The famous problem that inspired the tweet: *"Google: 90% of our engineers use the software you wrote (Homebrew), but you can't invert a binary tree on a whiteboard so f*** off."*

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Swap left and right children at the current node, then tell recursion to do the same for both children!"*

1. Base case: If \`root === null\`, return \`null\`.
2. Swap: \`[root.left, root.right] = [root.right, root.left]\`.
3. Recurse: \`invertTree(root.left)\` and \`invertTree(root.right)\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function invertTree(root) {
  if (!root) return null;

  // Swap left and right subtrees
  const temp = root.left;
  root.left = invertTree(root.right);
  root.right = invertTree(temp);

  return root;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Every node is visited once.
- **Space Complexity:** $O(H)$ — Call stack proportional to tree height $H$ ($O(\\log N)$ balanced, $O(N)$ worst case).`
  },
  {
    id: 35,
    title: "Maximum Depth of Binary Tree (LeetCode #104)",
    pattern: "Trees & BST",
    difficulty: "easy",
    tags: ["Trees & BST", "recursion", "DFS", "easy"],
    source: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the \`root\` of a binary tree, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"My depth = 1 + max(leftDepth, rightDepth)."*

Ask your left child: *"What's your depth?"*
Ask your right child: *"What's your depth?"*
Take the bigger of the two and add 1 for yourself.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Touches each node once.
- **Space Complexity:** $O(H)$ — Call stack height.`
  },
  {
    id: 36,
    title: "Same Tree (LeetCode #100)",
    pattern: "Trees & BST",
    difficulty: "easy",
    tags: ["Trees & BST", "recursion", "easy"],
    source: "https://leetcode.com/problems/same-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.
Two binary trees are considered the same if they are structurally identical, and the nodes have the same value.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"3-part checklist: Both null? True. One null? False. Values match? Recurse both left and right."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function isSameTree(p, q) {
  // Both empty -> identical
  if (!p && !q) return true;

  // One empty or values differ -> not identical
  if (!p || !q || p.val !== q.val) return false;

  // Check subtrees recursively
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Traverses both trees in parallel.
- **Space Complexity:** $O(H)$ — Call stack space.`
  },
  {
    id: 37,
    title: "Subtree of Another Tree (LeetCode #572)",
    pattern: "Trees & BST",
    difficulty: "easy",
    tags: ["Trees & BST", "recursion", "easy"],
    source: "https://leetcode.com/problems/subtree-of-another-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the roots of two binary trees \`root\` and \`subRoot\`, return \`true\` if there is a subtree of \`root\` with the same structure and node values as \`subRoot\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Is subRoot identical to me, or is it inside my left child, or is it inside my right child?"*

Reuse the \`isSameTree\` function from LeetCode #100!
Check if \`isSameTree(root, subRoot)\` is true. If not, recursively ask \`isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot)\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function isSubtree(root, subRoot) {
  if (!root) return false;

  function isSame(t1, t2) {
    if (!t1 && !t2) return true;
    if (!t1 || !t2 || t1.val !== t2.val) return false;
    return isSame(t1.left, t2.left) && isSame(t1.right, t2.right);
  }

  if (isSame(root, subRoot)) return true;

  return isSubtree(root.left, subRoot) || isSubtree(root.right, subRoot);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\cdot M)$ where $N$ and $M$ are node counts.
- **Space Complexity:** $O(H)$ — Recursion call stack.`
  },
  {
    id: 38,
    title: "Lowest Common Ancestor of a BST (LeetCode #235)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "BST", "medium"],
    source: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes \`p\` and \`q\`. The LCA is the lowest node that has both \`p\` and \`q\` as descendants.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Follow the split point! If both p and q are smaller than current, go left. If both are bigger, go right. The moment they diverge, current is the LCA!"*

Because it is a BST:
- If \`p.val < curr.val\` and \`q.val < curr.val\`, LCA must be in the left subtree.
- If \`p.val > curr.val\` and \`q.val > curr.val\`, LCA must be in the right subtree.
- If one is on the left and one is on the right (or \`curr\` equals \`p\` or \`q\`), this node is the ancestor!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function lowestCommonAncestor(root, p, q) {
  let curr = root;

  while (curr) {
    if (p.val < curr.val && q.val < curr.val) {
      curr = curr.left;
    } else if (p.val > curr.val && q.val > curr.val) {
      curr = curr.right;
    } else {
      // Split point found (or curr matches p or q)
      return curr;
    }
  }

  return null;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(H)$ — Proportional to tree height ($O(\\log N)$ for balanced BST).
- **Space Complexity:** $O(1)$ — Iterative traversal.`
  },
  {
    id: 39,
    title: "Binary Tree Level Order Traversal (LeetCode #102)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "BFS", "queue", "medium"],
    source: "https://leetcode.com/problems/binary-tree-level-order-traversal/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the root of a binary tree, return the level order traversal of its nodes' values (i.e. from left to right, level by level).

Example: Root 3 with children 9 and 20 -> \`[[3], [9, 20]]\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"BFS with Queue: Snapshot levelSize = queue.length before draining the level!"*

At the start of the outer while loop, the queue holds *only* the nodes for the current level.
Measure \`levelSize = queue.length\`. Run a loop exactly that many times. Every child you push lands after the snapshot, ready for the next level!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length; // Snapshot size
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Every node is enqueued and dequeued once.
- **Space Complexity:** $O(W)$ — Where $W$ is maximum width of tree (up to $N/2$).
- **In-App Practice:** [/coding/45](/coding/45)`
  },
  {
    id: 40,
    title: "Validate Binary Search Tree (LeetCode #98)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "BST", "DFS", "medium"],
    source: "https://leetcode.com/problems/validate-binary-search-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the root of a binary tree, determine if it is a valid binary search tree (BST).
A valid BST requires that **all** nodes in the left subtree are strictly less than the node's value, and all nodes in the right subtree are strictly greater.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Don't just check immediate children! Pass down a valid (min, max) range to every recursive call."*

**The Trap:** Checking \`node.left.val < node.val < node.right.val\` locally is wrong! A node deep in the left subtree could be 100 while the root is 5.
To fix this, pass \`(min, max)\` boundaries down the tree:
- Going left: \`validate(node.left, min, node.val)\`
- Going right: \`validate(node.right, node.val, max)\`

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;

    // Node value must be strictly between min and max
    if (node.val <= min || node.val >= max) {
      return false;
    }

    // Left child's upper bound is node.val
    // Right child's lower bound is node.val
    return (
      validate(node.left, min, node.val) &&
      validate(node.right, node.val, max)
    );
  }

  return validate(root, -Infinity, Infinity);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Each node checked once.
- **Space Complexity:** $O(H)$ — Call stack.`
  },
  {
    id: 41,
    title: "Kth Smallest Element in a BST (LeetCode #230)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "BST", "medium"],
    source: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given the root of a binary search tree and an integer \`k\`, return the $k^{\\text{th}}$ smallest value (1-indexed) of all the values of the nodes in the tree.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"In-order traversal on a BST visits nodes in strictly sorted ascending order!"*

Traverse in-order (Left -> Root -> Right).
Count each node as you visit it (\`count++\`). When \`count === k\`, you have found the answer!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function kthSmallest(root, k) {
  let count = 0;
  let result = null;

  function inorder(node) {
    if (!node || result !== null) return;

    inorder(node.left);

    count++;
    if (count === k) {
      result = node.val;
      return;
    }

    inorder(node.right);
  }

  inorder(root);
  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(H + K)$ — Stops as soon as the $k^{\\text{th}}$ element is hit.
- **Space Complexity:** $O(H)$ — Recursion stack.`
  },
  {
    id: 42,
    title: "Construct Binary Tree from Preorder and Inorder Traversal (LeetCode #105)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "recursion", "medium"],
    source: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given two integer arrays \`preorder\` and \`inorder\`, construct and return the binary tree.
- \`preorder\` visits \`Root -> Left -> Right\` (First element is ALWAYS the root!).
- \`inorder\` visits \`Left -> Root -> Right\` (Everything left of the root belongs to the left subtree!).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Preorder gives you the root; Inorder gives you the left/right subtree split."*

1. Take \`preorder[0]\` as the root node.
2. Find its position in \`inorder\`. Everything to the left is the left subtree; everything to the right is the right subtree!
3. Recurse for left and right subtrees.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function buildTree(preorder, inorder) {
  if (!preorder.length || !inorder.length) return null;

  // Root is always first in preorder
  const rootVal = preorder[0];
  const root = { val: rootVal, left: null, right: null };

  // Find root position in inorder to split subtrees
  const mid = inorder.indexOf(rootVal);

  root.left = buildTree(preorder.slice(1, mid + 1), inorder.slice(0, mid));
  root.right = buildTree(preorder.slice(mid + 1), inorder.slice(mid + 1));

  return root;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ with a Map for index lookups ($O(N^2)$ with \`indexOf\` / slice).
- **Space Complexity:** $O(N)$ — Tree construction.`
  },
  {
    id: 43,
    title: "Binary Tree Maximum Path Sum (LeetCode #124)",
    pattern: "Trees & BST",
    difficulty: "hard",
    tags: ["Trees & BST", "DFS", "hard"],
    source: "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
A path in a binary tree is a sequence of nodes where each pair of adjacent nodes has an edge connecting them. A node can only appear at most once in a path. Return the maximum path sum of any non-empty path.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Distinguish what you return to the parent vs what you calculate as a complete arch path!"*

At each node:
- **Complete Path:** Can arch through \`left + node.val + right\`. Update global \`maxSum\` with this.
- **Return to Parent:** A parent can only continue the path down **one single branch**! So return \`node.val + Math.max(left, right)\`.
- **Ignore negative gains:** If a child's branch sum is negative, clamp it to 0 (\`Math.max(0, sum)\`).

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function maxPathSum(root) {
  let globalMax = -Infinity;

  function maxGain(node) {
    if (!node) return 0;

    // Ignore negative branches
    const leftGain = Math.max(0, maxGain(node.left));
    const rightGain = Math.max(0, maxGain(node.right));

    // Price of path arching through current node
    const currentPathSum = node.val + leftGain + rightGain;
    globalMax = Math.max(globalMax, currentPathSum);

    // Return maximum single branch path to parent
    return node.val + Math.max(leftGain, rightGain);
  }

  maxGain(root);
  return globalMax;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Each node visited once.
- **Space Complexity:** $O(H)$ — Call stack height.`
  },
  {
    id: 44,
    title: "Serialize and Deserialize Binary Tree (LeetCode #297)",
    pattern: "Trees & BST",
    difficulty: "hard",
    tags: ["Trees & BST", "DFS", "strings", "hard"],
    source: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Pre-order traversal with a null marker: serialize with \`val,val,null,...\`, deserialize using a queue of tokens."*

- **Serialize:** Pre-order DFS (\`Root, Left, Right\`). Output node values delimited by commas; emit \`"N"\` for null nodes.
- **Deserialize:** Split string into tokens. Shift tokens one by one. If token is \`"N"\`, return \`null\`. Otherwise create node and recurse for left and right!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function serialize(root) {
  const parts = [];
  function dfs(node) {
    if (!node) {
      parts.push("N");
      return;
    }
    parts.push(String(node.val));
    dfs(node.left);
    dfs(node.right);
  }
  dfs(root);
  return parts.join(",");
}

function deserialize(data) {
  const tokens = data.split(",");
  let index = 0;

  function dfs() {
    if (tokens[index] === "N") {
      index++;
      return null;
    }
    const node = { val: Number(tokens[index++]), left: null, right: null };
    node.left = dfs();
    node.right = dfs();
    return node;
  }

  return dfs();
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ for both serialization and deserialization.
- **Space Complexity:** $O(N)$ to store string tokens.`
  },
  {
    id: 45,
    title: "Implement Trie / Prefix Tree (LeetCode #208)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "Trie", "strings", "medium"],
    source: "https://leetcode.com/problems/implement-trie-prefix-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
A **Trie** (pronounced "try") or **prefix tree** is a tree data structure used to store and search strings efficiently, such as in auto-complete or spell checkers. Implement \`insert\`, \`search\`, and \`startsWith\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Each node is a dictionary with two fields: \`children: {}\` and \`isEnd: boolean\`."*

- \`insert(word)\`: Walk character by character. If character child doesn't exist, create it. At the last letter, set \`isEnd = true\`.
- \`search(word)\`: Walk characters. If child missing, return false. At end, return \`isEnd\`.
- \`startsWith(prefix)\`: Same as search, but return \`true\` if prefix path exists without needing \`isEnd\`!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
class TrieNode {
  constructor() {
    this.children = {};
    this.isEnd = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) {
        node.children[ch] = new TrieNode();
      }
      node = node.children[ch];
    }
    node.isEnd = true;
  }

  search(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return node.isEnd;
  }

  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      if (!node.children[ch]) return false;
      node = node.children[ch];
    }
    return true;
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(L)$ for all operations, where $L$ is word length.
- **Space Complexity:** $O(N \\cdot L)$ where $N$ is total inserted words.`
  },
  {
    id: 46,
    title: "Design Add and Search Words Data Structure (LeetCode #211)",
    pattern: "Trees & BST",
    difficulty: "medium",
    tags: ["Trees & BST", "Trie", "DFS", "medium"],
    source: "https://leetcode.com/problems/design-add-and-search-words-data-structure/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Design a data structure that supports adding new words and finding if a string matches any previously added string. The search string can contain \`'.'\` which can match **any letter**.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Standard Trie, but when encountering '.', try all children via recursive backtracking!"*

If char is regular \`'a'-'z'\`, step forward normally.
If char is \`'.'\`, branch out across all existing keys in \`node.children\`. If any branch returns true, the word matches!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
class WordDictionary {
  constructor() {
    this.root = {};
  }

  addWord(word) {
    let node = this.root;
    for (const ch of word) {
      if (!node[ch]) node[ch] = {};
      node = node[ch];
    }
    node.isEnd = true;
  }

  search(word) {
    function dfs(node, index) {
      if (index === word.length) return Boolean(node.isEnd);

      const ch = word[index];

      if (ch === '.') {
        for (const key in node) {
          if (key !== 'isEnd' && dfs(node[key], index + 1)) {
            return true;
          }
        }
        return false;
      }

      if (!node[ch]) return false;
      return dfs(node[ch], index + 1);
    }

    return dfs(this.root, 0);
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(L)$ for exact search; $O(26^L)$ worst-case for strings of all dots.
- **Space Complexity:** $O(N \\cdot L)$ storage.`
  },
  {
    id: 47,
    title: "Word Search II (LeetCode #212)",
    pattern: "Trees & BST",
    difficulty: "hard",
    tags: ["Trees & BST", "Trie", "DFS", "backtracking", "hard"],
    source: "https://leetcode.com/problems/word-search-ii/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an \`m x n\` board of characters and a list of strings \`words\`, return all words on the board. Each word must be constructed from letters of sequentially adjacent cells (horizontally or vertically).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Don't search the board for each word. Build a Trie of all words, and let the board search the Trie!"*

Doing DFS on the board for every single word repeats the same grid traversals $W$ times ($O(W \\cdot M \\cdot N \\cdot 4^L)$).
Instead:
1. Insert all words into a **Trie**. Store the complete word string at the leaf node (\`node.word = word\`).
2. Run DFS on every board cell. Walk the Trie simultaneously. If a letter isn't in the current Trie node, backtrack immediately (pruning the search tree)!
3. When \`node.word\` is reached, add to results and set \`node.word = null\` to prevent duplicate additions.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function findWords(board, words) {
  const root = {};
  for (const w of words) {
    let node = root;
    for (const c of w) {
      if (!node[c]) node[c] = {};
      node = node[c];
    }
    node.word = w; // Store full word at leaf
  }

  const result = [];
  const rows = board.length, cols = board[0].length;

  function dfs(r, c, node) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    const char = board[r][c];
    if (!node[char]) return; // Prune!

    const nextNode = node[char];
    if (nextNode.word) {
      result.push(nextNode.word);
      nextNode.word = null; // Prevent duplicates
    }

    board[r][c] = '#'; // Mark visited

    dfs(r + 1, c, nextNode);
    dfs(r - 1, c, nextNode);
    dfs(r, c + 1, nextNode);
    dfs(r, c - 1, nextNode);

    board[r][c] = char; // Unmark visited
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dfs(r, c, root);
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N \\cdot 4^L)$ where $L$ is max word length — pruned dramatically by the Trie.
- **Space Complexity:** $O(\\sum L)$ to store all words in the Trie.`
  }
];
