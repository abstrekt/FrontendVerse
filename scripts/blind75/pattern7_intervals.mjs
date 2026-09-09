export const pattern7 = [
  {
    id: 7,
    title: "[Pattern 7/9] Intervals Blueprint",
    pattern: "Intervals",
    difficulty: "medium",
    tags: ["Intervals", "Blueprint", "foundation"],
    source: "https://www.youtube.com/watch?v=YPmNtpxj4Wg&list=PLB53ggSrd6qnIQVx7itPCTJG9U-0iWLKE",
    answer: `## 💡 The Big Picture (Plain English Analogy)

Think of the **Intervals Pattern** as **scheduling conference rooms in an office building**:
- Meetings arrive with a start time and an end time: \`[start, end]\`.
- If the calendar is totally unsorted, checking whether a new meeting clashes requires checking every other meeting in the database: $O(N^2)$ chaos.
- **The Secret Weapon:** **Sort by start time!** Once meetings are ordered by start time, an event can **only ever clash with the meeting immediately before it!** The problem collapses into a simple 1-pass timeline sweep.

---

## 📊 Visual Architecture: Timeline Sweep & Overlap Condition

![Intervals Pattern](/diagrams/blind75/intervals.svg)

---

## 🧠 The 3 Universal Interval Scenarios

When comparing two intervals \`A = [startA, endA]\` and \`B = [startB, endB]\` (where \`startA <= startB\` because of sorting):

\`\`\`
1. Disjoint (No Overlap):
   A: [------]
   B:          [------]
   Condition: startB > endA -> Keep A, advance to B.

2. Overlapping:
   A: [----------]
   B:      [----------]
   Condition: startB <= endA -> Merge: [startA, Math.max(endA, endB)]

3. Contained:
   A: [------------------]
   B:      [------]
   Condition: startB <= endA && endB <= endA -> Swallowed: keep [startA, endA]!
\`\`\`

---

## 💻 Canonical JavaScript Blueprints

\`\`\`javascript
// Blueprint: Merge Overlapping Intervals
function mergeIntervals(intervals) {
  if (intervals.length <= 1) return intervals;

  // 1. Always sort by start time (copy array to keep pure)
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const result = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const [currStart, currEnd] = sorted[i];
    const last = result[result.length - 1];

    if (currStart <= last[1]) {
      // Overlaps: expand boundary
      last[1] = Math.max(last[1], currEnd);
    } else {
      // Disjoint: start a new interval
      result.push([currStart, currEnd]);
    }
  }

  return result;
}
\`\`\`

---

## 🎯 Blind 75 Problems in this Pattern
- [Insert Interval](/blind75/63)
- [Merge Intervals](/blind75/64)
- [Non-overlapping Intervals](/blind75/65)
- [Meeting Rooms](/blind75/66)
- [Meeting Rooms II](/blind75/67)`
  },
  {
    id: 63,
    title: "Insert Interval (LeetCode #57)",
    pattern: "Intervals",
    difficulty: "medium",
    tags: ["Intervals", "medium"],
    source: "https://leetcode.com/problems/insert-interval/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
You are given an array of non-overlapping intervals sorted by start time, and a \`newInterval\`. Insert \`newInterval\` into the list so that the intervals remain sorted and non-overlapping (merging if necessary).

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"3 Phases: 1. Add all intervals ending before newInterval starts. 2. Merge all overlapping intervals into newInterval. 3. Add all remaining intervals!"*

No sorting required! Because the input is already sorted:
1. Push all intervals where \`interval[1] < newInterval[0]\`.
2. While intervals overlap (\`interval[0] <= newInterval[1]\`):
   \`newInterval[0] = Math.min(newInterval[0], interval[0])\`
   \`newInterval[1] = Math.max(newInterval[1], interval[1])\`
3. Push merged \`newInterval\`.
4. Push all remaining intervals.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function insert(intervals, newInterval) {
  const result = [];
  let i = 0;
  const n = intervals.length;

  // 1. Add all intervals ending before newInterval starts
  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i]);
    i++;
  }

  // 2. Merge all overlapping intervals with newInterval
  while (i < n && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);

  // 3. Add all remaining intervals
  while (i < n) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N)$ — Single pass through intervals.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 64,
    title: "Merge Intervals (LeetCode #56)",
    pattern: "Intervals",
    difficulty: "medium",
    tags: ["Intervals", "sorting", "medium"],
    source: "https://leetcode.com/problems/merge-intervals/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of \`intervals\` where \`intervals[i] = [start, end]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.

Example: \`[[1,3],[2,6],[8,10],[15,18]]\` -> \`[[1,6],[8,10],[15,18]]\`.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Sort by start time first! Then compare current start against previous end. If \`curr.start <= prev.end\`, merge using \`Math.max\`."*

Don't forget \`Math.max\`! For \`[[1, 4], [2, 3]]\`, if you don't use \`Math.max\`, you might mistakenly shrink the end!

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function merge(intervals) {
  if (intervals.length <= 1) return intervals;

  // Always copy and sort numerically by start time
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const result = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const [currStart, currEnd] = sorted[i];
    const last = result[result.length - 1];

    if (currStart <= last[1]) {
      // Overlapping: extend the end boundary
      last[1] = Math.max(last[1], currEnd);
    } else {
      result.push([currStart, currEnd]);
    }
  }

  return result;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log N)$ dominated by sorting.
- **Space Complexity:** $O(N)$ for output array.
- **In-App Practice:** [/coding/47](/coding/47)`
  },
  {
    id: 65,
    title: "Non-overlapping Intervals (LeetCode #435)",
    pattern: "Intervals",
    difficulty: "medium",
    tags: ["Intervals", "greedy", "medium"],
    source: "https://leetcode.com/problems/non-overlapping-intervals/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of intervals, return the minimum number of intervals you need to remove to make the rest of the intervals non-overlapping.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Greedy Choice: Sort by END time! Keep the interval that finishes earliest to leave maximum room for future intervals."*

When two intervals overlap, which one should you delete?
Always delete the one that stretches farther into the future (the one with the larger end time)! Keeping the interval with the smaller end time leaves the calendar open for subsequent meetings.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function eraseOverlapIntervals(intervals) {
  if (intervals.length <= 1) return 0;

  // Sort by END time
  intervals.sort((a, b) => a[1] - b[1]);

  let removals = 0;
  let prevEnd = intervals[0][1];

  for (let i = 1; i < intervals.length; i++) {
    const [start, end] = intervals[i];
    if (start < prevEnd) {
      // Overlap detected! Remove current interval
      removals++;
    } else {
      // No overlap: keep and update prevEnd
      prevEnd = end;
    }
  }

  return removals;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log N)$ — Sorting by end time.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 66,
    title: "Meeting Rooms (LeetCode #252)",
    pattern: "Intervals",
    difficulty: "easy",
    tags: ["Intervals", "sorting", "easy"],
    source: "https://leetcode.com/problems/meeting-rooms/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of meeting time intervals consisting of start and end times \`[[s1,e1],[s2,e2],...]\`, determine if a single person could attend all meetings without overlap.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Sort by start time. Check if any meeting starts before the previous one finishes!"*

If \`intervals[i][0] < intervals[i - 1][1]\`, return \`false\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function canAttendMeetings(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);

  for (let i = 1; i < intervals.length; i++) {
    if (intervals[i][0] < intervals[i - 1][1]) {
      return false; // Time conflict!
    }
  }

  return true;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log N)$ for sorting.
- **Space Complexity:** $O(1)$ extra space.`
  },
  {
    id: 67,
    title: "Meeting Rooms II (LeetCode #253)",
    pattern: "Intervals",
    difficulty: "medium",
    tags: ["Intervals", "two pointers", "heap", "medium"],
    source: "https://leetcode.com/problems/meeting-rooms-ii/",
    answer: `## 💡 Easy Explainer (The Problem in Plain Words)
Given an array of meeting time intervals \`intervals\`, return the minimum number of conference rooms required so that all meetings can take place without conflict.

---

## 🧠 The Trick & "What to Remember"
> **The Mental Hook:** *"Separate starts and ends! Two sorted arrays: When a meeting starts before a room frees up, allocate a new room. When a meeting ends, free a room."*

1. Put all start times in a sorted array \`starts\`.
2. Put all end times in a sorted array \`ends\`.
3. Walk two pointers: if \`starts[startPtr] < ends[endPtr]\`, a meeting starts while another is in progress -> \`roomsNeeded++\`. Else, a meeting ended -> \`endPtr++\`.

---

## 💻 Full JavaScript Solution

\`\`\`javascript
function minMeetingRooms(intervals) {
  const starts = intervals.map(i => i[0]).sort((a, b) => a - b);
  const ends = intervals.map(i => i[1]).sort((a, b) => a - b);

  let rooms = 0;
  let endPtr = 0;

  for (let startPtr = 0; startPtr < starts.length; startPtr++) {
    if (starts[startPtr] < ends[endPtr]) {
      // Room occupied, must add a new room
      rooms++;
    } else {
      // Meeting ended, reuse that room!
      endPtr++;
    }
  }

  return rooms;
}
\`\`\`

---

## ⏱️ Complexity Analysis
- **Time Complexity:** $O(N \\log N)$ to sort starts and ends.
- **Space Complexity:** $O(N)$ to store start and end times.`
  }
];
