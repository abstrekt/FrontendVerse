export const pattern8 = [
  {
    id: 8,
    title: "[Pattern 8/9] Graphs & Matrix Blueprint",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "Matrix", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Think of a **Graph** as a **Subway System**:
- Stations are **Nodes / Vertices**.
- Train tracks connecting stations are **Edges**.
- A 2D Grid / Matrix (like a chess board or island map) is just an implicit graph where every cell \`(r, c)\` connects to its 4 cardinal neighbors \`(r+1, c), (r-1, c), (r, c+1), (r, c-1)\`.

---

## 📊 Visual Architecture: Graphs & Matrix Navigation

![Graphs Pattern](/diagrams/blind75/graphs.svg)
![Matrix Pattern](/diagrams/blind75/matrix.svg)

---

## 🧠 The 3 Core Graph Archetypes

### 1. Grid Flood-Fill (Connected Components)
To count distinct islands or regions:
- Loop through every cell \`(r, c)\`.
- When you find unvisited land \`'1'\`, increment your island counter!
- Launch a recursive \`dfs(r, c)\` that sinks or marks all connected land as \`'0'\` so you never count it again.

### 2. Topological Sort (Dependency Resolution)
Used for course prerequisites (Course Schedule) or compilation orders:
- Count how many incoming dependencies (in-degrees) each node has.
- Start with nodes that have **0 dependencies**. Add them to a queue.
- As you process a node, decrement the in-degree of its neighbors. If a neighbor hits 0, add it to the queue!
- If you process all nodes, there are no cycles!

### 3. Matrix Transformations (Spiral & In-Place Rotation)
- **4 Directions Vector:** \`const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];\`
- **Spiral Bounds:** Squeeze 4 boundary walls: \`top++, bottom--, left++, right--\`.
- **Rotate Matrix 90°:** 
  1. Transpose (swap \`matrix[r][c]\` with \`matrix[c][r]\`).
  2. Reverse each row.

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// 1. Grid DFS Flood-Fill Template
function floodFill(grid) {
  const rows = grid.length, cols = grid[0].length;
  let components = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }
    grid[r][c] = '0'; // Mark visited in-place

    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        components++;
        dfs(r, c);
      }
    }
  }

  return components;
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Number of Islands](/blind75/68)
- [Clone Graph](/blind75/69)
- [Pacific Atlantic Water Flow](/blind75/70)
- [Course Schedule](/blind75/71)
- [Graph Valid Tree](/blind75/72)
- [Number of Connected Components](/blind75/73)
- [Alien Dictionary](/blind75/74)
- [Set Matrix Zeroes](/blind75/75)
- [Spiral Matrix](/blind75/76)
- [Rotate Image](/blind75/77)
- [Word Search](/blind75/78)
- [Longest Palindromic Substring](/blind75/79)`
  },
  {
    id: 68,
    title: "Number of Islands (LeetCode #200)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "DFS", "BFS", "matrix", "medium"],
    source: "https://leetcode.com/problems/number-of-islands/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an \`m x n\` 2D binary grid which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Sink the island! When you discover land '1', increment island count and trigger DFS to sink all connected land to '0'."*

By mutating visited land to \`'0'\` in-place, you don't even need a visited Set ($O(1)$ extra space)!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    // Boundary and water checks
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] === '0') {
      return;
    }

    // Sink land to '0'
    grid[r][c] = '0';

    dfs(r + 1, c); // Down
    dfs(r - 1, c); // Up
    dfs(r, c + 1); // Right
    dfs(r, c - 1); // Left
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c); // Sink entire island
      }
    }
  }

  return count;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$ — Every cell is visited at most twice.
- **Space Complexity:** $O(M \\cdot N)$ — Worst-case recursion stack (grid filled with land).`
  },
  {
    id: 69,
    title: "Clone Graph (LeetCode #133)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "hash map", "DFS", "medium"],
    source: "https://leetcode.com/problems/clone-graph/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a reference of a node in a connected undirected graph, return a **deep copy** (clone) of the graph. Each node contains a value and a list of its neighbors.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Clone Map: Map originalNode -> cloneNode. If a node is already in the map, return its clone to prevent infinite loops from cycles!"*

Graph nodes can have circular references ($A \\to B \\to A$).
Pass a \`Map\` of \`original -> clone\`. Before recursing on neighbors, register the new clone node in the map.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function cloneGraph(node) {
  if (!node) return null;

  const clones = new Map(); // originalNode -> cloneNode

  function dfs(curr) {
    if (clones.has(curr)) {
      return clones.get(curr);
    }

    // Create shallow clone shell and register immediately
    const copy = { val: curr.val, neighbors: [] };
    clones.set(curr, copy);

    // Recursively clone all neighbors
    for (const neighbor of curr.neighbors) {
      copy.neighbors.push(dfs(neighbor));
    }

    return copy;
  }

  return dfs(node);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(V + E)$ where $V$ is vertices and $E$ is edges.
- **Space Complexity:** $O(V)$ for clone map and call stack.`
  },
  {
    id: 70,
    title: "Pacific Atlantic Water Flow (LeetCode #417)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "DFS", "BFS", "matrix", "medium"],
    source: "https://leetcode.com/problems/pacific-atlantic-water-flow/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You have an \`m x n\` grid representing heights of land. Rain water can flow to adjacent cells with equal or lower height. Pacific ocean touches top and left; Atlantic touches bottom and right. Return all coordinates where water can reach **both oceans**.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Reverse the flow! Instead of simulating water flowing downhill to the ocean, simulate ocean water climbing uphill!"*

1. Start DFS from all Pacific border cells into \`pacificReachable\` set (flowing uphill: \`nextHeight >= currHeight\`).
2. Start DFS from all Atlantic border cells into \`atlanticReachable\` set.
3. The cells in both sets are the answer!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function pacificAtlantic(heights) {
  const rows = heights.length, cols = heights[0].length;
  const pac = new Set();
  const atl = new Set();

  function dfs(r, c, visited) {
    const key = \`\${r},\${c}\`;
    visited.add(key);

    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      const nextKey = \`\${nr},\${nc}\`;
      // Water flows uphill to next cell
      if (
        nr >= 0 && nr < rows &&
        nc >= 0 && nc < cols &&
        !visited.has(nextKey) &&
        heights[nr][nc] >= heights[r][c]
      ) {
        dfs(nr, nc, visited);
      }
    }
  }

  // Pacific: top row & left col
  for (let c = 0; c < cols; c++) dfs(0, c, pac);
  for (let r = 0; r < rows; r++) dfs(r, 0, pac);

  // Atlantic: bottom row & right col
  for (let c = 0; c < cols; c++) dfs(rows - 1, c, atl);
  for (let r = 0; r < rows; r++) dfs(r, cols - 1, atl);

  const result = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = \`\${r},\${c}\`;
      if (pac.has(key) && atl.has(key)) {
        result.push([r, c]);
      }
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$.
- **Space Complexity:** $O(M \\cdot N)$ for reachable sets.`
  },
  {
    id: 71,
    title: "Course Schedule (LeetCode #207)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "topological sort", "BFS", "medium"],
    source: "https://leetcode.com/problems/course-schedule/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
There are a total of \`numCourses\` courses you have to take, labeled from 0 to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [a, b]\` indicates that you must take course \`b\` first if you want to take course \`a\`.
Return \`true\` if you can finish all courses, or \`false\` if there is a circular dependency (deadlock cycle).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Topological Sort (Kahn's Algorithm): Count in-degrees (prerequisites). Start with courses that have 0 prerequisites. Every time you take a course, decrement in-degree of dependent courses!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function canFinish(numCourses, prerequisites) {
  const inDegree = new Array(numCourses).fill(0);
  const adj = Array.from({ length: numCourses }, () => []);

  // Build adjacency list & count in-degrees
  for (const [course, pre] of prerequisites) {
    adj[pre].push(course);
    inDegree[course]++;
  }

  // Queue all courses with 0 prerequisites
  const queue = [];
  for (let i = 0; i < numCourses; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  let finishedCount = 0;
  while (queue.length) {
    const curr = queue.shift();
    finishedCount++;

    for (const neighbor of adj[curr]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  return finishedCount === numCourses;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(V + E)$ where $V = \\text{numCourses}, E = \\text{prerequisites.length}$.
- **Space Complexity:** $O(V + E)$ for adjacency list.`
  },
  {
    id: 72,
    title: "Graph Valid Tree (LeetCode #261)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "union find", "DFS", "medium"],
    source: "https://leetcode.com/problems/graph-valid-tree/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given $n$ nodes labeled from 0 to $n - 1$ and a list of undirected edges, write a function to check whether these edges make up a valid tree.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"A graph is a valid tree if and only if: 1. Exactly (n - 1) edges. 2. Fully connected (no isolated components / no cycles)!"*

1. Quick check: If \`edges.length !== n - 1\`, it cannot be a tree (either has a cycle or is disconnected)!
2. Run DFS from node 0. If visited set size equals $n$, it's a valid tree!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function validTree(n, edges) {
  if (edges.length !== n - 1) return false;

  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const visited = new Set();
  function dfs(node) {
    visited.add(node);
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  dfs(0);
  return visited.size === n;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(V + E)$.
- **Space Complexity:** $O(V + E)$.`
  },
  {
    id: 73,
    title: "Number of Connected Components in an Undirected Graph (LeetCode #323)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Graphs", "DFS", "union find", "medium"],
    source: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You have a graph of $n$ nodes. You are given an integer $n$ and an array \`edges\`. Return the number of connected components in the graph.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Island count on a graph: Loop 0 to n-1. If a node hasn't been visited, component++ and DFS its entire neighborhood."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function countComponents(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }

  const visited = new Set();
  let count = 0;

  function dfs(node) {
    visited.add(node);
    for (const neighbor of adj[node]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (!visited.has(i)) {
      count++;
      dfs(i);
    }
  }

  return count;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(V + E)$.
- **Space Complexity:** $O(V + E)$.`
  },
  {
    id: 74,
    title: "Alien Dictionary (LeetCode #269)",
    pattern: "Graphs & Matrix",
    difficulty: "hard",
    tags: ["Graphs", "topological sort", "hard"],
    source: "https://leetcode.com/problems/alien-dictionary/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given a list of strings \`words\` sorted lexicographically by the rules of a new alien language. Derive the order of letters in this language. If the order is invalid, return \`""\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Compare adjacent words to find letter ordering edges (word1[k] -> word2[k]), then Topological Sort the DAG!"*

1. For each pair of adjacent words, find the first differing letter: that gives directed edge \`char1 -> char2\`.
2. Invalid prefix trap: If \`word1\` starts with \`word2\` but is longer (e.g. \`"apple"\` before \`"app"\`), return \`""\`.
3. Run Topological Sort (Kahn's algorithm). If output length matches unique letters, return string; else cycle detected!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function alienOrder(words) {
  const adj = new Map();
  const inDegree = new Map();

  // Initialize unique characters
  for (const w of words) {
    for (const ch of w) {
      if (!adj.has(ch)) adj.set(ch, new Set());
      if (!inDegree.has(ch)) inDegree.set(ch, 0);
    }
  }

  // Build edges by comparing adjacent words
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i], w2 = words[i + 1];
    const minLen = Math.min(w1.length, w2.length);

    // Prefix trap
    if (w1.length > w2.length && w1.startsWith(w2)) return "";

    for (let j = 0; j < minLen; j++) {
      if (w1[j] !== w2[j]) {
        if (!adj.get(w1[j]).has(w2[j])) {
          adj.get(w1[j]).add(w2[j]);
          inDegree.set(w2[j], inDegree.get(w2[j]) + 1);
        }
        break;
      }
    }
  }

  // Kahn's BFS
  const queue = [];
  for (const [ch, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(ch);
  }

  let result = "";
  while (queue.length) {
    const curr = queue.shift();
    result += curr;

    for (const neighbor of adj.get(curr)) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result.length === inDegree.size ? result : "";
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(C)$ where $C$ is total length of all words.
- **Space Complexity:** $O(V + E)$ where $V \\le 26$.`
  },
  {
    id: 75,
    title: "Set Matrix Zeroes (LeetCode #73)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Matrix", "medium"],
    source: "https://leetcode.com/problems/set-matrix-zeroes/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an \`m x n\` integer matrix \`matrix\`, if an element is 0, set its entire row and column to 0's.
