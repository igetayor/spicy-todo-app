package com.spicytodo.model;

import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class TodoStatsTest {

    @Test
    void testTodoStatsCreation_WithAllFields() {
        Map<String, Integer> priorityBreakdown = new HashMap<>();
        priorityBreakdown.put("high", 5);
        priorityBreakdown.put("medium", 3);
        priorityBreakdown.put("low", 2);

        TodoStats stats = new TodoStats(
                10, // total
                6,  // active
                4,  // completed
                40.0, // completionRate
                priorityBreakdown,
                2,  // overdueCount
                1,  // dueTodayCount
                3   // upcomingCount
        );

        assertEquals(10, stats.getTotal());
        assertEquals(6, stats.getActive());
        assertEquals(4, stats.getCompleted());
        assertEquals(40.0, stats.getCompletionRate(), 0.01);
        assertEquals(priorityBreakdown, stats.getPriorityBreakdown());
        assertEquals(2, stats.getOverdueCount());
        assertEquals(1, stats.getDueTodayCount());
        assertEquals(3, stats.getUpcomingCount());
    }

    @Test
    void testTodoStatsGettersAndSetters() {
        TodoStats stats = new TodoStats();

        stats.setTotal(5);
        stats.setActive(3);
        stats.setCompleted(2);
        stats.setCompletionRate(40.0);
        Map<String, Integer> priorityBreakdown = new HashMap<>();
        priorityBreakdown.put("high", 2);
        stats.setPriorityBreakdown(priorityBreakdown);
        stats.setOverdueCount(1);
        stats.setDueTodayCount(1);
        stats.setUpcomingCount(1);

        assertEquals(5, stats.getTotal());
        assertEquals(3, stats.getActive());
        assertEquals(2, stats.getCompleted());
        assertEquals(40.0, stats.getCompletionRate(), 0.01);
        assertEquals(priorityBreakdown, stats.getPriorityBreakdown());
        assertEquals(1, stats.getOverdueCount());
        assertEquals(1, stats.getDueTodayCount());
        assertEquals(1, stats.getUpcomingCount());
    }

    @Test
    void testTodoStats_ZeroCompletionRate() {
        TodoStats stats = new TodoStats(5, 5, 0, 0.0, new HashMap<>(), 0, 0, 0);

        assertEquals(0.0, stats.getCompletionRate(), 0.01);
    }

    @Test
    void testTodoStats_HundredPercentCompletionRate() {
        TodoStats stats = new TodoStats(5, 0, 5, 100.0, new HashMap<>(), 0, 0, 0);

        assertEquals(100.0, stats.getCompletionRate(), 0.01);
    }

    @Test
    void testTodoStats_EmptyPriorityBreakdown() {
        TodoStats stats = new TodoStats(0, 0, 0, 0.0, new HashMap<>(), 0, 0, 0);

        assertNotNull(stats.getPriorityBreakdown());
        assertTrue(stats.getPriorityBreakdown().isEmpty());
    }

    @Test
    void testTodoStatsToString() {
        TodoStats stats = new TodoStats(10, 6, 4, 40.0, new HashMap<>(), 2, 1, 3);

        String toString = stats.toString();

        assertNotNull(toString);
        assertTrue(toString.contains("10"));
        assertTrue(toString.contains("6"));
        assertTrue(toString.contains("4"));
    }

    @Test
    void testTodoStatsEqualsAndHashCode() {
        Map<String, Integer> priorityBreakdown = new HashMap<>();
        priorityBreakdown.put("high", 5);

        TodoStats stats1 = new TodoStats(10, 6, 4, 40.0, priorityBreakdown, 2, 1, 3);
        TodoStats stats2 = new TodoStats(10, 6, 4, 40.0, priorityBreakdown, 2, 1, 3);

        assertEquals(stats1, stats2);
        assertEquals(stats1.hashCode(), stats2.hashCode());
    }

    @Test
    void testTodoStats_NotEqual() {
        TodoStats stats1 = new TodoStats(10, 6, 4, 40.0, new HashMap<>(), 2, 1, 3);
        TodoStats stats2 = new TodoStats(5, 3, 2, 40.0, new HashMap<>(), 1, 0, 1);

        assertNotEquals(stats1, stats2);
    }
}

