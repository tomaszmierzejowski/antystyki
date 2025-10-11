import React from 'react';
import type { Antistic } from '../types';
import { Link } from 'react-router-dom';
import { getBackgroundByKey } from '../config/backgrounds';

interface Props {
  antistic: Antistic;
}

const AntisticCard: React.FC<Props> = ({ antistic }) => {
  const background = getBackgroundByKey(antistic.backgroundImageKey || undefined);
  
  return (
    <Link to={`/antistic/${antistic.id}`}>
      <div className="group bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-200">
        {/* Card Image/Background */}
        <div className={`relative h-48 bg-gradient-to-br ${background.gradient} opacity-90`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white text-center bg-black/20">
            <h3 className="text-lg font-bold mb-2 drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 line-clamp-2">
              {antistic.title}
            </h3>
            <p className="text-sm leading-relaxed drop-shadow-lg line-clamp-3">
              {antistic.reversedStatistic}
            </p>
          </div>
          
          {/* Watermark */}
          <div className="absolute bottom-2 right-2 text-white text-xs opacity-50 font-medium">
            antystyki.pl
          </div>
          
          {/* Gradient Overlay on Hover - showing "shades" */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        {/* Card Footer */}
        <div className="p-3 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-xs text-gray-600 mb-2">
            <div className="flex gap-3">
              <span className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                <span className="text-sm">❤️</span>
                <span className="font-semibold">{antistic.likesCount}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="text-sm">👁️</span>
                <span className="font-semibold">{antistic.viewsCount}</span>
              </span>
            </div>
            <div className="text-gray-600 font-medium hover:text-gray-900 transition-colors text-xs">
              @{antistic.user.username}
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-1">
            {antistic.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-300 transition-colors"
              >
                {cat.namePl}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AntisticCard;

