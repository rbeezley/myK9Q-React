import React, { useMemo } from 'react';
import { ClassInfo } from '../hooks/useTVData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
// import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/Card';
import { Clock, Users, Award, TrendingUp, ChevronRight } from 'lucide-react';

interface ClassProgressSummaryProps {
  inProgressClasses: ClassInfo[];
  entries?: any[];
}

export const ClassProgressSummary: React.FC<ClassProgressSummaryProps> = ({
  inProgressClasses,
  entries = []
}) => {
  const summaryData = useMemo(() => {
    return inProgressClasses.map(cls => {
      const totalEntries = cls.entry_total_count || 0;
      const completedEntries = cls.entry_completed_count || 0;
      const progressPercentage = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

      // Calculate check-in status for this element type
      const elementEntries = entries.filter(entry =>
        entry.element?.toUpperCase() === cls.element_type.toUpperCase()
      );
      const checkedInCount = elementEntries.filter(entry => entry.checkin_status === 1).length;
      const totalElementEntries = elementEntries.length;

      // Construct class name with level + element (prioritize level + element over class_name)
      const displayName = (cls.level && cls.level !== 'Unknown')
        ? `${cls.level} ${cls.element_type}`
        : cls.element_type;

      return {
        id: cls.id,
        className: displayName,
        elementType: cls.element_type,
        level: cls.level || 'Unknown',
        judge: cls.judge_name || 'TBD',
        completed: completedEntries,
        total: totalEntries,
        progressPercentage: Math.round(progressPercentage),
        checkedIn: checkedInCount,
        totalCheckins: totalElementEntries
      };
    });
  }, [inProgressClasses, entries]);

  const getElementIcon = (elementType: string) => {
    switch (elementType.toUpperCase()) {
      case 'CONTAINER': return { icon: '📦', color: 'from-amber-500 to-orange-500' };
      case 'BURIED': return { icon: '🕳️', color: 'from-stone-500 to-gray-600' };
      case 'INTERIOR': return { icon: '🏠', color: 'from-blue-500 to-indigo-600' };
      case 'EXTERIOR': return { icon: '🌳', color: 'from-green-500 to-emerald-600' };
      case 'HANDLER DISCRIMINATION':
      case 'HD_CHALLENGE': return { icon: '🎯', color: 'from-purple-500 to-violet-600' };
      default: return { icon: '🔍', color: 'from-slate-500 to-gray-600' };
    }
  };

  const getProgressStatus = (percentage: number) => {
    if (percentage >= 100) {
      return {
        variant: 'success' as const,
        label: 'Complete',
        gradient: 'from-emerald-500 to-green-500',
        bgColor: 'bg-emerald-500/10',
        textColor: 'text-emerald-400',
        ringColor: 'ring-emerald-500/20'
      };
    }
    if (percentage >= 80) {
      return {
        variant: 'success' as const,
        label: 'Nearly Done',
        gradient: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-500/10',
        textColor: 'text-green-400',
        ringColor: 'ring-green-500/20'
      };
    }
    if (percentage >= 50) {
      return {
        variant: 'warning' as const,
        label: 'In Progress',
        gradient: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-400',
        ringColor: 'ring-amber-500/20'
      };
    }
    if (percentage >= 20) {
      return {
        variant: 'warning' as const,
        label: 'Started',
        gradient: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-500/10',
        textColor: 'text-orange-400',
        ringColor: 'ring-orange-500/20'
      };
    }
    if (percentage > 0) {
      return {
        variant: 'default' as const,
        label: 'Beginning',
        gradient: 'from-blue-500 to-indigo-500',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-400',
        ringColor: 'ring-blue-500/20'
      };
    }
    return {
      variant: 'secondary' as const,
      label: 'Pending',
      gradient: 'from-slate-500 to-gray-500',
      bgColor: 'bg-slate-500/10',
      textColor: 'text-slate-400',
      ringColor: 'ring-slate-500/20'
    };
  };

  if (summaryData.length === 0) {
    return (
      <div className="h-full flex flex-col p-8 space-y-6">
        {/* Premium Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                <TrendingUp className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Classes in Progress</h2>
              <p className="text-sm text-white/60 font-medium">Real-time judging status</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>

        {/* Premium Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-500/20 to-gray-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Clock className="w-12 h-12 text-slate-300" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs font-bold">⏳</span>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">No Active Classes</h3>
            <p className="text-white/60 max-w-sm leading-relaxed">
              Classes will appear here automatically when judging begins.
              The system monitors all active competitions in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/70 font-medium">System Ready</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 space-y-6">
      {/* Premium Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
              <TrendingUp className="h-6 w-6 text-indigo-300" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Classes in Progress</h2>
            <p className="text-sm text-white/60 font-medium">Real-time judging status</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 px-3 py-1">
            <Clock className="w-3 h-3 mr-1" />
            Live
          </Badge>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 px-3 py-1">
            {summaryData.length} Active
          </Badge>
        </div>
      </div>

      {/* Premium Cards Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto pb-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-min">
            {summaryData.map((classData) => {
              const elementData = getElementIcon(classData.elementType);
              const progressStatus = getProgressStatus(classData.progressPercentage);
              const checkinPercentage = classData.totalCheckins > 0
                ? Math.round((classData.checkedIn / classData.totalCheckins) * 100)
                : 0;

              return (
                <Card key={classData.id} className={cn(
                  "group relative overflow-hidden transition-all duration-500 ease-out cursor-pointer",
                  "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
                  "backdrop-blur-xl border border-white/20 rounded-2xl",
                  "shadow-lg hover:shadow-2xl",
                  "hover:-translate-y-2 hover:border-white/40",
                  "hover:bg-gradient-to-br hover:from-white/15 hover:via-white/10 hover:to-white/5"
                )}>
                  {/* Sophisticated hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-2xl" />

                  {/* Subtle border glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ padding: '1px', margin: '-1px' }} />

                  <CardContent className="relative p-6 space-y-6">
                    {/* Class Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "relative p-3 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg",
                          "bg-gradient-to-br", elementData.color,
                          "group-hover:scale-110 group-hover:shadow-xl transition-all duration-300"
                        )}>
                          <span className="text-xl">{elementData.icon}</span>
                          <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-blue-200 transition-colors duration-300 truncate">
                              {classData.className.toUpperCase()}
                            </h3>
                            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <p className="text-sm text-white/60 font-medium">
                            {classData.elementType.charAt(0).toUpperCase() + classData.elementType.slice(1).toLowerCase()}
                          </p>
                          <Badge
                            variant={progressStatus.variant}
                            className={cn(
                              "mt-2 text-xs font-medium border-0 shadow-sm",
                              progressStatus.bgColor,
                              progressStatus.textColor
                            )}
                          >
                            {progressStatus.label}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-4">
                      {/* Main Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-blue-300" />
                            <span className="text-sm font-medium text-white/80 tracking-wide">
                              Judging Progress
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              {classData.progressPercentage}%
                            </div>
                            <div className="text-xs text-white/60">
                              {classData.completed} of {classData.total}
                            </div>
                          </div>
                        </div>

                        {/* Premium Progress Bar */}
                        <div className="relative">
                          <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                            <div className={cn(
                              "h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden",
                              "bg-gradient-to-r", progressStatus.gradient,
                              "shadow-lg"
                            )}
                            style={{ width: `${Math.max(classData.progressPercentage, 3)}%` }}>
                              {/* Shimmer effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </div>
                          </div>
                          {/* Progress glow */}
                          <div className={cn(
                            "absolute inset-0 rounded-full opacity-60 blur-sm transition-all duration-1000",
                            "bg-gradient-to-r", progressStatus.gradient
                          )}
                          style={{ width: `${Math.max(classData.progressPercentage, 3)}%` }} />
                        </div>
                      </div>

                      {/* Check-in Progress */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-300" />
                            <span className="text-sm font-medium text-white/80 tracking-wide">
                              Check-in Status
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-white">
                              {checkinPercentage}%
                            </div>
                            <div className="text-xs text-white/60">
                              {classData.checkedIn} of {classData.totalCheckins}
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <div className="w-full h-2 bg-white/15 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                              style={{ width: `${Math.max(checkinPercentage, 2)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Judge Information */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-lg flex items-center justify-center border border-white/10">
                            <span className="text-sm">👨‍⚖️</span>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-white/60 uppercase tracking-wide">
                              Judge
                            </p>
                            <p className="text-sm font-semibold text-white truncate max-w-[160px]">
                              {classData.judge}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-white/60">Level</p>
                          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
                            {classData.level}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};