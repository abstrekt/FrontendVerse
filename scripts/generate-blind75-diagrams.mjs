import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIAGRAMS_SRC = join(ROOT, 'diagrams', 'blind75');
const DIAGRAMS_OUT = join(ROOT, 'public', 'diagrams', 'blind75');

const DIAGRAMS = {
  arrays_and_hashing: `
flowchart TD
  subgraph BruteForce["Brute Force: O(N²) Scan"]
    A1["Pick nums[i]"] --> B1["Scan j from i+1 to N-1"]
    B1 --> C1{"nums[i] + nums[j] == target?"}
    C1 -- No --> B1
    C1 -- Yes --> D1["Return [i, j]"]
  end

  subgraph HashMap["Hash Map Pattern: O(N) Single Pass"]
    A2["Read curr = nums[i]"] --> B2["Calculate need = target - curr"]
    B2 --> C2{"map.has(need)?"}
    C2 -- "Yes (Found!)" --> D2["Return [map.get(need), i]"]
    C2 -- "No" --> E2["map.set(curr, i)<br/>Remember for future elements"]
    E2 --> F2["Next i++"]
  end

  style BruteForce fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
  style HashMap fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#065f46
  style D2 fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#064e3b
`,

  two_pointers_sliding_window: `
flowchart TD
  subgraph TwoPointers["Pattern: Converging Two Pointers (Sorted Arrays)"]
    direction LR
    P_Start["left = 0<br/>right = N-1"] --> P_Check{"sum = arr[left] + arr[right]"}
    P_Check -- "sum == target" --> P_Match["Match Found!"]
    P_Check -- "sum < target" --> P_Grow["left++ (need larger)"]
    P_Check -- "sum > target" --> P_Shrink["right-- (need smaller)"]
    P_Grow --> P_Check
    P_Shrink --> P_Check
  end

  subgraph SlidingWindow["Pattern: Dynamic Sliding Window (Substrings/Subarrays)"]
    direction TB
    W_Init["left = 0, right = 0<br/>Initialize Window State (Map/Set)"] --> W_Expand["Expand: Add s[right] to Window"]
    W_Expand --> W_Valid{"Is Window Valid?"}
    W_Valid -- "No (Duplicate/Overflow)" --> W_Contract["Contract: Remove s[left]<br/>left++"]
    W_Contract --> W_Valid
    W_Valid -- "Yes" --> W_Record["Update Best Window Length<br/>(right - left + 1)"]
    W_Record --> W_Next["right++"]
    W_Next --> W_Expand
  end

  style TwoPointers fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af
  style SlidingWindow fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px,color:#5b21b6
`,

  linked_lists: `
flowchart TD
  subgraph InPlaceReversal["1. In-Place Reversal (3-Pointer State Machine)"]
    R1["State before flip:<br/>prev -> [Node 1] -> [Node 2: curr] -> [Node 3: next]"]
    R2["1. const next = curr.next (Save link)"]
    R3["2. curr.next = prev (Reverse pointer)"]
    R4["3. prev = curr, curr = next (Advance)"]
    R1 --> R2 --> R3 --> R4
  end

  subgraph FloydCycle["2. Floyd's Tortoise & Hare (Cycle Detection)"]
    F1["slow = head (1 step/turn)<br/>fast = head (2 steps/turn)"]
    F2{"fast == null or fast.next == null?"}
    F2 -- "Yes" --> F_NoCycle["No Cycle (Reached Tail)"]
    F2 -- "No" --> F3["slow = slow.next<br/>fast = fast.next.next"]
    F3 --> F4{"slow == fast?"}
    F4 -- "Yes" --> F_Cycle["Cycle Detected! (Fast lapped Slow)"]
    F4 -- "No" --> F2
  end

  style InPlaceReversal fill:#fdf4ff,stroke:#d946ef,stroke-width:2px,color:#86198f
  style FloydCycle fill:#fff7ed,stroke:#f97316,stroke-width:2px,color:#9a3412
`,

  trees_and_bst: `
flowchart TD
  subgraph TreeTraversals["Binary Tree Traversals"]
    direction TB
    RootNode["Root Node"] --> LeftSub["Left Subtree"]
    RootNode --> RightSub["Right Subtree"]

    DFS["DFS (Call Stack / Depth First):<br/>- Pre-order: Visit -> Left -> Right<br/>- In-order: Left -> Visit -> Right (Sorted on BST!)<br/>- Post-order: Left -> Right -> Visit (Bottom-up assembly)"]
    BFS["BFS (Queue / Level Order):<br/>- Snapshot levelSize = queue.length<br/>- Process level by level"]
  end

  subgraph BSTInvariant["BST Search Invariant"]
    BST_Check{"target vs curr.val"}
    BST_Check -- "target == curr.val" --> BST_Found["Target Found!"]
    BST_Check -- "target < curr.val" --> BST_Left["curr = curr.left (Eliminate right half)"]
    BST_Check -- "target > curr.val" --> BST_Right["curr = curr.right (Eliminate left half)"]
  end

  style TreeTraversals fill:#ecfeff,stroke:#06b6d4,stroke-width:2px,color:#155e75
  style BSTInvariant fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534
`,

  heap_priority_queue: `
flowchart TD
  subgraph TopK["Top-K Elements Pattern with Min-Heap"]
    H_Stream["Input Stream of N numbers"] --> H_Insert["Insert number into Min-Heap"]
    H_Insert --> H_Size{"heap.size > K?"}
    H_Size -- "Yes" --> H_Pop["heap.pop() (Evicts the smallest!)"]
    H_Size -- "No" --> H_Next["Next number"]
    H_Pop --> H_Next
    H_Next --> H_Final["Remaining K items in heap = K Largest Elements!"]
  end

  subgraph RunningMedian["Median Finder: Dual Heaps"]
    direction LR
    MaxH["Max-Heap (Smaller half of numbers)"] <--> MinH["Min-Heap (Larger half of numbers)"]
    Bal["Invariant: size difference <= 1<br/>Median = MaxH.top or Average(MaxH.top, MinH.top)"]
  end

  style TopK fill:#fefce8,stroke:#eab308,stroke-width:2px,color:#854d0e
  style RunningMedian fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#3730a3
`,

  dynamic_programming: `
flowchart TD
  subgraph DPArchitecture["Dynamic Programming: Overlapping Subproblems"]
    Rec["Recursion Tree without Cache<br/>O(2^N) Exponential Explosion"] --> Overlap["Discovers Redundant Subproblems<br/>fib(3) computed 5 times"]
    Overlap --> Sol1["Top-Down: Memoization<br/>Pass cache/memo map through calls"]
    Overlap --> Sol2["Bottom-Up: Tabulation<br/>Solve base cases dp[0], dp[1] -> iterate forward"]
  end

  subgraph DPSkeleton["Universal DP Thought Process"]
    S1["1. State Definition: What does dp[i] represent?"] --> S2["2. Recurrence Relation: How does dp[i] relate to dp[i-1], dp[i-2]?"]
    S2 --> S3["3. Base Cases: What are dp[0] and dp[1]?"]
    S3 --> S4["4. Space Optimization: Can we replace array with 2 variables?"]
  end

  style DPArchitecture fill:#fae8ff,stroke:#c026d3,stroke-width:2px,color:#701a75
  style DPSkeleton fill:#f1f5f9,stroke:#64748b,stroke-width:2px,color:#334155
`,

  intervals: `
flowchart TD
  subgraph IntervalLogic["Intervals: Timeline Sweep Pattern"]
    I_Sort["1. Sort intervals by start time: intervals.sort((a,b) => a[0] - b[0])"]
    I_Sort --> I_Init["Initialize result = [intervals[0]]"]
    I_Init --> I_Loop["Loop current interval [currStart, currEnd]"]
    I_Loop --> I_Cond{"currStart <= last.end?<br/>(Overlapping or Touching)"}
    I_Cond -- "Yes (Merge)" --> I_Merge["last.end = Math.max(last.end, currEnd)"]
    I_Cond -- "No (Disjoint)" --> I_Append["result.push([currStart, currEnd])"]
    I_Merge --> I_Loop
    I_Append --> I_Loop
  end

  style IntervalLogic fill:#fff1f2,stroke:#f43f5e,stroke-width:2px,color:#9f1239
`,

  graphs: `
flowchart TD
  subgraph GraphGrid["Graph & Grid Pattern"]
    direction TB
    G_Input["Grid / Adjacency List"] --> G_Choice{"Traversal Mode"}
    G_Choice -- "BFS (Queue)" --> G_BFS["Shortest path in unweighted graph<br/>Explore ring by ring"]
    G_Choice -- "DFS (Recursion/Stack)" --> G_DFS["Cycle detection, Connected components, Flood Fill"]

    G_DFS --> G_Flood["Grid Flood-Fill (Number of Islands):<br/>1. Loop every cell (r, c)<br/>2. If cell == '1', islands++ and trigger dfs(r, c)<br/>3. dfs marks visited cells as '0' to avoid re-visiting"]
    G_Choice -- "Topological Sort" --> G_Topo["Course Schedule / DAG Dependency<br/>Kahn's algorithm with in-degree array"]
  end

  style GraphGrid fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#075985
`,

  matrix: `
flowchart TD
  subgraph MatrixPattern["2D Matrix / Grid Manipulations"]
    M_Coord["Coordinates: row r from 0 to R-1, col c from 0 to C-1"]
    M_Vectors["4-Direction Vector: const DIRS = [[0,1], [1,0], [0,-1], [-1,0]]"]
    M_Spiral["Spiral Matrix: 4 Bounds (top, bottom, left, right)<br/>Walk right -> top++<br/>Walk down -> right--<br/>Walk left -> bottom--<br/>Walk up -> left++"]
    M_Rotate["Rotate Image 90° Clockwise:<br/>Step 1: Transpose (swap matrix[r][c] with matrix[c][r])<br/>Step 2: Reverse each row"]
    M_Coord --> M_Vectors --> M_Spiral --> M_Rotate
  end

  style MatrixPattern fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e
`,

  bit_manipulation: `
flowchart TD
  subgraph BitTricks["Bit Manipulation: Hardware-Speed Tricks"]
    B_XOR["1. XOR Cancellation (Single Number):<br/>x ^ x = 0  and  x ^ 0 = x<br/>XOR-ing an entire array cancels all pairs, leaving the unique element!"]
    B_Drop["2. Drop Lowest Set Bit (Brian Kernighan):<br/>n = n & (n - 1)<br/>Clears the rightmost 1 bit in O(1). Counting bits in O(set bits)!"]
    B_Mask["3. Check if Kth bit is set:<br/>(n & (1 << k)) !== 0"]
    B_Even["4. Check Even / Odd:<br/>(n & 1) === 0 (Even)"]
    B_XOR --> B_Drop --> B_Mask --> B_Even
  end

  style BitTricks fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#5b21b6
`
};

console.log('Generating 10 Draw.io diagrams...');
for (const [name, mermaidContent] of Object.entries(DIAGRAMS)) {
  const mmdPath = join(DIAGRAMS_SRC, `${name}.mmd`);
  const drawioPath = join(DIAGRAMS_SRC, `${name}.drawio`);
  const svgPath = join(DIAGRAMS_OUT, `${name}.svg`);

  writeFileSync(mmdPath, mermaidContent.trim());
  try {
    execSync(`/Users/samiran/.local/bin/drawio -x -f xml -o "${drawioPath}" "${mmdPath}"`, { stdio: 'pipe' });
    execSync(`/Users/samiran/.local/bin/drawio -x -f svg -o "${svgPath}" "${drawioPath}"`, { stdio: 'pipe' });
    unlinkSync(mmdPath);
    console.log(`✓ ${name}.drawio and ${name}.svg generated.`);
  } catch (err) {
    console.error(`✗ Error generating ${name}:`, err.message);
  }
}
console.log('All diagrams generated successfully!');
