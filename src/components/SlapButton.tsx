import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function SlapButton() {
  const { sessionState } = useAuth();
  const { tasks, plannerInput } = sessionState;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('STUDY.');

  const buildMessage = () => {
    const incomplete = tasks.filter((t) => !t.completed).length;
    if (incomplete > 0) {
      return `You are ${incomplete} ${incomplete === 1 ? 'task' : 'tasks'} behind. Start with one.`;
    }

    if (plannerInput?.nextExam) {
      try {
        const then = new Date(plannerInput.nextExam);
        if (!Number.isNaN(then.getTime())) {
          const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (diff >= 0) return `${diff} days until your next exam.`;
        }
      } catch (e) {
        // ignore
      }
    }

    return 'STUDY.';
  };

  const handleOpen = () => {
    const m = buildMessage();
    setMessage(m);
    setOpen(true);
  };

  return (
    <>
      <button
        className="slap-button"
        type="button"
        onClick={handleOpen}
        aria-label="Open slAP motivation"
      >
        slAP
      </button>

      {open && (
        <div className="slap-modal-full" role="dialog" aria-modal="true">
          <div className="slap-modal-full-inner">
            <div className="slap-modal-message-big">{message}</div>
            <button
              className="slap-modal-ok-full"
              type="button"
              onClick={() => setOpen(false)}
            >
              I will keep studying.
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SlapButton;
