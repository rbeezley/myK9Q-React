// src/pages/TVRunOrder/components/TVResults.tsx
import { PodiumCard } from '../../../components/podium';
import type { TVCompletedClass } from '../hooks/useTVResultsData';
import './TVResults.css';

interface TVResultsProps {
  classes: TVCompletedClass[];
}

export function TVResults({ classes }: TVResultsProps) {
  // Show up to 4 results at a time
  const visibleClasses = classes.slice(0, 4);

  return (
    <div className="tv-results">
      <div className="tv-results__header">
        <h2>Recent Results</h2>
      </div>
      <div className="tv-results__grid">
        {visibleClasses.map((cls) => (
          <div key={cls.id} className="tv-results__card-wrapper">
            <PodiumCard
              className={cls.className}
              element={cls.element}
              level={cls.level}
              section={cls.section}
              placements={cls.placements}
              variant="compact"
              animate={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
