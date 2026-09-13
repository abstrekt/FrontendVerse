import PanelList from './PanelList';

/** Learnings-shaped sections: a flat list of articles, selected by id. */
export default function LearningsPanel({
  learnings,
  starredIds = [],
  completedIds = [],
  selectedLearningId,
  starredOnly = false,
  starredCount = 0,
  onStarredOnlyChange,
  onSelect,
  groupBy = null,
  showDifficulty = false,
  title = 'Javascript learnings',
}) {
  return (
    <PanelList
      items={learnings}
      title={title}
      selectedId={selectedLearningId}
      onSelect={onSelect}
      groupBy={groupBy}
      showDifficulty={showDifficulty}
      starredIds={starredIds}
      completedIds={completedIds}
      starredOnly={starredOnly}
      starredCount={starredCount}
      onStarredOnlyChange={onStarredOnlyChange}
      emptyLabel="No learnings yet"
      emptyStarredLabel="No starred learnings yet."
      searchPlaceholder="Filter learnings…"
    />
  );
}
