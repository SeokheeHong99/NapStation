type FloatingActionsProps = {
  canAdd: boolean;
  canReport: boolean;
  onAuthRequired: () => void;
  onAdd: () => void;
  onReport: () => void;
};

export default function FloatingActions({
  canAdd,
  canReport,
  onAuthRequired,
  onAdd,
  onReport,
}: FloatingActionsProps) {
  return (
    <div className="floating-actions">
      <button
        type="button"
        className="action-button"
        onClick={canAdd ? onAdd : onAuthRequired}
      >
        ADD
      </button>
      <button
        type="button"
        className="action-button ghost"
        onClick={canReport ? onReport : onAuthRequired}
      >
        Report
      </button>
    </div>
  );
}
