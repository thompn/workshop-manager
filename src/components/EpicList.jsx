import React from 'react';
import EpicCard from './EpicCard';

const EpicList = ({ epics, onUpdateEpic, onDeleteEpic, onAddStory }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {epics.map(epic => (
        <EpicCard
          key={epic.id}
          epic={epic}
          onUpdateEpic={onUpdateEpic}
          onDeleteEpic={onDeleteEpic}
          onAddStory={onAddStory}
        />
      ))}
    </div>
  );
};

export default EpicList;