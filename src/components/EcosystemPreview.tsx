type EcosystemPreviewProps = {
  health?: 'vibrant' | 'recovering' | 'neglected';
  weather?: 'sunny' | 'rainy';
};

function EcosystemPreview({ health = 'vibrant', weather = 'sunny' }: EcosystemPreviewProps) {
  return (
    <div className={`ecosystem-scene ecosystem-${health} ${weather === 'rainy' ? 'ecosystem-rainy' : ''}`}>
      <div className="ecosystem-sky">
        {weather === 'sunny' && <div className="ecosystem-sun" />}
        <div className={`ecosystem-cloud cloud-one ${weather === 'rainy' ? 'cloud-dark' : ''}`} />
        <div className={`ecosystem-cloud cloud-two ${weather === 'rainy' ? 'cloud-dark' : ''}`} />
        {weather === 'rainy' && <div className="ecosystem-rain" />}
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
