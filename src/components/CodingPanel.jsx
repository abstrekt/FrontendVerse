import PanelList from './PanelList';

/** Coding challenges: same list as learnings, plus a difficulty mark. */
export default function CodingPanel({
  questions,
  starredIds = [],
  completedIds = [],
  selectedQuestionId,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  title = 'Javascript Coding',
}) {
  return (
    <PanelList
      items={questions}
      title={title}
      selectedId={selectedQuestionId}
      onSelect={onSelect}
      starredIds={starredIds}
      completedIds={completedIds}
      starredOnly={starredOnly}
      starredCount={starredCount}
      onStarredOnlyChange={onStarredOnlyChange}
      showDifficulty
      emptyLabel="No challenges yet"
      emptyStarredLabel="No starred challenges yet."
      searchPlaceholder="Filter challenges…"
    />
  );
}
