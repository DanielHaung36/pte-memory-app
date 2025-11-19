"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetReviewHeatmapQuery } from "@/lib/store/analyticsApi";
import { LoaderCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewHeatmapProps {
  days?: string;
  className?: string;
}

const ReviewHeatmap = React.memo(function ReviewHeatmap({
  days = "365",
  className = "",
}: ReviewHeatmapProps) {
  const [selectedDays, setSelectedDays] = useState(days);
  const { data, isLoading, error } = useGetReviewHeatmapQuery({
    days: selectedDays,
  });
  console.log(data, error);

  const heatmapData = data?.heatmap_data;

  // 计算热力图统计信息
  const stats = useMemo(() => {
    if (!heatmapData) {
      return { totalDays: 0, activeDays: 0, activeRate: 0, maxCount: 0 };
    }

    const activeDays = heatmapData.data.filter((d) => d.count > 0).length;
    const totalDays = heatmapData.total_days || heatmapData.data.length;
    const activeRate =
      totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0;

    return {
      totalDays,
      activeDays,
      activeRate,
      maxCount: heatmapData.max_count || 0,
    };
  }, [heatmapData]);

  // 生成热力图网格
  const generateHeatmapGrid = () => {
    if (!heatmapData) return null;

    const cellSize = 12;
    const cellGap = 2;
    const data = heatmapData.data;

    // 按周分组数据
    const weeks: Array<typeof data> = [];
    let currentWeek: typeof data = [];

    data.forEach((item, index) => {
      const date = new Date(item.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday

      if (index === 0) {
        // 填充第一周的空白天数
        for (let i = 0; i < dayOfWeek; i++) {
          currentWeek.push({ date: "", count: 0, level: 0 });
        }
      }

      currentWeek.push(item);

      if (dayOfWeek === 6 || index === data.length - 1) {
        // Saturday or last day
        // 填充最后一周的空白天数
        while (currentWeek.length < 7) {
          currentWeek.push({ date: "", count: 0, level: 0 });
        }
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    const getIntensityColor = (level: number) => {
      switch (level) {
        case 0:
          return "bg-gray-100";
        case 1:
          return "bg-green-200";
        case 2:
          return "bg-green-400";
        case 3:
          return "bg-green-600";
        case 4:
          return "bg-green-800";
        default:
          return "bg-gray-100";
      }
    };

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`
                    w-3 h-3 rounded-sm transition-all duration-200 hover:scale-110 cursor-pointer
                    ${
                      day.date ? getIntensityColor(day.level) : "bg-transparent"
                    }
                  `}
                  title={day.date ? `${day.date}: ${day.count}次复习` : ""}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const dayOptions = [
    { value: "90", label: "3个月" },
    { value: "180", label: "6个月" },
    { value: "365", label: "1年" },
  ];

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 复习热力图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-red-500">
            加载热力图数据失败
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">📅 复习热力图</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {dayOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={
                    selectedDays === option.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedDays(option.value)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <LoaderCircle className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* 热力图网格 */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                {generateHeatmapGrid()}
              </div>

              {/* 图例 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>少</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-800"></div>
                  </div>
                  <span>多</span>
                </div>

                <div className="text-sm text-gray-500">
                  最高: {stats.maxCount}次复习/天
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalDays}
                  </div>
                  <div className="text-sm text-gray-600">总天数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.activeDays}
                  </div>
                  <div className="text-sm text-gray-600">活跃天数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.activeRate}%
                  </div>
                  <div className="text-sm text-gray-600">活跃率</div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default ReviewHeatmap;
