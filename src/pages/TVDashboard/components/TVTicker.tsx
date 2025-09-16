import React from 'react';

interface TickerMessage {
  id: string;
  text: string;
  type: 'announcement' | 'alert' | 'info';
}

interface TVTickerProps {
  messages?: TickerMessage[];
}

const defaultMessages: TickerMessage[] = [
  { id: '1', text: '📢 Handlers briefing 8:30 AM', type: 'announcement' },
  { id: '2', text: 'HD Challenge sign-ups open', type: 'info' },
  { id: '3', text: 'Check-in available via myK9Q app', type: 'info' },
  { id: '4', text: 'Official photos available after each day', type: 'info' },
];

export const TVTicker: React.FC<TVTickerProps> = ({ messages = defaultMessages }) => {
  return (
    <footer className="tv-ticker">
      <div className="ticker-content">
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            <span className="ticker-item">{message.text}</span>
            {index < messages.length - 1 && (
              <span className="ticker-separator">•</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </footer>
  );
};

export default TVTicker;