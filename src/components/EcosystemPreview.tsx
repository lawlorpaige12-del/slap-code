type EcosystemPreviewProps = {
  health?: 'vibrant' | 'recovering' | 'neglected';
};

function EcosystemPreview({ health = 'vibrant' }: EcosystemPreviewProps) {
  return (
    <div className={`ecosystem-scene ecosystem-${health}`}>
      <div className="ecosystem-sky">
        <div className="ecosystem-sun" />
        <div className="ecosystem-cloud cloud-one" />
        <div className="ecosystem-cloud cloud-two" />
      </div>
      <div className="ecosystem-ground">
        <div className="ecosystem-plant" />
        <div className="ecosystem-butterfly" />
        <div className="ecosystem-sparkles" />
      </div>
    </div>
  );
}

export default EcosystemPreview;
