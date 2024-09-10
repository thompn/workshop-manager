import React from 'react';
import StoryCard from './StoryCard';

const StoryList = ({ stories, onUpdateStory, onDeleteStory }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories.map(story => (
        <StoryCard
          key={story.id}
          story={story}
          onUpdateStory={onUpdateStory}
          onDeleteStory={onDeleteStory}
        />
      ))}
    </div>
  );
};

export default StoryList;