**Rule:** You must do it **in place** in $O(1)$ extra space!

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Use the 0th row and 0th column of the matrix itself as your marker arrays!"*

If \`matrix[r][c] === 0\`, set \`matrix[r][0] = 0\` and \`matrix[0][c] = 0\`.
Use a separate boolean \`firstColHasZero\` for the top-left corner overlap.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function setZeroes(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  let firstColZero = false;

  for (let r = 0; r < rows; r++) {
    if (matrix[r][0] === 0) firstColZero = true;
    for (let c = 1; c < cols; c++) {
      if (matrix[r][c] === 0) {
        matrix[r][0] = 0;
        matrix[0][c] = 0;
      }
    }
  }

  // Fill inner matrix based on markers
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      if (matrix[r][0] === 0 || matrix[0][c] === 0) {
        matrix[r][c] = 0;
      }
    }
  }

  // Handle first row
  if (matrix[0][0] === 0) {
    for (let c = 0; c < cols; c++) matrix[0][c] = 0;
  }

  // Handle first column
  if (firstColZero) {
    for (let r = 0; r < rows; r++) matrix[r][0] = 0;
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$.
- **Space Complexity:** $O(1)$ in-place.`
  },
  {
    id: 76,
    title: "Spiral Matrix (LeetCode #54)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Matrix", "simulation", "medium"],
    source: "https://leetcode.com/problems/spiral-matrix/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an \`m x n\` matrix, return all elements of the matrix in spiral order (clockwise starting from top-left).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"4 Boundary Walls: top, bottom, left, right. Walk right -> top++, Walk down -> right--, Walk left -> bottom--, Walk up -> left++."*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function spiralOrder(matrix) {
  const result = [];
  let top = 0, bottom = matrix.length - 1;
  let left = 0, right = matrix[0].length - 1;

  while (top <= bottom && left <= right) {
    // Traverse Right
    for (let c = left; c <= right; c++) result.push(matrix[top][c]);
    top++;

    // Traverse Down
    for (let r = top; r <= bottom; r++) result.push(matrix[r][right]);
    right--;

    // Traverse Left (if rows remain)
    if (top <= bottom) {
      for (let c = right; c >= left; c--) result.push(matrix[bottom][c]);
      bottom--;
    }

    // Traverse Up (if cols remain)
    if (left <= right) {
      for (let r = bottom; r >= top; r--) result.push(matrix[r][left]);
      left++;
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N)$.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 77,
    title: "Rotate Image (LeetCode #48)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Matrix", "math", "medium"],
    source: "https://leetcode.com/problems/rotate-image/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an \`n x n\` 2D matrix representing an image, rotate the image by 90 degrees clockwise **in place**.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Rotate 90° Clockwise = Transpose + Reverse each row!"*

