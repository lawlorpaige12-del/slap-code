import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchSavedPlan, getPlannerInput } from '../services/api';

function SlapButton() {
  const { dashboard } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('STUDY.');

  const buildMessage = async () => {
    const tasks = (await fetchSavedPlan()) || [];
    const incomplete = tasks.filter((t: any) => !t.completed).length;
    if (incomplete > 0) {
      return `You are ${incomplete} ${incomplete === 1 ? 'task' : 'tasks'} behind. Start with one.`;
    }

    const input = await getPlannerInput();
    if (input?.nextExam) {
      const then = new Date(input.nextExam);
      if (!Number.isNaN(then.getTime())) {
        const diff = Math.ceil((then.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff >= 0) return `${diff} days until your next exam.`;
      }
    }

    if (dashboard?.streak && dashboard.streak >= 21) {
      const weeks = Math.floor(dashboard.streak / 7);
      return `You have a ${weeks}-week streak. Keep it going.`;
    }

    return 'STUDY.';
  };

  const handleOpen = async () => {
    const m = await buildMessage();
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
