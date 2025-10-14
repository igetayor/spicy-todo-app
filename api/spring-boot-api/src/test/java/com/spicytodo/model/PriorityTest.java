package com.spicytodo.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PriorityTest {

    @Test
    void testPriorityValues() {
        Priority[] priorities = Priority.values();

        assertEquals(3, priorities.length);
        assertTrue(containsPriority(priorities, Priority.low));
        assertTrue(containsPriority(priorities, Priority.medium));
        assertTrue(containsPriority(priorities, Priority.high));
    }

    @Test
    void testPriorityValueOf() {
        assertEquals(Priority.low, Priority.valueOf("low"));
        assertEquals(Priority.medium, Priority.valueOf("medium"));
        assertEquals(Priority.high, Priority.valueOf("high"));
    }

    @Test
    void testPriorityValueOf_Invalid_ShouldThrowException() {
        assertThrows(IllegalArgumentException.class, () -> {
            Priority.valueOf("invalid");
        });
    }

    @Test
    void testPriorityEnumEquality() {
        Priority p1 = Priority.high;
        Priority p2 = Priority.high;
        Priority p3 = Priority.low;

        assertEquals(p1, p2);
        assertNotEquals(p1, p3);
    }

    @Test
    void testPriorityEnumHashCode() {
        Priority p1 = Priority.medium;
        Priority p2 = Priority.medium;

        assertEquals(p1.hashCode(), p2.hashCode());
    }

    @Test
    void testPriorityEnumToString() {
        assertEquals("low", Priority.low.toString());
        assertEquals("medium", Priority.medium.toString());
        assertEquals("high", Priority.high.toString());
    }

    private boolean containsPriority(Priority[] priorities, Priority priority) {
        for (Priority p : priorities) {
            if (p == priority) {
                return true;
            }
        }
        return false;
    }
}