1. **Transpose:** Swap \`matrix[i][j]\` with \`matrix[j][i]\` along the main diagonal.
2. **Reverse each row:** Flip the row horizontally!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function rotate(matrix) {
  const n = matrix.length;

  // Step 1: Transpose matrix
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    }
  }

  // Step 2: Reverse each row
  for (let i = 0; i < n; i++) {
    matrix[i].reverse();
  }
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N^2)$.
- **Space Complexity:** $O(1)$ in-place.`
  },
  {
    id: 78,
    title: "Word Search (LeetCode #79)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Matrix", "backtracking", "DFS", "medium"],
    source: "https://leetcode.com/problems/word-search/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` if \`word\` exists in the grid. Adjacent cells are connected horizontally or vertically, and the same letter cell cannot be used more than once.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Backtracking DFS: Temporarily mark board[r][c] = '#' to avoid self-crossing, and restore the letter upon returning!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function exist(board, word) {
  const rows = board.length, cols = board[0].length;

  function dfs(r, c, index) {
    if (index === word.length) return true;
    if (
      r < 0 || r >= rows ||
      c < 0 || c >= cols ||
      board[r][c] !== word[index]
    ) {
      return false;
    }

    const temp = board[r][c];
    board[r][c] = '#'; // Mark visited

    const found =
      dfs(r + 1, c, index + 1) ||
      dfs(r - 1, c, index + 1) ||
      dfs(r, c + 1, index + 1) ||
      dfs(r, c - 1, index + 1);

    board[r][c] = temp; // Backtrack restore
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }

  return false;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(M \\cdot N \\cdot 4^L)$ where $L$ is length of word.
- **Space Complexity:** $O(L)$ recursion call stack.`
  },
  {
    id: 79,
    title: "Longest Palindromic Substring (LeetCode #5)",
    pattern: "Graphs & Matrix",
    difficulty: "medium",
    tags: ["Two Pointers", "strings", "medium"],
    source: "https://leetcode.com/problems/longest-palindromic-substring/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given a string \`s\`, return the longest palindromic substring in \`s\`.

Example: \`s = "babad"\` -> \`"bab"\` (or \`"aba"\`).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Expand around centers: Every palindrome expands outward from index i (odd) or indices i, i+1 (even). Keep the widest boundaries!"*

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function longestPalindrome(s) {
  if (!s || s.length <= 1) return s;

  let start = 0, maxLen = 0;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      const currentLen = right - left + 1;
      if (currentLen > maxLen) {
        start = left;
        maxLen = currentLen;
      }
      left--;
      right++;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // Odd-length
    expand(i, i + 1); // Even-length
  }

  return s.substring(start, start + maxLen);
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N^2)$.
- **Space Complexity:** $O(1)$ extra space.`
  }
];
