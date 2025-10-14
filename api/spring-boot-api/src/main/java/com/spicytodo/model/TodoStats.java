package com.spicytodo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoStats {
    private int total;
    private int active;
    private int completed;
    private double completionRate;
    private Map<String, Integer> priorityBreakdown;
    private int overdueCount;
    private int dueTodayCount;
    private int upcomingCount;
}

