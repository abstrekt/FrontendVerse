import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import FilterPanel from './components/FilterPanel';
import LearningsView from './components/LearningsView';
import Skeleton from './components/Skeleton';
import LearningsPanel from './components/LearningsPanel';
import CodingPanel from './components/CodingPanel';
import PanelList from './components/PanelList';
import QuizQuestion from './components/QuizQuestion';
import QuestionListView from './components/QuestionListView';
import Results from './components/Results';
import MobileProgressBar from './components/MobileProgressBar';
import OutputQuizQuestion from './components/OutputQuizQuestion';
import OutputResults from './components/OutputResults';
import CodingChallenge from './components/CodingChallenge';
import CodingResults from './components/CodingResults';
import ArchivedView from './components/ArchivedView';
import CommandPalette from './components/CommandPalette';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import ShortcutsDialog from './components/ShortcutsDialog';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLatestRef } from './hooks/useLatestRef';
import { useAppRoute } from './hooks/useAppRoute';
import { parseRoute } from './utils/routes';
import {
  EMPTY_PROGRESS,
  filterQuestions,
  recordAnswer,
  recordSession,
  getWeakTopics,
  getMissedQuestionIds,
  getQuestionsForWeakTopics,
  getQuestionsForReview,
  getBestPct,
  getLifetimeAccuracy,
  smartShuffle,
} from './utils/progress';
import {
  EMPTY_OUTPUT_PROGRESS,
  buildOutputQueue,
  recordOutputAnswer,
  recordOutputSession,
  getOutputBestPct,
  getOutputLifetimeAccuracy,
  getOutputMissedCount,
} from './utils/outputProgress';
import {
  EMPTY_PRACTICE_QUEUE,
  createPracticeQueue,
  restorePracticeQueue,
  restrictQueueToPool,
  recordAnswerInQueue,
  markAnswerCorrectInQueue,
  isRestorablePracticeQueue,
  advancePass,
  archiveFromQueue,
  getPracticeQueueQuestionIds,
  getSkippedPracticeQueueIds,
  mergePracticeQueueSkippedIds,
  normalizePracticeQueue,
  openQuestionInQueue,
  appendToQueueTail,
  loadPracticeQueueFromStorage,
  filterPoolByCompleted,
  sanitizePracticeQueue,
  skipQuestionInQueue,
} from './utils/practiceQueue';
import questionsData from '../questions.json';
import outputQuestionsData from '../data/output-questions.json';
import scopeOutputQuestionsData from '../data/scope-output-questions.json';
import codingQuestionsData from '../data/coding-questions.json';
import {
  loadCodingProgress,
  saveCodingProgress,
  recordCodingAnswer,
  recordCodingSession,
  getCodingStats,
  buildCodingQueue,
} from './utils/codingProgress';
import {
  EMPTY_ARCHIVED,
  filterActive,
  archiveId,
  unarchiveId,
  getArchivedSet,
  getArchivedCount,
} from './utils/archive';
import {
  EMPTY_STARRED,
  EMPTY_STARRED_FILTER,
  filterStarred,
  isStarred,
  toggleStarId,
  getStarredCount,
} from './utils/starred';
import {
  EMPTY_COMPLETED,
  isCompleted,
  markCompletedId,
  toggleCompletedId,
  getActiveCompletedCount,
  sortCompletedToEnd,
  syncCompletedFromProgress,
  syncOutputCompletedFromProgress,
} from './utils/completed';
import { buildSearchIndex } from './utils/searchIndex';
import { loadLearningSection, LEARNING_LOADERS } from './data/datasets';
import datasetCounts from '../data/counts.json';
import { getPassScopeQuestions } from './utils/questionState';
import {
  hasRunMigration,
  markMigrationRun,
  relocateStoreIds,
  pruneStoreIds,
} from './utils/migrations';
import { useAnnounce } from './hooks/useAnnouncer';
import { sectionLabel, SECTIONS } from './sections/registry';
import { combinedStreak } from './utils/streak';
import { outputQuestionLabel } from './utils/outputLabel';

const COMPLETED_BACKFILL_MIGRATION = 'completed-backfill-v1';
const LEARNINGS_SPLIT_MIGRATION = 'learnings-split-v1';

/* Where each entry that left the JS learnings section went. The browser
   topics kept their ids; the three strays landed in sections with their own
   id spaces and were renumbered. See `src/data/curriculum.js`. */
const LEARNINGS_SPLIT_MOVES = [
  ...[95, 146, 28, 147, 97, 98, 152, 154, 155, 122, 159, 157, 156, 132, 133, 158].map((id) => ({
    from: 'learnings',
    to: 'browser',
    id,
  })),
  { from: 'learnings', to: 'css', id: 27, newId: 6 },
  { from: 'learnings', to: 'algorithm', id: 24, newId: 11 },
  { from: 'learnings', to: 'react-learnings', id: 160, newId: 28 },
];

const HLD_RENAME_MIGRATION = 'hld-to-system-design-v1';

/* The `hld` section was renamed `system-design` when it grew from two Tekion
   write-ups into the full curriculum. Ids were not touched, so this is a pure
   section move — but starred/mastered/archived are keyed by section, so
   without it a reader's marks on the two original entries would be stranded
   under a slug nothing reads any more. */
const HLD_RENAME_MOVES = [1, 2].map((id) => ({ from: 'hld', to: 'system-design', id }));

// Keeps the browser chrome in step with an explicit theme choice. The static
// tags in index.html only respond to the OS setting, so without this the
// address bar stays light while the app is dark.
function syncThemeColorMeta(theme) {
  // Mirrors --surface-app. Kept in step by hand because the meta tag is read
  // by the browser chrome before any stylesheet is applied.
  const color = theme === 'dark' ? '#0a0a0b' : '#f7f7f8';
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((tag) => tag.setAttribute('content', color));
}

function makeLearningToggleCompleted(section, orderedList, setId, completed, setCompleted) {
  return (id) => {
    const wasCompleted = isCompleted(id, section, completed);
    if (!wasCompleted) {
      const idx = orderedList.findIndex((item) => item.id === id);
      const next = orderedList[idx + 1];
      setCompleted((prev) => markCompletedId(prev, section, id));
      if (next && !isCompleted(next.id, section, completed)) {
        setId(next.id);
      }
      return;
    }
    setCompleted((prev) => toggleCompletedId(prev, section, id));
  };
}

