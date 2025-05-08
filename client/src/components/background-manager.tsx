import { useEffect, useState } from "react";
import { getTimeOfDay } from "@/lib/time-utils";

export default function BackgroundManager() {
  // Используем наш горизонтально отраженный фон сетки
  const customGridBackgroundUrl = '/assets/custom-grid.svg';
  
  // Получаем время дня для настройки цветов фона
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState(getTimeOfDay());
  
  // Определяем цвет фона в зависимости от времени суток
  const getBackgroundColor = () => {
    switch(currentTimeOfDay) {
      case 'morning':
        return 'bg-gradient-to-br from-blue-50 to-blue-200';
      case 'day':
        return 'bg-gradient-to-br from-blue-100 to-blue-300';
      case 'afternoon':
        return 'bg-gradient-to-br from-orange-100 to-blue-200';
      case 'evening':
        return 'bg-gradient-to-br from-orange-200 to-purple-300';
      case 'night':
        return 'bg-gradient-to-br from-blue-900 to-purple-800';
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-200';
    }
  };
  
  // Эффект для обновления фона при смене времени суток
  useEffect(() => {
    // Функция будет переоценивать цвет фона каждые 15 минут
    const interval = setInterval(() => {
      setCurrentTimeOfDay(getTimeOfDay());
    }, 900000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Основной градиентный фон в зависимости от времени суток */}
      <div 
        className={`fixed inset-0 transition-colors duration-500 ease-in-out z-0 ${getBackgroundColor()}`}
      ></div>
      
      {/* Горизонтально отраженная сетка */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-repeat z-0 opacity-25"
        style={{ backgroundImage: `url(${customGridBackgroundUrl})` }}
      ></div>
      
      {/* Слой затемнения */}
      <div className="absolute inset-0 bg-black bg-opacity-25 z-0"></div>
    </>
  );
}
