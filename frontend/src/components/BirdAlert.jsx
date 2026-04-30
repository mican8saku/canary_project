import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BirdAlert = () => {
  const [isInactive, setIsInactive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkBirdStatus = async () => {
      try {
        const response = await fetch('http://100.73.28.49:5000/status'); // Din befintliga status-route
        const data = await response.json();
        
        if (data.lastMotionAt) {
          const lastActivity = new Date(data.lastMotionAt);
          const diffInMinutes = (new Date() - lastActivity) / 60000;
          
          // Om mer än 60 minuter har gått
          setIsInactive(diffInMinutes > 2);
        }
      } catch (err) {
        console.error("Status-check misslyckades", err);
      }
    };

    const interval = setInterval(checkBirdStatus, 30000); // Kolla var 30:e sekund
    return () => clearInterval(interval);
  }, []);

  if (!isInactive) return null;

  return (
    <div className="ios-alert-overlay">
      <div className="ios-alert-box bg-white/90">
        <div className="p-5">
          <h3 className="text-lg font-semibold text-black">Aktivitetsvarning</h3>
          <p className="text-sm text-gray-600 mt-1">Fågeln har varit stilla i över en timme.</p>
        </div>
        <div className="flex flex-col border-t border-gray-300">
          <button 
            onClick={() => { navigate('/camera'); setIsInactive(false); }}
            className="py-3 text-[#007AFF] font-semibold border-b border-gray-300 active:bg-gray-200"
          >
            Se Live Video
          </button>
          <button 
            onClick={() => setIsInactive(false)}
            className="py-3 text-[#007AFF] active:bg-gray-200"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BirdAlert;