function usePracticeQueueStorage(key, legacyKey) {
  const [value, setValue] = useState(
    () => loadPracticeQueueFromStorage(key, legacyKey) ?? EMPTY_PRACTICE_QUEUE
  );

  useEffect(() => {
    try {
      if (value !== null) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue];
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  // Temporary — see ACCELDATA-PREP-REMOVAL.md
  const [acceldataPrep, setAcceldataPrep] = useState([]);
  const [learnings, setLearnings] = useState([]);
  const [reactLearnings, setReactLearnings] = useState([]);
  const [reactGuide, setReactGuide] = useState([]);
  const [interviewPrep, setInterviewPrep] = useState([]);
  const [testPrep, setTestPrep] = useState([]);
  const [advancedReact, setAdvancedReact] = useState([]);
  const [cssLearnings, setCssLearnings] = useState([]);
  const [browserLearnings, setBrowserLearnings] = useState([]);
  const [systemDesignLearnings, setSystemDesignLearnings] = useState([]);
  const [algorithmLearnings, setAlgorithmLearnings] = useState([]);
  const [blind75Learnings, setBlind75Learnings] = useState([]);
  // Which lazily-loaded learning datasets have arrived. Views read this to
  // show a skeleton rather than an empty list while a chunk is in flight.
  const [loadedSections, setLoadedSections] = useState({});

  const sectionCount = useCallback(
    (section, list) => (loadedSections[section] ? list.length : (datasetCounts[section] ?? 0)),
    [loadedSections],
  );
  const [outputQuestions, setOutputQuestions] = useState([]);
  const [outputSourceUrl, setOutputSourceUrl] = useState('');
  const { route, navigate, setSection, setViewMode, learningSetters } = useAppRoute();
  const {
    'learnings': setLearningId,
    'acceldata-prep': setAcceldataPrepLearningId,
    'css': setCssLearningId,
    'react-learnings': setReactLearningId,
    'react-guide': setReactGuideLearningId,
    'interview-prep': setInterviewPrepLearningId,
    'test-prep': setTestPrepLearningId,
    'advanced-react': setAdvancedReactLearningId,
    'browser': setBrowserLearningId,
    'system-design': setSystemDesignLearningId,
    'algorithm': setAlgorithmLearningId,
    'blind75': setBlind75LearningId,
  } = learningSetters;
  const activeSection = route.section;
  const viewMode = route.viewMode;

  const [theme, setTheme] = useLocalStorage('quiz-theme', 'light');
  const [editorTheme, setEditorTheme] = useLocalStorage('quiz-editor-theme', 'dark');
  const [syntaxHighlight, setSyntaxHighlight] = useLocalStorage('quiz-syntax', true);
  const [progress, setProgress] = useLocalStorage('quiz-progress', EMPTY_PROGRESS);
  const [mcqQueue, setMcqQueue] = usePracticeQueueStorage('mcq-queue', 'quiz-session');
  const [legacySkippedIds, setLegacySkippedIds] = useLocalStorage('quiz-skipped', []);
  const [outputProgress, setOutputProgress] = useLocalStorage('output-quiz-progress', EMPTY_OUTPUT_PROGRESS);
  const [outputQueue, setOutputQueue] = usePracticeQueueStorage('output-queue', 'output-quiz-session');
  const [outputIncludeCompleted, setOutputIncludeCompleted] = useLocalStorage('output-quiz-include-completed', true);
  const [mcqIncludeCompleted, setMcqIncludeCompleted] = useLocalStorage('mcq-include-completed', true);
  const [codingIncludeCompleted, setCodingIncludeCompleted] = useLocalStorage('coding-include-completed', true);
  const [completed, setCompleted] = useLocalStorage('quiz-completed', EMPTY_COMPLETED);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage('layout-sidebar-collapsed', false);
  const [sectionCategory, setSectionCategory] = useLocalStorage('sidebar-section-category', 'all');
  const [panelCollapsed, setPanelCollapsed] = useLocalStorage('layout-panel-collapsed', false);
  const [codingProgress, setCodingProgress] = useState(() => loadCodingProgress());
  const [codingQueue, setCodingQueue] = usePracticeQueueStorage('coding-queue', 'coding-quiz-session');
  const [codingQuestions, setCodingQuestions] = useState([]);
  const [archived, setArchived] = useLocalStorage('quiz-archived', EMPTY_ARCHIVED);
  const [starred, setStarred] = useLocalStorage('quiz-starred', EMPTY_STARRED);
  const [starredFilter, setStarredFilter] = useLocalStorage('quiz-starred-filter', EMPTY_STARRED_FILTER);
  const [searchPaletteOpen, setSearchPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Latest-value refs so answer handlers can guard against double-recording
  // without depending on (and re-creating themselves for) every state change.
  const mcqQueueRef = useLatestRef(mcqQueue);
  const outputQueueRef = useLatestRef(outputQueue);
  const codingQueueRef = useLatestRef(codingQueue);
  const completedRef = useLatestRef(completed);

  const activeQuestions = useMemo(
    () => filterActive(questions, 'mcq', archived),
    [questions, archived]
  );
  const activeLearnings = useMemo(
    () => filterActive(learnings, 'learnings', archived),
    [learnings, archived]
  );
  const activeReactLearnings = useMemo(
    () => filterActive(reactLearnings, 'react-learnings', archived),
    [reactLearnings, archived]
  );
  const activeReactGuide = useMemo(
    () => filterActive(reactGuide, 'react-guide', archived),
    [reactGuide, archived]
  );
  const activeInterviewPrep = useMemo(
    () => filterActive(interviewPrep, 'interview-prep', archived),
    [interviewPrep, archived]
  );
  const activeTestPrep = useMemo(
    () => filterActive(testPrep, 'test-prep', archived),
    [testPrep, archived]
  );
  const activeAdvancedReact = useMemo(
    () => filterActive(advancedReact, 'advanced-react', archived),
    [advancedReact, archived]
  );
  const activeAcceldataPrep = useMemo(
    () => filterActive(acceldataPrep, 'acceldata-prep', archived),
    [acceldataPrep, archived]
  );
  const activeCssLearnings = useMemo(
    () => filterActive(cssLearnings, 'css', archived),
    [cssLearnings, archived]
  );
  const activeBrowserLearnings = useMemo(
    () => filterActive(browserLearnings, 'browser', archived),
    [browserLearnings, archived]
  );
  const activeSystemDesignLearnings = useMemo(
    () => filterActive(systemDesignLearnings, 'system-design', archived),
    [systemDesignLearnings, archived]
  );
  const activeAlgorithmLearnings = useMemo(
    () => filterActive(algorithmLearnings, 'algorithm', archived),
    [algorithmLearnings, archived]
  );
  const activeBlind75Learnings = useMemo(
    () => filterActive(blind75Learnings, 'blind75', archived),
    [blind75Learnings, archived]
  );
  const activeCodingQuestions = useMemo(
    () => filterActive(codingQuestions, 'coding', archived),
    [codingQuestions, archived]
  );
  const activeOutputQuestions = useMemo(
    () => filterActive(outputQuestions, 'output', archived),
    [outputQuestions, archived]
  );
  const archivedCount = useMemo(() => getArchivedCount(archived), [archived]);
  const archivedMcqSet = useMemo(() => getArchivedSet(archived, 'mcq'), [archived]);

  const starredActiveQuestions = useMemo(
    () => (starredFilter.mcq ? filterStarred(activeQuestions, 'mcq', starred) : activeQuestions),
    [activeQuestions, starredFilter.mcq, starred]
  );
  const starredActiveLearnings = useMemo(
    () => (starredFilter.learnings ? filterStarred(activeLearnings, 'learnings', starred) : activeLearnings),
    [activeLearnings, starredFilter.learnings, starred]
  );
  const starredActiveReactLearnings = useMemo(
    () => (starredFilter['react-learnings'] ? filterStarred(activeReactLearnings, 'react-learnings', starred) : activeReactLearnings),
    [activeReactLearnings, starredFilter, starred]
  );
  const starredActiveReactGuide = useMemo(
    () => (starredFilter['react-guide'] ? filterStarred(activeReactGuide, 'react-guide', starred) : activeReactGuide),
    [activeReactGuide, starredFilter, starred]
  );
  const starredActiveInterviewPrep = useMemo(
    () => (starredFilter['interview-prep'] ? filterStarred(activeInterviewPrep, 'interview-prep', starred) : activeInterviewPrep),
    [activeInterviewPrep, starredFilter, starred]
  );
  const starredActiveTestPrep = useMemo(
    () => (starredFilter['test-prep'] ? filterStarred(activeTestPrep, 'test-prep', starred) : activeTestPrep),
    [activeTestPrep, starredFilter, starred]
  );
  const starredActiveAcceldataPrep = useMemo(
    () =>
      starredFilter['acceldata-prep']
        ? filterStarred(activeAcceldataPrep, 'acceldata-prep', starred)
        : activeAcceldataPrep,
    [activeAcceldataPrep, starredFilter, starred]
  );
  const starredActiveCssLearnings = useMemo(
    () => (starredFilter.css ? filterStarred(activeCssLearnings, 'css', starred) : activeCssLearnings),
    [activeCssLearnings, starredFilter, starred]
  );
  const starredActiveAdvancedReact = useMemo(
    () => (starredFilter['advanced-react'] ? filterStarred(activeAdvancedReact, 'advanced-react', starred) : activeAdvancedReact),
    [activeAdvancedReact, starredFilter, starred]
  );
  const starredActiveBrowserLearnings = useMemo(
    () => (starredFilter.browser ? filterStarred(activeBrowserLearnings, 'browser', starred) : activeBrowserLearnings),
    [activeBrowserLearnings, starredFilter.browser, starred]
  );
  const starredActiveSystemDesignLearnings = useMemo(
    () => (starredFilter['system-design'] ? filterStarred(activeSystemDesignLearnings, 'system-design', starred) : activeSystemDesignLearnings),
    [activeSystemDesignLearnings, starredFilter['system-design'], starred]
  );
  const starredActiveAlgorithmLearnings = useMemo(
    () => (starredFilter.algorithm ? filterStarred(activeAlgorithmLearnings, 'algorithm', starred) : activeAlgorithmLearnings),
    [activeAlgorithmLearnings, starredFilter.algorithm, starred]
  );
  const starredActiveBlind75Learnings = useMemo(
    () => (starredFilter.blind75 ? filterStarred(activeBlind75Learnings, 'blind75', starred) : activeBlind75Learnings),
    [activeBlind75Learnings, starredFilter.blind75, starred]
  );
  const orderedStarredActiveLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveLearnings, 'learnings', completed),
    [starredActiveLearnings, completed]
  );
  const orderedStarredActiveReactLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveReactLearnings, 'react-learnings', completed),
    [starredActiveReactLearnings, completed]
  );
  const orderedStarredActiveReactGuide = useMemo(
    () => sortCompletedToEnd(starredActiveReactGuide, 'react-guide', completed),
    [starredActiveReactGuide, completed]
  );
  const orderedStarredActiveInterviewPrep = useMemo(
    () => sortCompletedToEnd(starredActiveInterviewPrep, 'interview-prep', completed),
    [starredActiveInterviewPrep, completed]
  );
  const orderedStarredActiveTestPrep = useMemo(
    () => sortCompletedToEnd(starredActiveTestPrep, 'test-prep', completed),
    [starredActiveTestPrep, completed]
  );
  const orderedStarredActiveAcceldataPrep = useMemo(
    () => sortCompletedToEnd(starredActiveAcceldataPrep, 'acceldata-prep', completed),
    [starredActiveAcceldataPrep, completed]
  );
  const orderedStarredActiveCssLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveCssLearnings, 'css', completed),
    [starredActiveCssLearnings, completed]
  );
  const orderedStarredActiveAdvancedReact = useMemo(
    () => sortCompletedToEnd(starredActiveAdvancedReact, 'advanced-react', completed),
    [starredActiveAdvancedReact, completed]
  );
  const orderedStarredActiveBrowserLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveBrowserLearnings, 'browser', completed),
    [starredActiveBrowserLearnings, completed]
  );
  const orderedStarredActiveSystemDesignLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveSystemDesignLearnings, 'system-design', completed),
    [starredActiveSystemDesignLearnings, completed]
  );
  const orderedStarredActiveAlgorithmLearnings = useMemo(
    () => sortCompletedToEnd(starredActiveAlgorithmLearnings, 'algorithm', completed),
    [starredActiveAlgorithmLearnings, completed]
  );
  const orderedStarredActiveBlind75Learnings = useMemo(
    () => sortCompletedToEnd(starredActiveBlind75Learnings, 'blind75', completed),
    [starredActiveBlind75Learnings, completed]
  );
  const starredActiveCodingQuestions = useMemo(
    () => (starredFilter.coding ? filterStarred(activeCodingQuestions, 'coding', starred) : activeCodingQuestions),
    [activeCodingQuestions, starredFilter.coding, starred]
  );
  const starredActiveOutputQuestions = useMemo(
    () => (starredFilter.output ? filterStarred(activeOutputQuestions, 'output', starred) : activeOutputQuestions),
    [activeOutputQuestions, starredFilter.output, starred]
  );
  const mcqStarredCount = useMemo(() => getStarredCount(starred, 'mcq'), [starred]);
  const mcqCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'mcq', activeQuestions),
    [completed, activeQuestions]
  );
  const codingCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'coding', activeCodingQuestions),
    [completed, activeCodingQuestions]
  );
  const outputCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'output', activeOutputQuestions),
    [completed, activeOutputQuestions]
  );
  const learningsCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'learnings', activeLearnings),
    [completed, activeLearnings]
  );
  const reactLearningsCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'react-learnings', activeReactLearnings),
    [completed, activeReactLearnings]
  );
  const reactGuideCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'react-guide', activeReactGuide),
    [completed, activeReactGuide]
  );
  const interviewPrepCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'interview-prep', activeInterviewPrep),
    [completed, activeInterviewPrep]
  );
  const testPrepCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'test-prep', activeTestPrep),
    [completed, activeTestPrep]
  );
  const acceldataPrepCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'acceldata-prep', activeAcceldataPrep),
    [completed, activeAcceldataPrep]
  );
  const cssCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'css', activeCssLearnings),
    [completed, activeCssLearnings]
  );
  const advancedReactCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'advanced-react', activeAdvancedReact),
    [completed, activeAdvancedReact]
  );
  const browserCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'browser', activeBrowserLearnings),
    [completed, activeBrowserLearnings]
  );
  const systemDesignCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'system-design', activeSystemDesignLearnings),
    [completed, activeSystemDesignLearnings]
  );
  const algorithmCompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'algorithm', activeAlgorithmLearnings),
    [completed, activeAlgorithmLearnings]
  );
  const blind75CompletedCount = useMemo(
    () => getActiveCompletedCount(completed, 'blind75', activeBlind75Learnings),
    [completed, activeBlind75Learnings]
  );
  const learningsStarredCount = useMemo(() => getStarredCount(starred, 'learnings'), [starred]);
  const reactLearningsStarredCount = useMemo(() => getStarredCount(starred, 'react-learnings'), [starred]);
  const reactGuideStarredCount = useMemo(() => getStarredCount(starred, 'react-guide'), [starred]);
  const interviewPrepStarredCount = useMemo(() => getStarredCount(starred, 'interview-prep'), [starred]);
  const testPrepStarredCount = useMemo(() => getStarredCount(starred, 'test-prep'), [starred]);
  const acceldataPrepStarredCount = useMemo(() => getStarredCount(starred, 'acceldata-prep'), [starred]);
  const cssStarredCount = useMemo(() => getStarredCount(starred, 'css'), [starred]);
  const advancedReactStarredCount = useMemo(() => getStarredCount(starred, 'advanced-react'), [starred]);
  const browserStarredCount = useMemo(() => getStarredCount(starred, 'browser'), [starred]);
  const systemDesignStarredCount = useMemo(() => getStarredCount(starred, 'system-design'), [starred]);
  const algorithmStarredCount = useMemo(() => getStarredCount(starred, 'algorithm'), [starred]);
  const blind75StarredCount = useMemo(() => getStarredCount(starred, 'blind75'), [starred]);
  const codingStarredCount = useMemo(() => getStarredCount(starred, 'coding'), [starred]);
  const outputStarredCount = useMemo(() => getStarredCount(starred, 'output'), [starred]);

  const searchDocs = useMemo(
    () =>
      buildSearchIndex({
        acceldataPrep: activeAcceldataPrep,
        interviewPrep: activeInterviewPrep,
        testPrep: activeTestPrep,
        mcq: activeQuestions,
        learnings: activeLearnings,
        reactLearnings: activeReactLearnings,
        reactGuide: activeReactGuide,
        advancedReact: activeAdvancedReact,
        css: activeCssLearnings,
        browser: activeBrowserLearnings,
        systemDesign: activeSystemDesignLearnings,
        algorithm: activeAlgorithmLearnings,
        blind75: activeBlind75Learnings,
        coding: activeCodingQuestions,
        output: activeOutputQuestions,
      }),
    [
      activeAcceldataPrep,
      activeInterviewPrep,
      activeTestPrep,
      activeQuestions,
      activeLearnings,
      activeReactLearnings,
      activeReactGuide,
      activeAdvancedReact,
      activeCssLearnings,
      activeBrowserLearnings,
      activeSystemDesignLearnings,
      activeAlgorithmLearnings,
      activeBlind75Learnings,
      activeCodingQuestions,
      activeOutputQuestions,
    ]
  );

  const passRecordedRef = useRef(false);
  const outputPassRecordedRef = useRef(false);
  const codingPassRecordedRef = useRef(false);
  const skippedIds = useMemo(() => getSkippedPracticeQueueIds(mcqQueue), [mcqQueue]);

  // Counters must come from the queue restricted to what is actually visible.
  // Reading them off the raw stored queue counts ids that a filter has hidden,
  // so "Next" stalls on the same question and remaining can exceed passTotal.
  const mcqVisibleQueue = useMemo(
    () => restrictQueueToPool(mcqQueue, starredActiveQuestions),
    [mcqQueue, starredActiveQuestions]
  );
  const mcqRestored = useMemo(
    () => restorePracticeQueue(mcqVisibleQueue, starredActiveQuestions),
    [mcqVisibleQueue, starredActiveQuestions]
  );
  const score = mcqVisibleQueue?.score ?? 0;
  const answered = mcqVisibleQueue?.answered ?? 0;
  const mode = mcqQueue?.mode ?? 'all';
  const selectedTopics = mcqQueue?.selectedTopics ?? [];
  const selectedDifficulties = mcqQueue?.selectedDifficulties ?? [];
  const sessionTotal = mcqRestored.length;
  const remaining = mcqVisibleQueue?.remaining ?? 0;
  const passTotal = mcqVisibleQueue?.passTotal ?? sessionTotal;
  const currentQuestion = mcqRestored[0] ?? null;
  const isPassComplete = remaining === 0 && sessionTotal > 0;

  const outputVisibleQueue = useMemo(
    () => restrictQueueToPool(outputQueue, starredActiveOutputQuestions),
    [outputQueue, starredActiveOutputQuestions]
  );
  const outputRestored = useMemo(
    () => restorePracticeQueue(outputVisibleQueue, starredActiveOutputQuestions),
    [outputVisibleQueue, starredActiveOutputQuestions]
  );
  const outputScore = outputVisibleQueue?.score ?? 0;
  const outputAnswered = outputVisibleQueue?.answered ?? 0;
  const outputSessionTotal = outputRestored.length;
  const outputRemaining = outputVisibleQueue?.remaining ?? 0;
  const outputPassTotal = outputVisibleQueue?.passTotal ?? outputSessionTotal;
  const currentOutputQuestion = outputRestored[0] ?? null;
  const isOutputPassComplete = outputRemaining === 0 && outputSessionTotal > 0;
  const outputQueueEmpty =
    starredActiveOutputQuestions.length > 0 && outputRestored.length === 0;

  const codingVisibleQueue = useMemo(
    () => restrictQueueToPool(codingQueue, starredActiveCodingQuestions),
    [codingQueue, starredActiveCodingQuestions]
  );
  const codingRestored = useMemo(
    () => restorePracticeQueue(codingVisibleQueue, starredActiveCodingQuestions),
    [codingVisibleQueue, starredActiveCodingQuestions]
  );
  const codingScore = codingVisibleQueue?.score ?? 0;
  const codingAnswered = codingVisibleQueue?.answered ?? 0;
  const codingSessionTotal = codingRestored.length;
  const codingRemaining = codingVisibleQueue?.remaining ?? 0;
  const codingPassTotal = codingVisibleQueue?.passTotal ?? codingSessionTotal;
  const currentCodingQuestion = codingRestored[0] ?? null;
  const isCodingPassComplete = codingRemaining === 0 && codingSessionTotal > 0;
  const codingQueueEmpty =
    starredActiveCodingQuestions.length > 0 && codingRestored.length === 0;

  // Write the restriction back so the stored pass stops carrying ids that are
  // no longer reachable. Skipped while loading, when every pool is still empty.
  useEffect(() => {
    if (loading) return;
    const prune = (stored, visible, setter) => {
      if (!stored || !visible) return;
      if (visible.queueIds.length === getPracticeQueueQuestionIds(stored).length) return;
      setter(visible);
    };
    prune(mcqQueue, mcqVisibleQueue, setMcqQueue);
    prune(outputQueue, outputVisibleQueue, setOutputQueue);
    prune(codingQueue, codingVisibleQueue, setCodingQueue);
  }, [
    loading,
    mcqQueue,
    mcqVisibleQueue,
    setMcqQueue,
    outputQueue,
    outputVisibleQueue,
    setOutputQueue,
    codingQueue,
    codingVisibleQueue,
    setCodingQueue,
  ]);

  // A pass can be completed more than once (unarchiving or jumping to a
  // question refills it). Re-arm the recorder whenever there is work left,
  // otherwise only the first completion is ever recorded as a session.
  useEffect(() => {
    if (remaining > 0) passRecordedRef.current = false;
  }, [remaining]);
  useEffect(() => {
    if (outputRemaining > 0) outputPassRecordedRef.current = false;
  }, [outputRemaining]);
  useEffect(() => {
    if (codingRemaining > 0) codingPassRecordedRef.current = false;
  }, [codingRemaining]);

  const selectedLearning = useMemo(() => {
    if (activeSection !== 'learnings') return null;
    if (route.learningId) {
      return orderedStarredActiveLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveLearnings[0] ?? null;
    }
    return orderedStarredActiveLearnings[0] ?? null;
  }, [orderedStarredActiveLearnings, route.learningId, activeSection]);

  const selectedReactLearning = useMemo(() => {
    if (activeSection !== 'react-learnings') return null;
    if (route.learningId) {
      return orderedStarredActiveReactLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveReactLearnings[0] ?? null;
    }
    return orderedStarredActiveReactLearnings[0] ?? null;
  }, [orderedStarredActiveReactLearnings, route.learningId, activeSection]);

  const selectedReactGuideEntry = useMemo(() => {
    if (activeSection !== 'react-guide') return null;
    if (route.learningId) {
      return orderedStarredActiveReactGuide.find((item) => item.id === route.learningId) ?? orderedStarredActiveReactGuide[0] ?? null;
    }
    return orderedStarredActiveReactGuide[0] ?? null;
  }, [orderedStarredActiveReactGuide, route.learningId, activeSection]);

  const selectedInterviewPrepEntry = useMemo(() => {
    if (activeSection !== 'interview-prep') return null;
    if (route.learningId) {
      return orderedStarredActiveInterviewPrep.find((item) => item.id === route.learningId) ?? orderedStarredActiveInterviewPrep[0] ?? null;
    }
    return orderedStarredActiveInterviewPrep[0] ?? null;
  }, [orderedStarredActiveInterviewPrep, route.learningId, activeSection]);

  const selectedTestPrepEntry = useMemo(() => {
    if (activeSection !== 'test-prep') return null;
    if (route.learningId) {
      return orderedStarredActiveTestPrep.find((item) => item.id === route.learningId) ?? orderedStarredActiveTestPrep[0] ?? null;
    }
    return orderedStarredActiveTestPrep[0] ?? null;
  }, [orderedStarredActiveTestPrep, route.learningId, activeSection]);

  const selectedAcceldataPrep = useMemo(() => {
    if (activeSection !== 'acceldata-prep') return null;
    if (route.learningId) {
      return orderedStarredActiveAcceldataPrep.find((item) => item.id === route.learningId) ?? orderedStarredActiveAcceldataPrep[0] ?? null;
    }
    return orderedStarredActiveAcceldataPrep[0] ?? null;
  }, [orderedStarredActiveAcceldataPrep, route.learningId, activeSection]);

  const selectedCssLearning = useMemo(() => {
    if (activeSection !== 'css') return null;
    if (route.learningId) {
      return orderedStarredActiveCssLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveCssLearnings[0] ?? null;
    }
    return orderedStarredActiveCssLearnings[0] ?? null;
  }, [orderedStarredActiveCssLearnings, route.learningId, activeSection]);

  const selectedAdvancedReactEntry = useMemo(() => {
    if (activeSection !== 'advanced-react') return null;
    if (route.learningId) {
      return orderedStarredActiveAdvancedReact.find((item) => item.id === route.learningId) ?? orderedStarredActiveAdvancedReact[0] ?? null;
    }
    return orderedStarredActiveAdvancedReact[0] ?? null;
  }, [orderedStarredActiveAdvancedReact, route.learningId, activeSection]);

  const selectedBrowserLearning = useMemo(() => {
    if (activeSection !== 'browser') return null;
    if (route.learningId) {
      return orderedStarredActiveBrowserLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveBrowserLearnings[0] ?? null;
    }
    return orderedStarredActiveBrowserLearnings[0] ?? null;
  }, [orderedStarredActiveBrowserLearnings, route.learningId, activeSection]);

  const selectedSystemDesignLearning = useMemo(() => {
    if (activeSection !== 'system-design') return null;
    if (route.learningId) {
      return orderedStarredActiveSystemDesignLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveSystemDesignLearnings[0] ?? null;
    }
    return orderedStarredActiveSystemDesignLearnings[0] ?? null;
  }, [orderedStarredActiveSystemDesignLearnings, route.learningId, activeSection]);

  const selectedAlgorithmLearning = useMemo(() => {
    if (activeSection !== 'algorithm') return null;
    if (route.learningId) {
      return orderedStarredActiveAlgorithmLearnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveAlgorithmLearnings[0] ?? null;
    }
    return orderedStarredActiveAlgorithmLearnings[0] ?? null;
  }, [orderedStarredActiveAlgorithmLearnings, route.learningId, activeSection]);

  const selectedBlind75Learning = useMemo(() => {
    if (activeSection !== 'blind75') return null;
    if (route.learningId) {
      return orderedStarredActiveBlind75Learnings.find((item) => item.id === route.learningId) ?? orderedStarredActiveBlind75Learnings[0] ?? null;
    }
    return orderedStarredActiveBlind75Learnings[0] ?? null;
  }, [orderedStarredActiveBlind75Learnings, route.learningId, activeSection]);

  const announce = useAnnounce();

  // Switching section swaps the whole centre pane with nothing spoken.
  const handleSectionChange = useCallback(
    (section, options) => {
      setSection(section, options);
      announce(sectionLabel(section));
    },
    [setSection, announce],
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    syncThemeColorMeta(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-editor-theme', editorTheme);
  }, [editorTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  const toggleEditorTheme = useCallback(() => {
    setEditorTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setEditorTheme]);

  useEffect(() => {
    if (activeSection !== 'learnings' || !orderedStarredActiveLearnings.length) return;
    if (route.learningId && !orderedStarredActiveLearnings.some((item) => item.id === route.learningId)) {
      setLearningId(orderedStarredActiveLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveLearnings, setLearningId]);

  useEffect(() => {
    if (activeSection !== 'react-learnings' || !orderedStarredActiveReactLearnings.length) return;
    if (route.learningId && !orderedStarredActiveReactLearnings.some((item) => item.id === route.learningId)) {
      setReactLearningId(orderedStarredActiveReactLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveReactLearnings, setReactLearningId]);

  useEffect(() => {
    if (activeSection !== 'react-guide' || !orderedStarredActiveReactGuide.length) return;
    if (route.learningId && !orderedStarredActiveReactGuide.some((item) => item.id === route.learningId)) {
      setReactGuideLearningId(orderedStarredActiveReactGuide[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveReactGuide, setReactGuideLearningId]);

  useEffect(() => {
    if (activeSection !== 'interview-prep' || !orderedStarredActiveInterviewPrep.length) return;
    if (route.learningId && !orderedStarredActiveInterviewPrep.some((item) => item.id === route.learningId)) {
      setInterviewPrepLearningId(orderedStarredActiveInterviewPrep[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveInterviewPrep, setInterviewPrepLearningId]);

  useEffect(() => {
    if (activeSection !== 'test-prep' || !orderedStarredActiveTestPrep.length) return;
    if (route.learningId && !orderedStarredActiveTestPrep.some((item) => item.id === route.learningId)) {
      setTestPrepLearningId(orderedStarredActiveTestPrep[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveTestPrep, setTestPrepLearningId]);

  useEffect(() => {
    if (activeSection !== 'acceldata-prep' || !orderedStarredActiveAcceldataPrep.length) return;
    if (route.learningId && !orderedStarredActiveAcceldataPrep.some((item) => item.id === route.learningId)) {
      setAcceldataPrepLearningId(orderedStarredActiveAcceldataPrep[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveAcceldataPrep, setAcceldataPrepLearningId]);

  useEffect(() => {
    if (activeSection !== 'css' || !orderedStarredActiveCssLearnings.length) return;
    if (route.learningId && !orderedStarredActiveCssLearnings.some((item) => item.id === route.learningId)) {
      setCssLearningId(orderedStarredActiveCssLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveCssLearnings, setCssLearningId]);

  useEffect(() => {
    if (activeSection !== 'advanced-react' || !orderedStarredActiveAdvancedReact.length) return;
    if (route.learningId && !orderedStarredActiveAdvancedReact.some((item) => item.id === route.learningId)) {
      setAdvancedReactLearningId(orderedStarredActiveAdvancedReact[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveAdvancedReact, setAdvancedReactLearningId]);

  useEffect(() => {
    if (activeSection !== 'browser' || !orderedStarredActiveBrowserLearnings.length) return;
    if (route.learningId && !orderedStarredActiveBrowserLearnings.some((item) => item.id === route.learningId)) {
      setBrowserLearningId(orderedStarredActiveBrowserLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveBrowserLearnings, setBrowserLearningId]);

  useEffect(() => {
    if (activeSection !== 'system-design' || !orderedStarredActiveSystemDesignLearnings.length) return;
    if (route.learningId && !orderedStarredActiveSystemDesignLearnings.some((item) => item.id === route.learningId)) {
      setSystemDesignLearningId(orderedStarredActiveSystemDesignLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveSystemDesignLearnings, setSystemDesignLearningId]);

  useEffect(() => {
    if (activeSection !== 'algorithm' || !orderedStarredActiveAlgorithmLearnings.length) return;
    if (route.learningId && !orderedStarredActiveAlgorithmLearnings.some((item) => item.id === route.learningId)) {
      setAlgorithmLearningId(orderedStarredActiveAlgorithmLearnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveAlgorithmLearnings, setAlgorithmLearningId]);

  useEffect(() => {
    if (activeSection !== 'blind75' || !orderedStarredActiveBlind75Learnings.length) return;
    if (route.learningId && !orderedStarredActiveBlind75Learnings.some((item) => item.id === route.learningId)) {
      setBlind75LearningId(orderedStarredActiveBlind75Learnings[0].id, { replace: true });
    }
  }, [activeSection, route.learningId, orderedStarredActiveBlind75Learnings, setBlind75LearningId]);

  const weakTopics = useMemo(
    () => getWeakTopics(progress, activeQuestions),
    [progress, activeQuestions]
  );

  const missedCount = useMemo(
    () => getMissedQuestionIds(progress).length,
    [progress]
  );

  const filteredQuestions = useMemo(
    () => filterQuestions(starredActiveQuestions, { topics: selectedTopics, difficulties: selectedDifficulties }),
    [starredActiveQuestions, selectedTopics, selectedDifficulties]
  );

  const basePool = useMemo(() => {
    if (mode === 'weak') {
      const weakPool = getQuestionsForWeakTopics(starredActiveQuestions, weakTopics);
      return filterQuestions(weakPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    if (mode === 'review') {
      const reviewPool = getQuestionsForReview(starredActiveQuestions, progress);
      return filterQuestions(reviewPool, { topics: selectedTopics, difficulties: selectedDifficulties });
    }
    return filteredQuestions;
  }, [mode, starredActiveQuestions, weakTopics, progress, filteredQuestions, selectedTopics, selectedDifficulties]);

  const currentPassQuestions = useMemo(
    () => getPassScopeQuestions(starredActiveQuestions, mcqQueue),
    [starredActiveQuestions, mcqQueue]
  );
  const mcqListQuestions = currentPassQuestions.length > 0 ? currentPassQuestions : basePool;
  const mcqListScopeLabel = currentPassQuestions.length > 0 ? 'Current pass' : 'Filtered questions';

  const mcqQueueEmpty = basePool.length > 0 && mcqRestored.length === 0;

  // An empty pool means the filters matched nothing. Falling back to every
  // question here would build a full-length queue behind an empty-state screen,
  // and persist it — leave it empty and let the empty state stand.
  const buildMcqPool = useCallback(
    (pool, includeCompleted = mcqIncludeCompleted) =>
      filterPoolByCompleted(pool, completed, {
        includeCompleted,
        section: 'mcq',
      }),
    [completed, mcqIncludeCompleted]
  );

  const buildOutputQuizQueue = useCallback(
    (pool, includeCompleted = outputIncludeCompleted) =>
      buildOutputQueue(pool, completed, { includeCompleted }),
    [completed, outputIncludeCompleted]
  );

  const startMcqPass = useCallback(
    (pool, nextMode = 'all', topics = selectedTopics, difficulties = selectedDifficulties, { resetPass = true } = {}) => {
      const filtered = buildMcqPool(pool);
      const queue = smartShuffle(filtered, progress);
      setMcqQueue(
        createPracticeQueue(queue, {
          mode: nextMode,
          topics,
          difficulties,
          resetPass,
          answeredIds: mcqQueue?.answeredIds ?? [],
          correctIds: mcqQueue?.correctIds ?? [],
        })
      );
      passRecordedRef.current = false;
    },
    [buildMcqPool, progress, selectedTopics, selectedDifficulties, mcqQueue, setMcqQueue]
  );

  const startOutputPass = useCallback(
    ({ resetPass = true, includeCompleted: includeCompletedOverride, pool: poolOverride } = {}) => {
      const includeCompleted = includeCompletedOverride ?? outputIncludeCompleted;
      const queue = buildOutputQuizQueue(poolOverride ?? starredActiveOutputQuestions, includeCompleted);
      setOutputQueue(
        createPracticeQueue(queue, {
          resetPass,
          answeredIds: outputQueue?.answeredIds ?? [],
          correctIds: outputQueue?.correctIds ?? [],
        })
      );
      outputPassRecordedRef.current = false;
    },
    [buildOutputQuizQueue, starredActiveOutputQuestions, outputIncludeCompleted, outputQueue, setOutputQueue]
  );

  const startCodingPass = useCallback(
    ({ resetPass = true, includeCompleted: includeCompletedOverride, pool: poolOverride } = {}) => {
      const includeCompleted = includeCompletedOverride ?? codingIncludeCompleted;
      const pool = poolOverride ?? starredActiveCodingQuestions;
      const queue = buildCodingQueue(pool, completed, { includeCompleted });
      setCodingQueue(
        createPracticeQueue(queue, {
          resetPass,
          answeredIds: codingQueue?.answeredIds ?? [],
          correctIds: codingQueue?.correctIds ?? [],
        })
      );
      codingPassRecordedRef.current = false;
    },
    [starredActiveCodingQuestions, completed, codingIncludeCompleted, codingQueue, setCodingQueue]
  );

  useEffect(() => {
    const allQuestions = questionsData.questions;
    const allOutputQuestions = [
      ...outputQuestionsData.questions,
      ...scopeOutputQuestionsData.questions,
    ];
    const allCodingQuestions = codingQuestionsData.questions;
    setQuestions(allQuestions);
    setOutputQuestions(allOutputQuestions);
    setOutputSourceUrl(outputQuestionsData.source);
    setCodingQuestions(allCodingQuestions);

    const activeMcq = filterActive(allQuestions, 'mcq', archived);
    const activeOutput = filterActive(allOutputQuestions, 'output', archived);
    const activeCoding = filterActive(allCodingQuestions, 'coding', archived);
    const starredMcq = starredFilter.mcq ? filterStarred(activeMcq, 'mcq', starred) : activeMcq;
    const starredOutput = starredFilter.output ? filterStarred(activeOutput, 'output', starred) : activeOutput;
    const starredCoding = starredFilter.coding ? filterStarred(activeCoding, 'coding', starred) : activeCoding;

    setMcqQueue((saved) => {
      let state = normalizePracticeQueue(saved);
      if (state) {
        state = mergePracticeQueueSkippedIds(state, legacySkippedIds);
        state = sanitizePracticeQueue(state, 'mcq', archived);
      }
      if (isRestorablePracticeQueue(state, starredMcq)) {
        return state;
      }
      const pool = filterPoolByCompleted(starredMcq, completed, {
        includeCompleted: mcqIncludeCompleted,
        section: 'mcq',
      });
      const queue = smartShuffle(pool, progress);
      return createPracticeQueue(queue, { mode: 'all', topics: [], difficulties: [] });
    });

    setOutputQueue((saved) => {
      const state = sanitizePracticeQueue(normalizePracticeQueue(saved), 'output', archived);
      if (isRestorablePracticeQueue(state, starredOutput)) {
        return state;
      }
      const queue = buildOutputQueue(starredOutput, completed, {
        includeCompleted: outputIncludeCompleted,
      });
      return createPracticeQueue(queue);
    });

    setCodingQueue((saved) => {
      const state = sanitizePracticeQueue(normalizePracticeQueue(saved), 'coding', archived);
      if (isRestorablePracticeQueue(state, starredCoding)) {
        return state;
      }
      const queue = buildCodingQueue(starredCoding, completed, {
        includeCompleted: codingIncludeCompleted,
      });
      return createPracticeQueue(queue);
    });

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The learning datasets are code-split, so they arrive after first paint.
  // The section the user actually landed on is fetched first; the rest follow
  // when the main thread is idle, so opening the command palette or switching
  // section is usually instant.
  useEffect(() => {
    const setters = {
      'acceldata-prep': setAcceldataPrep,
      learnings: setLearnings,
      css: setCssLearnings,
      'react-learnings': setReactLearnings,
      'react-guide': setReactGuide,
      'interview-prep': setInterviewPrep,
      'test-prep': setTestPrep,
      'advanced-react': setAdvancedReact,
      browser: setBrowserLearnings,
      'system-design': setSystemDesignLearnings,
      algorithm: setAlgorithmLearnings,
      blind75: setBlind75Learnings,
    };

    let cancelled = false;

    const load = (section) =>
      loadLearningSection(section)
        .then((items) => {
          if (cancelled) return;
          setters[section](items);
          setLoadedSections((prev) => ({ ...prev, [section]: true }));
        })
        .catch((err) => {
          // A failed chunk leaves that one section empty; the rest of the app
          // keeps working, so this is logged rather than thrown.
          console.error(`Could not load the "${section}" dataset.`, err);
        });

    const all = Object.keys(setters);
    const first = all.includes(route.section) ? route.section : null;

    const rest = () => all.filter((s) => s !== first).forEach(load);
    const idle = window.requestIdleCallback ?? ((fn) => setTimeout(fn, 200));

    if (first) load(first).then(() => !cancelled && idle(rest));
    else idle(rest);

    return () => {
      cancelled = true;
    };
    // Runs once: `route.section` is read only to decide which chunk to
    // prioritise, and re-running on every navigation would refetch nothing
    // useful (the loader caches) while resetting state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!legacySkippedIds.length || !mcqQueue) return;
    setLegacySkippedIds([]);
  }, [legacySkippedIds, mcqQueue, setLegacySkippedIds]);

  // Backfill the completed store from pre-existing answer history. This is a
  // migration, not a sync: it must run exactly once ever, otherwise un-marking
  // a question as mastered is silently undone on the next page load.
  useEffect(() => {
    if (loading || hasRunMigration(COMPLETED_BACKFILL_MIGRATION)) return;
    markMigrationRun(COMPLETED_BACKFILL_MIGRATION);
    setCompleted((prev) => {
      let next = syncOutputCompletedFromProgress(prev, outputProgress);
      next = syncCompletedFromProgress(next, 'mcq', progress);
      next = syncCompletedFromProgress(next, 'coding', codingProgress);
      return next;
    });
  }, [loading, outputProgress, progress, codingProgress, setCompleted]);

  /* The JS learnings section was split: browser topics became their own
     section, three entries moved to CSS / Algorithm / React, and the polyfill
     write-ups now live only as coding challenges. Starred, mastered and
     archived are all keyed by section + id, so each store has to follow the
     content. Once ever — re-running after the reader re-stars something would
     move it again. Waits for `learnings` so the prune has the real id set. */
  useEffect(() => {
    if (loading || !loadedSections.learnings) return;
    if (hasRunMigration(LEARNINGS_SPLIT_MIGRATION)) return;
    markMigrationRun(LEARNINGS_SPLIT_MIGRATION);

    const liveIds = learnings.map((item) => item.id);
    const move = (store) =>
      pruneStoreIds(relocateStoreIds(store, LEARNINGS_SPLIT_MOVES), 'learnings', liveIds);

    setStarred(move);
    setCompleted(move);
    setArchived(move);
  }, [loading, loadedSections.learnings, learnings, setStarred, setCompleted, setArchived]);

  /* Section rename only — see HLD_RENAME_MOVES. Does not wait on a loaded
     section because nothing is pruned against a live id set. */
  useEffect(() => {
    if (loading) return;
    if (hasRunMigration(HLD_RENAME_MIGRATION)) return;
    markMigrationRun(HLD_RENAME_MIGRATION);

    const move = (store) => relocateStoreIds(store, HLD_RENAME_MOVES);

    setStarred(move);
    setCompleted(move);
    setArchived(move);
  }, [loading, setStarred, setCompleted, setArchived]);

  useEffect(() => {
    if (!isPassComplete || passRecordedRef.current) return;
    passRecordedRef.current = true;

    const pct = passTotal > 0 ? Math.round((score / passTotal) * 100) : 0;
    setProgress((prev) =>
      recordSession(prev, {
        score,
        total: passTotal,
        pct,
        mode,
        topics: selectedTopics,
        difficulties: selectedDifficulties,
        questionIds: mcqQueue?.queueIds ?? [],
      })
    );
  }, [isPassComplete, score, passTotal, mode, selectedTopics, selectedDifficulties, mcqQueue, setProgress]);

  useEffect(() => {
    if (!isOutputPassComplete || outputPassRecordedRef.current) return;
    outputPassRecordedRef.current = true;

    const pct = outputPassTotal > 0 ? Math.round((outputScore / outputPassTotal) * 100) : 0;
    setOutputProgress((prev) =>
      recordOutputSession(prev, {
        score: outputScore,
        total: outputPassTotal,
        pct,
        questionIds: outputQueue?.queueIds ?? [],
      })
    );
  }, [isOutputPassComplete, outputScore, outputPassTotal, outputQueue, setOutputProgress]);

  useEffect(() => {
    if (!isCodingPassComplete || codingPassRecordedRef.current) return;
    codingPassRecordedRef.current = true;

    const pct = codingPassTotal > 0 ? Math.round((codingScore / codingPassTotal) * 100) : 0;
    setCodingProgress((prev) => {
      const updated = recordCodingSession(prev, {
        score: codingScore,
        total: codingPassTotal,
        pct,
        questionIds: codingQueue?.queueIds ?? [],
      });
      saveCodingProgress(updated);
      return updated;
    });
  }, [isCodingPassComplete, codingScore, codingPassTotal, codingQueue, setCodingProgress]);

  const startQuiz = useCallback(
    (pool, nextMode = 'all', { resetPass = true, topics = selectedTopics, difficulties = selectedDifficulties } = {}) => {
      startMcqPass(pool, nextMode, topics, difficulties, { resetPass });
    },
    [startMcqPass, selectedTopics, selectedDifficulties]
  );

  const handlePick = useCallback(
    (correct, question) => {
      // Side effects must stay out of the updater: React may invoke an updater
      // more than once (StrictMode in dev, rebasing under concurrent rendering),
      // which would record the same answer twice.
      const state = mcqQueueRef.current;
      if (!state || state.answeredIds.includes(question.id)) return;

      setProgress((prev) => recordAnswer(prev, question, correct));
      if (correct) {
        setCompleted((prev) => markCompletedId(prev, 'mcq', question.id));
      }
      setMcqQueue((prev) => recordAnswerInQueue(prev, question.id, correct));
    },
    [setProgress, setMcqQueue, setCompleted, mcqQueueRef]
  );

  const handleNext = useCallback(() => {
    setMcqQueue((state) => advancePass(state));
  }, [setMcqQueue]);

  const handleSkip = useCallback(
    (question) => {
      setMcqQueue((state) => skipQuestionInQueue(state, question.id));
    },
    [setMcqQueue]
  );

  const handleUnskip = useCallback(
    (questionId) => {
      setMcqQueue((state) => appendToQueueTail(state, questionId, { clearSkipped: true }));
    },
    [setMcqQueue]
  );

  const handleRestart = useCallback(() => {
    startQuiz(basePool, mode, { resetPass: true });
  }, [basePool, mode, startQuiz]);

  const handleStartWeak = useCallback(() => {
    const pool = getQuestionsForWeakTopics(starredActiveQuestions, weakTopics);
    startQuiz(pool, 'weak', { resetPass: true, topics: [], difficulties: [] });
  }, [starredActiveQuestions, weakTopics, startQuiz]);

  const handleStartReview = useCallback(() => {
    const pool = getQuestionsForReview(starredActiveQuestions, progress);
    startQuiz(pool, 'review', { resetPass: true, topics: [], difficulties: [] });
  }, [starredActiveQuestions, progress, startQuiz]);

  const handleBackToAll = useCallback(() => {
    startQuiz(filteredQuestions, 'all', { resetPass: true, topics: selectedTopics, difficulties: selectedDifficulties });
  }, [filteredQuestions, selectedTopics, selectedDifficulties, startQuiz]);

  const handleOpenQuestion = useCallback(
    (questionId) => {
      setViewMode('quiz');
      setMcqQueue((state) => {
        if (!state) return state;
        const question = starredActiveQuestions.find((q) => q.id === questionId);
        if (!question) return state;
        return openQuestionInQueue(state, questionId, { clearSkipped: true });
      });
    },
    [starredActiveQuestions, setMcqQueue, setViewMode]
  );

  const handleOpenCodingQuestion = useCallback(
    (questionId) => {
      setCodingQueue((state) => {
        if (!state?.queueIds?.length) {
          const item = activeCodingQuestions.find((q) => q.id === questionId);
          if (!item) return state;
          return createPracticeQueue([item]);
        }
        const item = activeCodingQuestions.find((q) => q.id === questionId);
        if (!item) return state;
        return openQuestionInQueue(state, questionId);
      });
    },
    [activeCodingQuestions, setCodingQueue]
  );

  const handleOpenOutputQuestion = useCallback(
    (questionId) => {
      setOutputQueue((state) => {
        if (!state?.queueIds?.length) {
          const item = activeOutputQuestions.find((q) => q.id === questionId);
          if (!item) return state;
          return createPracticeQueue([item]);
        }
        const item = activeOutputQuestions.find((q) => q.id === questionId);
        if (!item) return state;
        return openQuestionInQueue(state, questionId);
      });
    },
    [activeOutputQuestions, setOutputQueue]
  );

  const handleSearchSelect = useCallback(
    (result) => {
      const { section, id } = result;

      if (section === 'learnings') {
        setSection('learnings', { learningId: id });
        return;
      }
      if (section === 'react-learnings') {
        setSection('react-learnings', { learningId: id });
        return;
      }
      if (section === 'react-guide') {
        setSection('react-guide', { learningId: id });
        return;
      }
      if (section === 'interview-prep') {
        setSection('interview-prep', { learningId: id });
        return;
      }
      if (section === 'test-prep') {
        setSection('test-prep', { learningId: id });
        return;
      }
      if (section === 'advanced-react') {
        setSection('advanced-react', { learningId: id });
        return;
      }
      if (section === 'acceldata-prep') {
        setSection('acceldata-prep', { learningId: id });
        return;
      }
      if (section === 'css') {
        setSection('css', { learningId: id });
        return;
      }
      if (section === 'browser') {
        setSection('browser', { learningId: id });
        return;
      }
      if (section === 'system-design') {
        setSection('system-design', { learningId: id });
        return;
      }
      if (section === 'algorithm') {
        setSection('algorithm', { learningId: id });
        return;
      }
      if (section === 'blind75') {
        setSection('blind75', { learningId: id });
        return;
      }
      if (section === 'mcq') {
        setSection('mcq', { itemId: id });
        setMcqQueue((state) => {
          const question = activeQuestions.find((q) => q.id === id);
          if (!question) return state;
          if (!getPracticeQueueQuestionIds(state).length) {
            return createPracticeQueue([question], { mode: 'all', topics: [], difficulties: [] });
          }
          return openQuestionInQueue(state, id, { clearSkipped: true });
        });
        return;
      }
      if (section === 'coding') {
        setSection('coding', { itemId: id });
        handleOpenCodingQuestion(id);
        return;
      }
      if (section === 'output') {
        setSection('output', { itemId: id });
        handleOpenOutputQuestion(id);
      }
    },
    [
      activeQuestions,
      handleOpenCodingQuestion,
      handleOpenOutputQuestion,
      getPracticeQueueQuestionIds,
      setMcqQueue,
      setSection,
    ]
  );

  // Markdown bodies can link to any item in the app (e.g. "/coding/13"). Reuse the
  // search-result navigation rather than duplicating the per-section routing rules.
  const handleInternalLink = useCallback(
    (href) => {
      const target = parseRoute(href);
      const id = target.learningId ?? target.itemId;
      if (id == null) {
        setSection(target.section, { viewMode: target.viewMode });
        return;
      }
      handleSearchSelect({ section: target.section, id });
    },
    [handleSearchSelect, setSection]
  );

  // A pasted or reloaded "/coding/13" has to promote that question once the data
  // has loaded. Queue-backed sections cannot derive the item from the URL alone.
  const deepLinkAppliedRef = useRef(false);
  useEffect(() => {
    if (loading || deepLinkAppliedRef.current) return;
    if (route.itemId == null) return;
    if (!['coding', 'output', 'mcq'].includes(route.section)) return;

    deepLinkAppliedRef.current = true;
    handleSearchSelect({ section: route.section, id: route.itemId });
  }, [loading, route.section, route.itemId, handleSearchSelect]);

  const handleToggleStar = useCallback(
    (section, id) => {
      setStarred((prev) => toggleStarId(prev, section, id));
    },
    [setStarred]
  );

  const handleToggleCompleted = useCallback(
    (section, id) => {
      setCompleted((prev) => toggleCompletedId(prev, section, id));
    },
    [setCompleted]
  );

  const handleToggleLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('learnings', orderedStarredActiveLearnings, setLearningId, completed, setCompleted),
    [orderedStarredActiveLearnings, setLearningId, completed, setCompleted]
  );
  const handleToggleReactLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('react-learnings', orderedStarredActiveReactLearnings, setReactLearningId, completed, setCompleted),
    [orderedStarredActiveReactLearnings, setReactLearningId, completed, setCompleted]
  );
  const handleToggleReactGuideCompleted = useMemo(
    () => makeLearningToggleCompleted('react-guide', orderedStarredActiveReactGuide, setReactGuideLearningId, completed, setCompleted),
    [orderedStarredActiveReactGuide, setReactGuideLearningId, completed, setCompleted]
  );

  const handleToggleInterviewPrepCompleted = useMemo(
    () => makeLearningToggleCompleted('interview-prep', orderedStarredActiveInterviewPrep, setInterviewPrepLearningId, completed, setCompleted),
    [orderedStarredActiveInterviewPrep, setInterviewPrepLearningId, completed, setCompleted]
  );

  const handleToggleTestPrepCompleted = useMemo(
    () => makeLearningToggleCompleted('test-prep', orderedStarredActiveTestPrep, setTestPrepLearningId, completed, setCompleted),
    [orderedStarredActiveTestPrep, setTestPrepLearningId, completed, setCompleted]
  );

  const handleToggleAcceldataPrepCompleted = useMemo(
    () => makeLearningToggleCompleted('acceldata-prep', orderedStarredActiveAcceldataPrep, setAcceldataPrepLearningId, completed, setCompleted),
    [orderedStarredActiveAcceldataPrep, setAcceldataPrepLearningId, completed, setCompleted]
  );

  const handleToggleCssLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('css', orderedStarredActiveCssLearnings, setCssLearningId, completed, setCompleted),
    [orderedStarredActiveCssLearnings, setCssLearningId, completed, setCompleted]
  );

  const handleToggleAdvancedReactCompleted = useMemo(
    () => makeLearningToggleCompleted('advanced-react', orderedStarredActiveAdvancedReact, setAdvancedReactLearningId, completed, setCompleted),
    [orderedStarredActiveAdvancedReact, setAdvancedReactLearningId, completed, setCompleted]
  );
  const handleToggleBrowserLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('browser', orderedStarredActiveBrowserLearnings, setBrowserLearningId, completed, setCompleted),
    [orderedStarredActiveBrowserLearnings, setBrowserLearningId, completed, setCompleted]
  );
  const handleToggleSystemDesignLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('system-design', orderedStarredActiveSystemDesignLearnings, setSystemDesignLearningId, completed, setCompleted),
    [orderedStarredActiveSystemDesignLearnings, setSystemDesignLearningId, completed, setCompleted]
  );
  const handleToggleAlgorithmLearningCompleted = useMemo(
    () => makeLearningToggleCompleted('algorithm', orderedStarredActiveAlgorithmLearnings, setAlgorithmLearningId, completed, setCompleted),
    [orderedStarredActiveAlgorithmLearnings, setAlgorithmLearningId, completed, setCompleted]
  );
  const handleToggleBlind75LearningCompleted = useMemo(
    () => makeLearningToggleCompleted('blind75', orderedStarredActiveBlind75Learnings, setBlind75LearningId, completed, setCompleted),
    [orderedStarredActiveBlind75Learnings, setBlind75LearningId, completed, setCompleted]
  );

  const getMcqPoolForMode = useCallback(
    (source, currentMode, topics, difficulties) => {
      let pool;
      if (currentMode === 'weak') {
        pool = getQuestionsForWeakTopics(source, getWeakTopics(progress, source));
      } else if (currentMode === 'review') {
        pool = getQuestionsForReview(source, progress);
      } else {
        pool = filterQuestions(source, { topics, difficulties });
      }
      return filterQuestions(pool, { topics, difficulties });
    },
    [progress]
  );

  const handleMcqStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, mcq: value }));
      const source = value ? filterStarred(activeQuestions, 'mcq', starred) : activeQuestions;
      const pool = getMcqPoolForMode(source, mode, selectedTopics, selectedDifficulties);
      startQuiz(pool, mode, { resetPass: true, topics: selectedTopics, difficulties: selectedDifficulties });
    },
    [
      setStarredFilter,
      activeQuestions,
      starred,
      getMcqPoolForMode,
      mode,
      selectedTopics,
      selectedDifficulties,
      startQuiz,
    ]
  );

  const handleLearningsStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, learnings: value }));
      if (value) {
        const nextStarredLearnings = filterStarred(activeLearnings, 'learnings', starred);
        if (
          route.learningId &&
          !nextStarredLearnings.some((item) => item.id === route.learningId) &&
          nextStarredLearnings.length > 0
        ) {
          setLearningId(nextStarredLearnings[0].id);
        }
      }
    },
    [setStarredFilter, activeLearnings, starred, route.learningId, setLearningId]
  );

  const handleReactLearningsStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'react-learnings': value }));
      if (value) {
        const nextStarred = filterStarred(activeReactLearnings, 'react-learnings', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setReactLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeReactLearnings, starred, route.learningId, setReactLearningId]
  );

  const handleReactGuideStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'react-guide': value }));
      if (value) {
        const nextStarred = filterStarred(activeReactGuide, 'react-guide', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setReactGuideLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeReactGuide, starred, route.learningId, setReactGuideLearningId]
  );

  const handleInterviewPrepStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'interview-prep': value }));
      if (value) {
        const nextStarred = filterStarred(activeInterviewPrep, 'interview-prep', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setInterviewPrepLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeInterviewPrep, starred, route.learningId, setInterviewPrepLearningId]
  );

  const handleTestPrepStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'test-prep': value }));
      if (value) {
        const nextStarred = filterStarred(activeTestPrep, 'test-prep', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setTestPrepLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeTestPrep, starred, route.learningId, setTestPrepLearningId]
  );

  const handleAcceldataPrepStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'acceldata-prep': value }));
      if (value) {
        const nextStarred = filterStarred(activeAcceldataPrep, 'acceldata-prep', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setAcceldataPrepLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeAcceldataPrep, starred, route.learningId, setAcceldataPrepLearningId]
  );

  const handleCssStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, css: value }));
      if (value) {
        const nextStarred = filterStarred(activeCssLearnings, 'css', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setCssLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeCssLearnings, starred, route.learningId, setCssLearningId]
  );

  const handleAdvancedReactStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'advanced-react': value }));
      if (value) {
        const nextStarred = filterStarred(activeAdvancedReact, 'advanced-react', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setAdvancedReactLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeAdvancedReact, starred, route.learningId, setAdvancedReactLearningId]
  );

  const handleBrowserStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, browser: value }));
      if (value) {
        const nextStarred = filterStarred(activeBrowserLearnings, 'browser', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setBrowserLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeBrowserLearnings, starred, route.learningId, setBrowserLearningId]
  );

  const handleSystemDesignStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, 'system-design': value }));
      if (value) {
        const nextStarred = filterStarred(activeSystemDesignLearnings, 'system-design', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setSystemDesignLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeSystemDesignLearnings, starred, route.learningId, setSystemDesignLearningId]
  );

  const handleAlgorithmStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, algorithm: value }));
      if (value) {
        const nextStarred = filterStarred(activeAlgorithmLearnings, 'algorithm', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setAlgorithmLearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeAlgorithmLearnings, starred, route.learningId, setAlgorithmLearningId]
  );

  const handleBlind75StarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, blind75: value }));
      if (value) {
        const nextStarred = filterStarred(activeBlind75Learnings, 'blind75', starred);
        if (
          route.learningId &&
          !nextStarred.some((item) => item.id === route.learningId) &&
          nextStarred.length > 0
        ) {
          setBlind75LearningId(nextStarred[0].id);
        }
      }
    },
    [setStarredFilter, activeBlind75Learnings, starred, route.learningId, setBlind75LearningId]
  );

  const handleCodingStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, coding: value }));
      const pool = value ? filterStarred(activeCodingQuestions, 'coding', starred) : activeCodingQuestions;
      startCodingPass({ resetPass: true, pool });
    },
    [setStarredFilter, activeCodingQuestions, starred, startCodingPass]
  );

  const handleOutputStarredFilterChange = useCallback(
    (value) => {
      setStarredFilter((prev) => ({ ...prev, output: value }));
      const pool = value ? filterStarred(activeOutputQuestions, 'output', starred) : activeOutputQuestions;
      startOutputPass({ resetPass: true, pool });
    },
    [setStarredFilter, activeOutputQuestions, starred, startOutputPass]
  );

  const handleArchiveMcq = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'mcq', question.id));
      setMcqQueue((state) => archiveFromQueue(state, question.id));
    },
    [setArchived, setMcqQueue]
  );

  const handleArchiveOutput = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'output', question.id));
      setOutputQueue((state) => archiveFromQueue(state, question.id));
    },
    [setArchived, setOutputQueue]
  );

  const handleArchiveCoding = useCallback(
    (question) => {
      setArchived((prev) => archiveId(prev, 'coding', question.id));
      setCodingQueue((state) => archiveFromQueue(state, question.id));
    },
    [setArchived, setCodingQueue]
  );

  const handleArchiveLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'learnings', learning.id));
      const nextArchived = archiveId(archived, 'learnings', learning.id);
      const nextActive = filterActive(learnings, 'learnings', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, learnings, route.learningId, setLearningId]
  );

  const handleArchiveReactLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'react-learnings', learning.id));
      const nextArchived = archiveId(archived, 'react-learnings', learning.id);
      const nextActive = filterActive(reactLearnings, 'react-learnings', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setReactLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, reactLearnings, route.learningId, setReactLearningId]
  );

  const handleArchiveReactGuide = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'react-guide', learning.id));
      const nextArchived = archiveId(archived, 'react-guide', learning.id);
      const nextActive = filterActive(reactGuide, 'react-guide', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setReactGuideLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, reactGuide, route.learningId, setReactGuideLearningId]
  );

  const handleArchiveInterviewPrep = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'interview-prep', learning.id));
      const nextArchived = archiveId(archived, 'interview-prep', learning.id);
      const nextActive = filterActive(interviewPrep, 'interview-prep', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setInterviewPrepLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, interviewPrep, route.learningId, setInterviewPrepLearningId]
  );

  const handleArchiveTestPrep = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'test-prep', learning.id));
      const nextArchived = archiveId(archived, 'test-prep', learning.id);
      const nextActive = filterActive(testPrep, 'test-prep', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setTestPrepLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, testPrep, route.learningId, setTestPrepLearningId]
  );

  const handleArchiveAcceldataPrep = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'acceldata-prep', learning.id));
      const nextArchived = archiveId(archived, 'acceldata-prep', learning.id);
      const nextActive = filterActive(acceldataPrep, 'acceldata-prep', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setAcceldataPrepLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, acceldataPrep, route.learningId, setAcceldataPrepLearningId]
  );

  const handleArchiveCssLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'css', learning.id));
      const nextArchived = archiveId(archived, 'css', learning.id);
      const nextActive = filterActive(cssLearnings, 'css', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setCssLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, cssLearnings, route.learningId, setCssLearningId]
  );

  const handleArchiveAdvancedReact = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'advanced-react', learning.id));
      const nextArchived = archiveId(archived, 'advanced-react', learning.id);
      const nextActive = filterActive(advancedReact, 'advanced-react', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setAdvancedReactLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, advancedReact, route.learningId, setAdvancedReactLearningId]
  );

  const handleArchiveBrowserLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'browser', learning.id));
      const nextArchived = archiveId(archived, 'browser', learning.id);
      const nextActive = filterActive(browserLearnings, 'browser', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setBrowserLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, browserLearnings, route.learningId, setBrowserLearningId]
  );

  const handleArchiveSystemDesignLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'system-design', learning.id));
      const nextArchived = archiveId(archived, 'system-design', learning.id);
      const nextActive = filterActive(systemDesignLearnings, 'system-design', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setSystemDesignLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, systemDesignLearnings, route.learningId, setSystemDesignLearningId]
  );

  const handleArchiveAlgorithmLearning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'algorithm', learning.id));
      const nextArchived = archiveId(archived, 'algorithm', learning.id);
      const nextActive = filterActive(algorithmLearnings, 'algorithm', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setAlgorithmLearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, algorithmLearnings, route.learningId, setAlgorithmLearningId]
  );

  const handleArchiveBlind75Learning = useCallback(
    (learning) => {
      setArchived((prev) => archiveId(prev, 'blind75', learning.id));
      const nextArchived = archiveId(archived, 'blind75', learning.id);
      const nextActive = filterActive(blind75Learnings, 'blind75', nextArchived);
      if (learning.id === route.learningId && nextActive.length > 0) {
        setBlind75LearningId(nextActive[0].id);
      }
    },
    [setArchived, archived, blind75Learnings, route.learningId, setBlind75LearningId]
  );

  const handleUnarchive = useCallback(
    (section, id) => {
      setArchived((prev) => unarchiveId(prev, section, id));
      if (section === 'mcq') {
        setMcqQueue((state) => appendToQueueTail(state, id));
      }
    },
    [setArchived, setMcqQueue]
  );

  const handleClearProgress = useCallback(() => {
    if (!window.confirm('Clear all quiz answer history? Mastered questions will stay marked.')) return;
    setProgress(EMPTY_PROGRESS);
    const pool = buildMcqPool(filteredQuestions);
    const queue = smartShuffle(pool, EMPTY_PROGRESS);
    setMcqQueue(createPracticeQueue(queue, { mode: 'all', topics: [], difficulties: [] }));
    passRecordedRef.current = false;
  }, [buildMcqPool, filteredQuestions, setProgress, setMcqQueue]);

  const handleOutputCheck = useCallback(
    (correct, question) => {
      const state = outputQueueRef.current;
      if (!state || state.answeredIds.includes(question.id)) return;

      setOutputProgress((prev) => recordOutputAnswer(prev, question, correct));
      if (correct) {
        setCompleted((prev) => markCompletedId(prev, 'output', question.id));
      }
      setOutputQueue((prev) => recordAnswerInQueue(prev, question.id, correct));
    },
    [setOutputProgress, setOutputQueue, setCompleted, outputQueueRef]
  );

  const handleOutputSkip = useCallback(
    (question) => {
      setOutputQueue((state) => skipQuestionInQueue(state, question.id));
    },
    [setOutputQueue]
  );

  const handleOutputNext = useCallback(() => {
    setOutputQueue((state) => advancePass(state));
  }, [setOutputQueue]);

  const handleOutputRestart = useCallback(() => {
    startOutputPass({ resetPass: true });
  }, [startOutputPass]);

  const handleOutputIncludeCompletedChange = useCallback(
    (value) => {
      setOutputIncludeCompleted(value);
      startOutputPass({ resetPass: true, includeCompleted: value });
    },
    [setOutputIncludeCompleted, startOutputPass]
  );

  const handleOutputClearProgress = useCallback(() => {
    if (!window.confirm('Clear all output answer history? Mastered questions will stay marked.')) return;
    setOutputProgress(EMPTY_OUTPUT_PROGRESS);
    const queue = buildOutputQuizQueue(starredActiveOutputQuestions);
    setOutputQueue(createPracticeQueue(queue));
    outputPassRecordedRef.current = false;
  }, [buildOutputQuizQueue, starredActiveOutputQuestions, setOutputProgress, setOutputQueue]);

  const handleMcqIncludeCompletedChange = useCallback(
    (value) => {
      setMcqIncludeCompleted(value);
      const pool = filterPoolByCompleted(basePool, completed, {
        includeCompleted: value,
        section: 'mcq',
      });
      const queue = smartShuffle(pool, progress);
      setMcqQueue(createPracticeQueue(queue, {
        mode,
        topics: selectedTopics,
        difficulties: selectedDifficulties,
      }));
      passRecordedRef.current = false;
    },
    [setMcqIncludeCompleted, basePool, completed, progress, mode, selectedTopics, selectedDifficulties, setMcqQueue]
  );

  const handleCodingIncludeCompletedChange = useCallback(
    (value) => {
      setCodingIncludeCompleted(value);
      startCodingPass({ resetPass: true, includeCompleted: value });
    },
    [setCodingIncludeCompleted, startCodingPass]
  );

  const handleCodingCheck = useCallback(
    (correct, question) => {
      const state = codingQueueRef.current;
      if (!state) return;

      // Derive "is this a retry?" from state rather than trusting the caller:
      // CodingChallenge remounts per question, so its local `checked` flag
      // resets and a re-solve would otherwise look like a first attempt.
      const alreadyAnswered = state.answeredIds.includes(question.id);
      const alreadyCorrect = isCompleted(question.id, 'coding', completedRef.current);

      if (alreadyAnswered) {
        // Only a wrong -> right transition changes anything.
        if (!correct || alreadyCorrect) return;
        setCodingProgress((prev) => {
          const updated = recordCodingAnswer(prev, question.id, true);
          saveCodingProgress(updated);
          return updated;
        });
        setCompleted((prev) => markCompletedId(prev, 'coding', question.id));
        setCodingQueue((prev) => markAnswerCorrectInQueue(prev, question.id));
        return;
      }

      setCodingProgress((prev) => {
        const updated = recordCodingAnswer(prev, question.id, correct);
        saveCodingProgress(updated);
        return updated;
      });
      if (correct) {
        setCompleted((prev) => markCompletedId(prev, 'coding', question.id));
      }
      setCodingQueue((prev) => recordAnswerInQueue(prev, question.id, correct));
    },
    [setCodingProgress, setCodingQueue, setCompleted, codingQueueRef, completedRef]
  );

  const handleCodingNext = useCallback(() => {
    setCodingQueue((state) => advancePass(state));
  }, [setCodingQueue]);

  const handleCodingRestart = useCallback(() => {
    startCodingPass({ resetPass: true });
  }, [startCodingPass]);

  const codingStats = useMemo(() => getCodingStats(codingProgress), [codingProgress]);

  // Cmd/Ctrl-K needs its own listener: useKeyboardShortcuts deliberately
  // ignores modified keypresses, and this must work from inside a text field.
  useEffect(() => {
    function onKeyDown(e) {
      if (!e.key) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchPaletteOpen((open) => !open);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const globalShortcuts = useMemo(
    () => ({
      '?': () => setShortcutsOpen((open) => !open),
      '/': () => setSearchPaletteOpen(true),
    }),
    []
  );
  useKeyboardShortcuts(globalShortcuts, { enabled: !searchPaletteOpen });

  function handleToggleTopic(topic) {
    const next = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic];
    restartWithFilters(next, selectedDifficulties, starredActiveQuestions, mode);
  }

  function handleToggleDifficulty(difficulty) {
    const next = selectedDifficulties.includes(difficulty)
      ? selectedDifficulties.filter((d) => d !== difficulty)
      : [...selectedDifficulties, difficulty];
    restartWithFilters(selectedTopics, next, starredActiveQuestions, mode);
  }

  function handleClearFilters() {
    restartWithFilters([], [], starredActiveQuestions, mode);
  }

  function restartWithFilters(topics, difficulties, allQuestions, currentMode) {
    let pool;
    if (currentMode === 'weak') {
      pool = getQuestionsForWeakTopics(allQuestions, getWeakTopics(progress, allQuestions));
    } else if (currentMode === 'review') {
      pool = getQuestionsForReview(allQuestions, progress);
    } else {
      pool = filterQuestions(allQuestions, { topics, difficulties });
    }

    pool = filterQuestions(pool, { topics, difficulties });

    startQuiz(pool, currentMode, { resetPass: true, topics, difficulties });
  }

  const lifetimeAccuracy = getLifetimeAccuracy(progress.stats);
  const bestPct = getBestPct(progress.sessions);
  const outputLifetimeAccuracy = getOutputLifetimeAccuracy(outputProgress.stats);
  const outputBestPct = getOutputBestPct(outputProgress.sessions);
  const outputMissedCount = getOutputMissedCount(outputProgress);

  function outputContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (outputQueueEmpty) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.output && starredActiveOutputQuestions.length === 0
                ? 'No starred output questions yet.'
                : outputIncludeCompleted
                  ? 'No output questions available in this session. Start a new quiz to continue.'
                  : 'All output questions are mastered. Turn on "Include mastered questions" to keep practicing.'}
            </p>
            <button onClick={handleOutputRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (starredActiveOutputQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.output
                ? 'No starred output questions yet.'
                : 'No output questions available.'}
            </p>
          </div>
        </div>
      );
    }

    if (activeOutputQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>No output questions available.</p>
          </div>
        </div>
      );
    }

    if (isOutputPassComplete) {
      return (
        <div className="quiz-container">
          <OutputResults
            score={outputScore}
            totalQuestions={outputPassTotal}
            sessionCount={outputProgress.sessions.length}
            bestPct={outputBestPct}
            missedCount={outputMissedCount}
            onRestart={handleOutputRestart}
          />
        </div>
      );
    }

    if (currentOutputQuestion) {
      return (
        <OutputQuizQuestion
          key={currentOutputQuestion.id}
          question={currentOutputQuestion}
          remaining={outputRemaining}
          sessionTotal={outputSessionTotal}
          score={outputScore}
          answered={outputAnswered}
          isCompleted={isCompleted(currentOutputQuestion.id, 'output', completed)}
          highlight={syntaxHighlight}
          theme={editorTheme}
          sourceUrl={outputSourceUrl}
          onCheck={handleOutputCheck}
          onNext={handleOutputNext}
          onSkip={handleOutputSkip}
          onArchive={handleArchiveOutput}
          isStarred={isStarred(currentOutputQuestion.id, 'output', starred)}
          onToggleStar={() => handleToggleStar('output', currentOutputQuestion.id)}
          onToggleCompleted={() => handleToggleCompleted('output', currentOutputQuestion.id)}
        />
      );
    }

    return null;
  }

  function codingContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (codingQueueEmpty) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.coding && starredActiveCodingQuestions.length === 0
                ? 'No starred coding challenges yet.'
                : codingIncludeCompleted
                  ? 'No coding challenges available in this session. Start a new quiz to continue.'
                  : 'All coding challenges are mastered. Turn on "Include mastered questions" to keep practicing.'}
            </p>
            <button onClick={handleCodingRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (starredActiveCodingQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {starredFilter.coding
                ? 'No starred coding challenges yet.'
                : 'No coding questions available.'}
            </p>
          </div>
        </div>
      );
    }

    if (activeCodingQuestions.length === 0) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>No coding questions available.</p>
          </div>
        </div>
      );
    }

    if (isCodingPassComplete) {
      return (
        <div className="quiz-container">
          <CodingResults
            score={codingScore}
            totalQuestions={codingPassTotal}
            sessionCount={codingProgress.sessions.length}
            bestPct={codingStats.bestPct}
            onRestart={handleCodingRestart}
          />
        </div>
      );
    }

    if (currentCodingQuestion) {
      return (
        <CodingChallenge
          key={currentCodingQuestion.id}
          question={currentCodingQuestion}
          remaining={codingRemaining}
          sessionTotal={codingSessionTotal}
          score={codingScore}
          answered={codingAnswered}
          highlight={syntaxHighlight}
          theme={editorTheme}
          onCheck={handleCodingCheck}
          onNext={handleCodingNext}
          onArchive={handleArchiveCoding}
          isStarred={isStarred(currentCodingQuestion.id, 'coding', starred)}
          onToggleStar={() => handleToggleStar('coding', currentCodingQuestion.id)}
          isCompleted={isCompleted(currentCodingQuestion.id, 'coding', completed)}
          onToggleCompleted={() => handleToggleCompleted('coding', currentCodingQuestion.id)}
        />
      );
    }

    return null;
  }

  function centerContent() {
    if (loading) {
      return <div className="quiz-container loading"><p>Loading questions...</p></div>;
    }

    if (viewMode === 'list') {
      return (
        <QuestionListView
          questions={mcqListQuestions}
          progress={progress}
          skippedIds={skippedIds}
          passState={mcqQueue}
          starredIds={starred.mcq}
          completedIds={completed.mcq}
          currentQuestionId={currentQuestion?.id ?? null}
          onOpenQuestion={handleOpenQuestion}
          onUnskip={handleUnskip}
          scopeLabel={mcqListScopeLabel}
        />
      );
    }

    if (mcqQueueEmpty) {
      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>
              {mcqIncludeCompleted
                ? 'No questions available in this pass. Start a new quiz to continue.'
                : 'All questions are mastered. Turn on "Include mastered questions" to keep practicing.'}
            </p>
            <button onClick={handleRestart}>Start new quiz</button>
          </div>
        </div>
      );
    }

    if (basePool.length === 0) {
      const emptyMessage =
        starredFilter.mcq && starredActiveQuestions.length === 0
          ? 'No starred questions yet.'
          : mode === 'weak'
            ? 'Not enough data for weak-topic practice yet. Answer more questions first.'
            : mode === 'review'
              ? 'No missed questions to review. Great job!'
              : starredFilter.mcq
                ? 'No starred questions match the selected filters.'
                : 'No questions match the selected filters.';

      return (
        <div className="quiz-container">
          <div className="filtered-empty">
            <p>{emptyMessage}</p>
            {mode !== 'all' ? (
              <button onClick={handleBackToAll}>
                Back to all questions
              </button>
            ) : (
              <button onClick={handleClearFilters}>Clear filters</button>
            )}
          </div>
        </div>
      );
    }

    if (isPassComplete) {
      return (
        <div className="quiz-container">
          <Results
            score={score}
            totalQuestions={passTotal}
            sessionCount={progress.sessions.length}
            bestPct={bestPct}
            missedCount={missedCount}
            onRestart={handleRestart}
            onReviewMistakes={handleStartReview}
          />
        </div>
      );
    }

    if (currentQuestion) {
      return (
        <QuizQuestion
          key={currentQuestion.id}
          question={currentQuestion}
          remaining={remaining}
          sessionTotal={sessionTotal}
          score={score}
          answered={answered}
          highlight={syntaxHighlight}
          theme={editorTheme}
          onPick={handlePick}
          onNext={handleNext}
          onSkip={handleSkip}
          onArchive={handleArchiveMcq}
          isStarred={isStarred(currentQuestion.id, 'mcq', starred)}
          onToggleStar={() => handleToggleStar('mcq', currentQuestion.id)}
          isCompleted={isCompleted(currentQuestion.id, 'mcq', completed)}
          onToggleCompleted={() => handleToggleCompleted('mcq', currentQuestion.id)}
        />
      );
    }

    return null;
  }

  /* One row per nav entry, in the shape the rail wants: `{ done, total }`
     keyed by section id. Previously this travelled as twenty-four separate
     count props, which meant every new section touched App, Sidebar and the
     prop list in between. */
  const navCounts = useMemo(
    () => ({
      'acceldata-prep': {
        done: acceldataPrepCompletedCount,
        total: sectionCount('acceldata-prep', activeAcceldataPrep),
      },
      mcq: { done: mcqCompletedCount, total: activeQuestions.length },
      learnings: {
        done: learningsCompletedCount,
        total: sectionCount('learnings', activeLearnings),
      },
      css: { done: cssCompletedCount, total: sectionCount('css', activeCssLearnings) },
      'react-learnings': {
        done: reactLearningsCompletedCount,
        total: sectionCount('react-learnings', activeReactLearnings),
      },
      'react-guide': {
        done: reactGuideCompletedCount,
        total: sectionCount('react-guide', activeReactGuide),
      },
      'advanced-react': {
        done: advancedReactCompletedCount,
        total: sectionCount('advanced-react', activeAdvancedReact),
      },
      browser: {
        done: browserCompletedCount,
        total: sectionCount('browser', activeBrowserLearnings),
      },
      'system-design': {
        done: systemDesignCompletedCount,
        total: sectionCount('system-design', activeSystemDesignLearnings),
      },
      algorithm: {
        done: algorithmCompletedCount,
        total: sectionCount('algorithm', activeAlgorithmLearnings),
      },
      blind75: {
        done: blind75CompletedCount,
        total: sectionCount('blind75', activeBlind75Learnings),
      },
      coding: { done: codingCompletedCount, total: activeCodingQuestions.length },
      output: { done: outputCompletedCount, total: activeOutputQuestions.length },
      archived: { done: 0, total: archivedCount },
      'interview-prep': {
        done: interviewPrepCompletedCount,
        total: sectionCount('interview-prep', activeInterviewPrep),
      },
      'test-prep': {
        done: testPrepCompletedCount,
        total: sectionCount('test-prep', activeTestPrep),
      },
    }),
    [
      acceldataPrepCompletedCount, activeAcceldataPrep,
      mcqCompletedCount, activeQuestions.length,
      learningsCompletedCount, activeLearnings, cssCompletedCount, activeCssLearnings,
      reactLearningsCompletedCount, activeReactLearnings,
      reactGuideCompletedCount, activeReactGuide,
      advancedReactCompletedCount, activeAdvancedReact,
      browserCompletedCount, activeBrowserLearnings,
      systemDesignCompletedCount, activeSystemDesignLearnings,
      algorithmCompletedCount, activeAlgorithmLearnings,
      blind75CompletedCount, activeBlind75Learnings,
      codingCompletedCount, activeCodingQuestions.length,
      outputCompletedCount, activeOutputQuestions.length,
      archivedCount,
      interviewPrepCompletedCount, activeInterviewPrep,
      testPrepCompletedCount, activeTestPrep,
      sectionCount,
    ],
  );

  /* Streak is stored per section. What belongs in the top bar is the
     union — studying anything today keeps the run alive. */
  const streak = useMemo(
    () => combinedStreak([progress.stats, outputProgress.stats, codingProgress.stats]),
    [progress.stats, outputProgress.stats, codingProgress.stats],
  );

  const mcqPoolCount =
    selectedTopics.length > 0 || selectedDifficulties.length > 0 || starredFilter.mcq
      ? filteredQuestions.length
      : activeQuestions.length;

  const sectionMeta = SECTIONS[activeSection];
  const topbarMeta = sectionMeta?.subtitle
    ? sectionMeta.subtitle(
        activeSection === 'mcq' ? mcqPoolCount : (navCounts[activeSection]?.total ?? 0),
      )
    : null;

  return (
    <>
      <CommandPalette
        open={searchPaletteOpen}
        docs={searchDocs}
        onClose={() => setSearchPaletteOpen(false)}
        onSelect={handleSearchSelect}
      />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <Layout
      mobileProgress={
        <MobileProgressBar
          lifetimeAccuracy={lifetimeAccuracy}
          sessionCount={progress.sessions.length}
          bestPct={bestPct}
          missedCount={missedCount}
          mode={mode}
          onReviewMistakes={handleStartReview}
          onBackToAll={handleBackToAll}
          theme={theme}
          onToggleTheme={toggleTheme}
          editorTheme={editorTheme}
          onToggleEditorTheme={toggleEditorTheme}
        />
      }
      topbar={
        <TopBar
          title={sectionLabel(activeSection)}
          meta={topbarMeta}
          streakDays={streak.days}
          streakLive={streak.playedToday}
          onOpenSearch={() => setSearchPaletteOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          actions={
            activeSection === 'mcq' ? (
              <div className="view-toggle" role="group" aria-label="View mode">
                <button
                  type="button"
                  aria-pressed={viewMode === 'quiz'}
                  className={`view-toggle-btn${viewMode === 'quiz' ? ' active' : ''}`}
                  onClick={() => setViewMode('quiz')}
                >
                  Quiz
                </button>
                <button
                  type="button"
                  aria-pressed={viewMode === 'list'}
                  className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  List
                </button>
              </div>
            ) : null
          }
        />
      }
      sidebar={
          <Sidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            sectionCategory={sectionCategory}
            onSectionCategoryChange={setSectionCategory}
            counts={navCounts}
            onHome={() => handleSectionChange('overview')}
            lifetimeAccuracy={lifetimeAccuracy}
            sessionCount={progress.sessions.length}
            bestPct={bestPct}
            missedCount={missedCount}
            mode={mode}
            onReviewMistakes={handleStartReview}
            onBackToAll={handleBackToAll}
            onClearProgress={handleClearProgress}
            mcqIncludeCompleted={mcqIncludeCompleted}
            onMcqIncludeCompletedChange={handleMcqIncludeCompletedChange}
            codingSessionCount={codingProgress.sessions.length}
            codingBestPct={codingStats.bestPct}
            codingIncludeCompleted={codingIncludeCompleted}
            onCodingIncludeCompletedChange={handleCodingIncludeCompletedChange}
            onCodingRestart={handleCodingRestart}
            outputLifetimeAccuracy={outputLifetimeAccuracy}
            outputSessionCount={outputProgress.sessions.length}
            outputBestPct={outputBestPct}
            outputMissedCount={outputMissedCount}
            outputIncludeCompleted={outputIncludeCompleted}
            onOutputIncludeCompletedChange={handleOutputIncludeCompletedChange}
            onOutputRestart={handleOutputRestart}
            onOutputClearProgress={handleOutputClearProgress}
            theme={theme}
            onToggleTheme={toggleTheme}
            editorTheme={editorTheme}
            onToggleEditorTheme={toggleEditorTheme}
            syntaxHighlight={syntaxHighlight}
            onToggleHighlight={() => setSyntaxHighlight((v) => !v)}
          />
        }
        center={
          <div className="center-with-toggle">
            {/* A code-split dataset that has not arrived yet would otherwise
                render as "No learnings available yet", which reads as an empty
                section rather than a pending one. */}
            {activeSection === 'overview' ? (
              <Dashboard
                counts={navCounts}
                streak={streak}
                mcqAccuracy={lifetimeAccuracy}
                mcqAnswered={progress.stats.totalAnswered}
                outputAccuracy={outputLifetimeAccuracy}
                missedCount={missedCount}
                onOpenSection={handleSectionChange}
                onReviewMistakes={handleStartReview}
              />
            ) : LEARNING_LOADERS[activeSection] && !loadedSections[activeSection] ? (
              <Skeleton />
            ) : activeSection === 'learnings' ? (
              <LearningsView
                learning={selectedLearning}
                onArchive={handleArchiveLearning}
                isStarred={selectedLearning ? isStarred(selectedLearning.id, 'learnings', starred) : false}
                onToggleStar={() => selectedLearning && handleToggleStar('learnings', selectedLearning.id)}
                isCompleted={selectedLearning ? isCompleted(selectedLearning.id, 'learnings', completed) : false}
                onToggleCompleted={() => selectedLearning && handleToggleLearningCompleted(selectedLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'react-learnings' ? (
              <LearningsView
                learning={selectedReactLearning}
                onArchive={handleArchiveReactLearning}
                isStarred={selectedReactLearning ? isStarred(selectedReactLearning.id, 'react-learnings', starred) : false}
                onToggleStar={() => selectedReactLearning && handleToggleStar('react-learnings', selectedReactLearning.id)}
                isCompleted={selectedReactLearning ? isCompleted(selectedReactLearning.id, 'react-learnings', completed) : false}
                onToggleCompleted={() => selectedReactLearning && handleToggleReactLearningCompleted(selectedReactLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'interview-prep' ? (
              <LearningsView
                learning={selectedInterviewPrepEntry}
                onArchive={handleArchiveInterviewPrep}
                isStarred={selectedInterviewPrepEntry ? isStarred(selectedInterviewPrepEntry.id, 'interview-prep', starred) : false}
                onToggleStar={() => selectedInterviewPrepEntry && handleToggleStar('interview-prep', selectedInterviewPrepEntry.id)}
                isCompleted={selectedInterviewPrepEntry ? isCompleted(selectedInterviewPrepEntry.id, 'interview-prep', completed) : false}
                onToggleCompleted={() => selectedInterviewPrepEntry && handleToggleInterviewPrepCompleted(selectedInterviewPrepEntry.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'test-prep' ? (
              <LearningsView
                learning={selectedTestPrepEntry}
                onArchive={handleArchiveTestPrep}
                isStarred={selectedTestPrepEntry ? isStarred(selectedTestPrepEntry.id, 'test-prep', starred) : false}
                onToggleStar={() => selectedTestPrepEntry && handleToggleStar('test-prep', selectedTestPrepEntry.id)}
                isCompleted={selectedTestPrepEntry ? isCompleted(selectedTestPrepEntry.id, 'test-prep', completed) : false}
                onToggleCompleted={() => selectedTestPrepEntry && handleToggleTestPrepCompleted(selectedTestPrepEntry.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'acceldata-prep' ? (
              <LearningsView
                learning={selectedAcceldataPrep}
                onArchive={handleArchiveAcceldataPrep}
                isStarred={selectedAcceldataPrep ? isStarred(selectedAcceldataPrep.id, 'acceldata-prep', starred) : false}
                onToggleStar={() => selectedAcceldataPrep && handleToggleStar('acceldata-prep', selectedAcceldataPrep.id)}
                isCompleted={selectedAcceldataPrep ? isCompleted(selectedAcceldataPrep.id, 'acceldata-prep', completed) : false}
                onToggleCompleted={() => selectedAcceldataPrep && handleToggleAcceldataPrepCompleted(selectedAcceldataPrep.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'css' ? (
              <LearningsView
                learning={selectedCssLearning}
                onArchive={handleArchiveCssLearning}
                isStarred={selectedCssLearning ? isStarred(selectedCssLearning.id, 'css', starred) : false}
                onToggleStar={() => selectedCssLearning && handleToggleStar('css', selectedCssLearning.id)}
                isCompleted={selectedCssLearning ? isCompleted(selectedCssLearning.id, 'css', completed) : false}
                onToggleCompleted={() => selectedCssLearning && handleToggleCssLearningCompleted(selectedCssLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'advanced-react' ? (
              <LearningsView
                learning={selectedAdvancedReactEntry}
                onArchive={handleArchiveAdvancedReact}
                isStarred={selectedAdvancedReactEntry ? isStarred(selectedAdvancedReactEntry.id, 'advanced-react', starred) : false}
                onToggleStar={() => selectedAdvancedReactEntry && handleToggleStar('advanced-react', selectedAdvancedReactEntry.id)}
                isCompleted={selectedAdvancedReactEntry ? isCompleted(selectedAdvancedReactEntry.id, 'advanced-react', completed) : false}
                onToggleCompleted={() => selectedAdvancedReactEntry && handleToggleAdvancedReactCompleted(selectedAdvancedReactEntry.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'react-guide' ? (
              <LearningsView
                learning={selectedReactGuideEntry}
                onArchive={handleArchiveReactGuide}
                isStarred={selectedReactGuideEntry ? isStarred(selectedReactGuideEntry.id, 'react-guide', starred) : false}
                onToggleStar={() => selectedReactGuideEntry && handleToggleStar('react-guide', selectedReactGuideEntry.id)}
                isCompleted={selectedReactGuideEntry ? isCompleted(selectedReactGuideEntry.id, 'react-guide', completed) : false}
                onToggleCompleted={() => selectedReactGuideEntry && handleToggleReactGuideCompleted(selectedReactGuideEntry.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'browser' ? (
              <LearningsView
                learning={selectedBrowserLearning}
                onArchive={handleArchiveBrowserLearning}
                isStarred={selectedBrowserLearning ? isStarred(selectedBrowserLearning.id, 'browser', starred) : false}
                onToggleStar={() => selectedBrowserLearning && handleToggleStar('browser', selectedBrowserLearning.id)}
                isCompleted={selectedBrowserLearning ? isCompleted(selectedBrowserLearning.id, 'browser', completed) : false}
                onToggleCompleted={() => selectedBrowserLearning && handleToggleBrowserLearningCompleted(selectedBrowserLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
                onNavigate={handleInternalLink}
              />
            ) : activeSection === 'system-design' ? (
              <LearningsView
                learning={selectedSystemDesignLearning}
                onArchive={handleArchiveSystemDesignLearning}
                isStarred={selectedSystemDesignLearning ? isStarred(selectedSystemDesignLearning.id, 'system-design', starred) : false}
                onToggleStar={() => selectedSystemDesignLearning && handleToggleStar('system-design', selectedSystemDesignLearning.id)}
                isCompleted={selectedSystemDesignLearning ? isCompleted(selectedSystemDesignLearning.id, 'system-design', completed) : false}
                onToggleCompleted={() => selectedSystemDesignLearning && handleToggleSystemDesignLearningCompleted(selectedSystemDesignLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'algorithm' ? (
              <LearningsView
                learning={selectedAlgorithmLearning}
                onArchive={handleArchiveAlgorithmLearning}
                isStarred={selectedAlgorithmLearning ? isStarred(selectedAlgorithmLearning.id, 'algorithm', starred) : false}
                onToggleStar={() => selectedAlgorithmLearning && handleToggleStar('algorithm', selectedAlgorithmLearning.id)}
                isCompleted={selectedAlgorithmLearning ? isCompleted(selectedAlgorithmLearning.id, 'algorithm', completed) : false}
                onToggleCompleted={() => selectedAlgorithmLearning && handleToggleAlgorithmLearningCompleted(selectedAlgorithmLearning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'blind75' ? (
              <LearningsView
                learning={selectedBlind75Learning}
                onArchive={handleArchiveBlind75Learning}
                isStarred={selectedBlind75Learning ? isStarred(selectedBlind75Learning.id, 'blind75', starred) : false}
                onToggleStar={() => selectedBlind75Learning && handleToggleStar('blind75', selectedBlind75Learning.id)}
                isCompleted={selectedBlind75Learning ? isCompleted(selectedBlind75Learning.id, 'blind75', completed) : false}
                onToggleCompleted={() => selectedBlind75Learning && handleToggleBlind75LearningCompleted(selectedBlind75Learning.id)}
                highlight={syntaxHighlight}
                theme={editorTheme}
              />
            ) : activeSection === 'archived' ? (
              <ArchivedView
                archived={archived}
                interviewPrep={interviewPrep}
                testPrep={testPrep}
                questions={questions}
                learnings={learnings}
                reactLearnings={reactLearnings}
                reactGuide={reactGuide}
                advancedReact={advancedReact}
                acceldataPrep={acceldataPrep}
                cssLearnings={cssLearnings}
                browserLearnings={browserLearnings}
                systemDesignLearnings={systemDesignLearnings}
                algorithmLearnings={algorithmLearnings}
                blind75Learnings={blind75Learnings}
                codingQuestions={codingQuestions}
                outputQuestions={outputQuestions}
                onUnarchive={handleUnarchive}
              />
            ) : activeSection === 'coding' ? (
              codingContent()
            ) : activeSection === 'output' ? (
              outputContent()
            ) : (
              centerContent()
            )}
          </div>
        }
        panel={
          activeSection === 'overview' ? null : activeSection === 'archived' ? (
            <div className="topics-panel archived-panel">
              <div className="panel-header">
                <span className="panel-header-title">Archived</span>
                <span className="panel-count">{archivedCount}</span>
              </div>
              <p className="panel-note">
                Archived items are hidden from quizzes and lists until you unarchive them.
              </p>
            </div>
          ) : activeSection === 'learnings' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred.learnings}
                completedIds={completed.learnings}
                activeItem={selectedLearning}
                learnings={orderedStarredActiveLearnings}
                selectedLearningId={selectedLearning?.id ?? null}
                sectionKey="learnings"
                groupBy="module"
                starredOnly={starredFilter.learnings}
                starredCount={learningsStarredCount}
                onStarredOnlyChange={handleLearningsStarredFilterChange}
                onSelect={setLearningId}
                title="Javascript learnings"
              />
            </div>
          ) : activeSection === 'react-learnings' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['react-learnings']}
                completedIds={completed['react-learnings']}
                activeItem={selectedReactLearning}
                learnings={orderedStarredActiveReactLearnings}
                selectedLearningId={selectedReactLearning?.id ?? null}
                sectionKey="react-learnings"
                starredOnly={starredFilter['react-learnings']}
                starredCount={reactLearningsStarredCount}
                onStarredOnlyChange={handleReactLearningsStarredFilterChange}
                onSelect={setReactLearningId}
                title="React learnings"
              />
            </div>
          ) : activeSection === 'interview-prep' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['interview-prep']}
                completedIds={completed['interview-prep']}
                activeItem={selectedInterviewPrepEntry}
                learnings={orderedStarredActiveInterviewPrep}
                selectedLearningId={selectedInterviewPrepEntry?.id ?? null}
                sectionKey="interview-prep"
                starredOnly={starredFilter['interview-prep']}
                starredCount={interviewPrepStarredCount}
                onStarredOnlyChange={handleInterviewPrepStarredFilterChange}
                onSelect={setInterviewPrepLearningId}
                title="1-Day Interview Prep"
              />
            </div>
          ) : activeSection === 'test-prep' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['test-prep']}
                completedIds={completed['test-prep']}
                activeItem={selectedTestPrepEntry}
                learnings={orderedStarredActiveTestPrep}
                selectedLearningId={selectedTestPrepEntry?.id ?? null}
                sectionKey="test-prep"
                starredOnly={starredFilter['test-prep']}
                starredCount={testPrepStarredCount}
                onStarredOnlyChange={handleTestPrepStarredFilterChange}
                onSelect={setTestPrepLearningId}
                title="HackerEarth Frontend Test Prep"
              />
            </div>
          ) : activeSection === 'acceldata-prep' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['acceldata-prep']}
                completedIds={completed['acceldata-prep']}
                activeItem={selectedAcceldataPrep}
                learnings={orderedStarredActiveAcceldataPrep}
                selectedLearningId={selectedAcceldataPrep?.id ?? null}
                sectionKey="acceldata-prep"
                starredOnly={starredFilter['acceldata-prep']}
                starredCount={acceldataPrepStarredCount}
                onStarredOnlyChange={handleAcceldataPrepStarredFilterChange}
                onSelect={setAcceldataPrepLearningId}
                title="Acceldata Prep"
              />
            </div>
          ) : activeSection === 'css' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred.css}
                completedIds={completed.css}
                activeItem={selectedCssLearning}
                learnings={orderedStarredActiveCssLearnings}
                selectedLearningId={selectedCssLearning?.id ?? null}
                sectionKey="css"
                starredOnly={starredFilter.css}
                starredCount={cssStarredCount}
                onStarredOnlyChange={handleCssStarredFilterChange}
                onSelect={setCssLearningId}
                title="CSS"
              />
            </div>
          ) : activeSection === 'advanced-react' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['advanced-react']}
                completedIds={completed['advanced-react']}
                activeItem={selectedAdvancedReactEntry}
                learnings={orderedStarredActiveAdvancedReact}
                selectedLearningId={selectedAdvancedReactEntry?.id ?? null}
                sectionKey="advanced-react"
                starredOnly={starredFilter['advanced-react']}
                starredCount={advancedReactStarredCount}
                onStarredOnlyChange={handleAdvancedReactStarredFilterChange}
                onSelect={setAdvancedReactLearningId}
                title="Advanced React Course"
              />
            </div>
          ) : activeSection === 'react-guide' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['react-guide']}
                completedIds={completed['react-guide']}
                activeItem={selectedReactGuideEntry}
                learnings={orderedStarredActiveReactGuide}
                selectedLearningId={selectedReactGuideEntry?.id ?? null}
                sectionKey="react-guide"
                starredOnly={starredFilter['react-guide']}
                starredCount={reactGuideStarredCount}
                onStarredOnlyChange={handleReactGuideStarredFilterChange}
                onSelect={setReactGuideLearningId}
                title="React Interview Mastery Guide"
              />
            </div>
          ) : activeSection === 'browser' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred.browser}
                completedIds={completed.browser}
                activeItem={selectedBrowserLearning}
                learnings={orderedStarredActiveBrowserLearnings}
                selectedLearningId={selectedBrowserLearning?.id ?? null}
                sectionKey="browser"
                groupBy="module"
                starredOnly={starredFilter.browser}
                starredCount={browserStarredCount}
                onStarredOnlyChange={handleBrowserStarredFilterChange}
                onSelect={setBrowserLearningId}
                title="Browser & Web Platform"
              />
            </div>
          ) : activeSection === 'system-design' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred['system-design']}
                completedIds={completed['system-design']}
                activeItem={selectedSystemDesignLearning}
                learnings={orderedStarredActiveSystemDesignLearnings}
                selectedLearningId={selectedSystemDesignLearning?.id ?? null}
                sectionKey="system-design"
                groupBy="module"
                starredOnly={starredFilter['system-design']}
                starredCount={systemDesignStarredCount}
                onStarredOnlyChange={handleSystemDesignStarredFilterChange}
                onSelect={setSystemDesignLearningId}
                title="System Design"
              />
            </div>
          ) : activeSection === 'algorithm' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred.algorithm}
                completedIds={completed.algorithm}
                activeItem={selectedAlgorithmLearning}
                learnings={orderedStarredActiveAlgorithmLearnings}
                selectedLearningId={selectedAlgorithmLearning?.id ?? null}
                sectionKey="algorithm"
                starredOnly={starredFilter.algorithm}
                starredCount={algorithmStarredCount}
                onStarredOnlyChange={handleAlgorithmStarredFilterChange}
                onSelect={setAlgorithmLearningId}
                title="Algorithm"
              />
            </div>
          ) : activeSection === 'blind75' ? (
            <div className="topics-panel learnings-panel">
              <LearningsPanel
                starredIds={starred.blind75}
                completedIds={completed.blind75}
                activeItem={selectedBlind75Learning}
                learnings={orderedStarredActiveBlind75Learnings}
                selectedLearningId={selectedBlind75Learning?.id ?? null}
                sectionKey="blind75"
                starredOnly={starredFilter.blind75}
                starredCount={blind75StarredCount}
                onStarredOnlyChange={handleBlind75StarredFilterChange}
                onSelect={setBlind75LearningId}
                groupBy="module"
                showDifficulty
                title="Blind 75"
              />
            </div>
          ) : activeSection === 'coding' ? (
            <div className="topics-panel coding-panel">
              <CodingPanel
                questions={starredActiveCodingQuestions}
                starredIds={starred.coding}
                completedIds={completed.coding}
                selectedQuestionId={currentCodingQuestion?.id ?? null}
                starredOnly={starredFilter.coding}
                starredCount={codingStarredCount}
                onStarredOnlyChange={handleCodingStarredFilterChange}
                onSelect={handleOpenCodingQuestion}
                title="Javascript Coding"
              />
            </div>
          ) : activeSection === 'output' ? (
            <div className="topics-panel output-panel">
              {/* The output panel used to be a paragraph and a checkbox in
                  a 300px column, while every other section listed its
                  items there. Same list, so the same component. */}
              <PanelList
                items={starredActiveOutputQuestions}
                title="Javascript output"
                selectedId={currentOutputQuestion?.id ?? null}
                onSelect={handleOpenOutputQuestion}
                starredIds={starred.output}
                completedIds={completed.output}
                starredOnly={starredFilter.output}
                starredCount={outputStarredCount}
                onStarredOnlyChange={handleOutputStarredFilterChange}
                getLabel={outputQuestionLabel}
                monoLabels
                emptyLabel="No output questions yet"
                emptyStarredLabel="No starred questions yet."
                searchPlaceholder="Filter questions…"
              />
            </div>
          ) : (
            <div className="topics-panel">
              <FilterPanel
                questions={starredFilter.mcq ? starredActiveQuestions : activeQuestions}
                progress={progress}
                completedIds={completed.mcq}
                selectedTopics={selectedTopics}
                selectedDifficulties={selectedDifficulties}
                starredOnly={starredFilter.mcq}
                starredCount={mcqStarredCount}
                onStarredOnlyChange={handleMcqStarredFilterChange}
                onToggleTopic={handleToggleTopic}
                onToggleDifficulty={handleToggleDifficulty}
                onClear={handleClearFilters}
              />
            </div>
          )
        }
        sidebarCollapsed={sidebarCollapsed}
        panelCollapsed={panelCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        onTogglePanel={() => setPanelCollapsed((v) => !v)}
      />
    </>
  );
}
