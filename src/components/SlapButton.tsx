import { useState } from 'react';

const motivationalMessages = [
  'STUDY.',
  'You are three tasks behind. Start with one.',
  '12 days until AP Biology.',
  "Don't break your streak.",
];

function SlapButton() {
  const [open, setOpen] = useState(false);
  const [message] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
  );

  return (
    <>
      <button
        className="slap-button"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open slAP motivation"
      >
        slAP
      </button>
      {open && (
        <div className="slap-modal" role="dialog" aria-modal="true">
          <div className="slap-modal-card">
            <p className="slap-modal-message">{message}</p>
            <button
              className="slap-modal-ok"
              type="button"
              onClick={() => setOpen(false)}
            >
              I will keep studying
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SlapButton;
