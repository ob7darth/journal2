import React from 'react';
import { CheckCircle, Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ReadingPlan } from '../types/ReadingPlan';
import { SOAPEntry } from '../types/SOAPEntry';

interface ProgressTrackerProps {
  readingPlan: ReadingPlan;
  soapEntries: Record<number, SOAPEntry>;
  onDaySelect: (day: number) => void;
  onShareEntry?: (entry: SOAPEntry) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  readingPlan, 
  soapEntries, 
  onDaySelect
}) => {
  const completedDays = Object.keys(soapEntries).length;
  const totalDays = readingPlan.days.length;
  const completionRate = Math.round((completedDays / totalDays) * 100);

  // Group days by month for better organization - using 2025
  const daysByMonth = readingPlan.days.reduce((acc, day) => {
    // Calculate the actual date for 2025
    const startDate = new Date(2025, 0, 1); // January 1, 2025
    const actualDate = addDays(startDate, day.day - 1);
    const monthKey = format(actualDate, 'yyyy-MM');
    const monthName = format(actualDate, 'MMMM yyyy');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        name: monthName,
        days: []
      };
    }
    acc[monthKey].days.push({
      ...day,
      actualDate // Add the calculated date
    });
    return acc;
  }, {} as Record<string, { name: string; days: Array<typeof readingPlan.days[0] & {actualDate: Date}> }>);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Progress Tracker</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{completedDays} of {totalDays} days completed</span>
          <span className="font-medium text-primary-600">{completionRate}%</span>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedDays}</div>
          <div className="text-sm text-green-700">Days Completed</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalDays - completedDays}</div>
          <div className="text-sm text-blue-700">Days Remaining</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{completionRate}%</div>
          <div className="text-sm text-purple-700">Complete</div>
        </div>
      </div>

      {/* Monthly Progress */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Calendar size={20} />
          Monthly Progress
        </h3>
        
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {Object.entries(daysByMonth).map(([monthKey, month]) => {
            const monthCompleted = month.days.filter(day => soapEntries[day.day]).length;
            const monthTotal = month.days.length;
            const monthProgress = Math.round((monthCompleted / monthTotal) * 100);
            
            return (
              <div key={monthKey} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">{month.name}</h4>
                  <span className="text-sm text-gray-600">
                    {monthCompleted}/{monthTotal} ({monthProgress}%)
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${monthProgress}%` }}
                  />
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {month.days.map((day) => {
                    const isCompleted = !!soapEntries[day.day];
                    const dayOfMonth = day.actualDate.getDate();
                    
                    return (
                      <button
                        key={day.day}
                        onClick={() => onDaySelect(day.day)}
                        className={`relative w-8 h-8 text-xs rounded transition-all hover:scale-110 ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={`Day ${day.day} - ${format(day.actualDate, 'MMM d, yyyy')}${isCompleted ? ' (Completed)' : ''}`}
                        aria-label={`Day ${day.day} - ${format(day.actualDate, 'MMM d, yyyy')}${isCompleted ? ' (Completed)' : ''}`}
                      >
                        {dayOfMonth}
                        {isCompleted && (
                          <CheckCircle 
                            size={10} 
                            className="absolute -top-1 -right-1 text-green-600 bg-white rounded-full" 
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;