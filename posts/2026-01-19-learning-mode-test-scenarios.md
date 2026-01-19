---
title: "Learning Mode Test Scenarios"
date: 2026-01-19
author: "Geoff"
tags: ["Learning Mode", "Testing", "Bloom's Taxonomy", "UX", "Analytics"]
categories: ["QA", "Education", "Product"]
excerpt: "A comprehensive suite of scenarios to validate Learning Mode's adaptive assessments, lesson generation, metacognitive tracking, and UI robustness."
published: true
featured_image: "/assets/images/2026-01-19-learning-mode-test-scenarios.svg"
---

# Learning Mode Test Scenarios

This document provides comprehensive test scenarios to validate the full capabilities of the Learning Mode system, an adaptive educational feature that uses Bloom's Taxonomy-based assessment and metacognitive tracking.

## Table of Contents

1. [Core Workflow Scenarios](#core-workflow-scenarios)
2. [Pretest Generation Scenarios](#pretest-generation-scenarios)
3. [Difficulty Calibration Scenarios](#difficulty-calibration-scenarios)
4. [Lesson Generation Scenarios](#lesson-generation-scenarios)
5. [Practice Question Scenarios](#practice-question-scenarios)
6. [Evaluation & Feedback Scenarios](#evaluation--feedback-scenarios)
7. [Metacognitive Tracking Scenarios](#metacognitive-tracking-scenarios)
8. [Progress Analytics Scenarios](#progress-analytics-scenarios)
9. [UI State Management Scenarios](#ui-state-management-scenarios)
10. [Edge Cases & Error Handling](#edge-cases--error-handling)
11. [Multi-Topic Session Scenarios](#multi-topic-session-scenarios)
12. [Advanced Integration Scenarios](#advanced-integration-scenarios)

---

## Core Workflow Scenarios

### Scenario 1.1: Complete Beginner Journey
**Objective:** Test full workflow for a novice learner

**Steps:**
1. Enable Learning Mode from input menu
2. Send message: "I want to learn about recursion in programming"
3. Wait for AI to call `start_session` with topic
4. Observe pretest panel appear with 5 questions
5. Answer all 5 questions incorrectly with low confidence (1-3)
6. Verify difficulty calibrates to 1-3 (Beginner)
7. Switch to Lesson tab
8. Engage with beginner-level lesson content
9. Switch to Practice tab
10. Complete 3 practice exercises
11. Check Progress tab for metrics

**Expected Results:**
- Session initializes successfully
- 5 pretest questions generated across all Bloom's levels
- Difficulty calibrates to 1-3
- Lesson content is simplified for beginners
- Practice questions are basic
- Progress tab shows low accuracy, metrics update correctly

---

### Scenario 1.2: Intermediate Learner Path
**Objective:** Test workflow for intermediate knowledge level

**Steps:**
1. Enable Learning Mode
2. Topic: "React hooks"
3. Answer 2-3 pretest questions correctly with medium confidence (4-7)
4. Verify difficulty calibrates to 4-6 (Intermediate)
5. Engage with intermediate lesson content
6. Complete practice exercises
7. Review progress analytics

**Expected Results:**
- Difficulty calibrates to intermediate (4-6)
- Lesson includes moderate complexity
- Practice questions are appropriately challenging
- Progress shows ~40-60% accuracy

---

### Scenario 1.3: Advanced Expert Journey
**Objective:** Test workflow for advanced learners

**Steps:**
1. Enable Learning Mode
2. Topic: "Machine learning gradient descent"
3. Answer 4-5 pretest questions correctly with high confidence (8-10)
4. Verify difficulty calibrates to 7-10 (Advanced)
5. Engage with advanced lesson content with complex examples
6. Complete challenging practice exercises
7. Review progress and AI insights

**Expected Results:**
- Difficulty calibrates to 7-10
- Lesson content includes advanced concepts, mathematical rigor
- Practice questions test higher-order thinking
- Progress shows high accuracy (80-100%)
- AI insights recommend increasing difficulty or exploring related topics

---

## Pretest Generation Scenarios

### Scenario 2.1: Bloom's Taxonomy Coverage
**Objective:** Verify all cognitive levels are represented

**Steps:**
1. Start session with topic: "Python data structures"
2. Examine generated pretest questions
3. Verify one question of each type:
   - **Foundational**: Basic recall (e.g., "What is a list in Python?")
   - **Conceptual**: Understanding (e.g., "How do dictionaries differ from lists?")
   - **Application**: Using knowledge (e.g., "Given this code, what's the output?")
   - **Analysis**: Breaking down (e.g., "Why would you choose a set over a list?")
   - **Synthesis**: Integration (e.g., "Design a data structure for this problem")

**Expected Results:**
- All 5 questions present
- Each represents a different cognitive level
- Questions increase in complexity from foundational to synthesis

---

### Scenario 2.2: Multiple Choice vs Open-Ended
**Objective:** Test variety in question formats

**Steps:**
1. Start session: "JavaScript async/await"
2. Check if questions include both:
   - Multiple choice with options array
   - Open-ended without options
3. Verify correct_answer field is populated when applicable

**Expected Results:**
- Mix of question formats
- Multiple choice questions have 3-4 options
- Open-ended questions allow free text input
- All questions have correct answers for evaluation

---

### Scenario 2.3: Topic-Specific Question Quality
**Objective:** Ensure questions are relevant and well-crafted

**Test Topics:**
- Technical: "REST API design"
- Mathematical: "Calculus derivatives"
- Conceptual: "Blockchain fundamentals"
- Practical: "SQL query optimization"

**Expected Results:**
- Questions directly relate to stated topic
- No generic or off-topic questions
- Questions test actual understanding, not memorization
- Difficulty progression is logical

---

## Difficulty Calibration Scenarios

### Scenario 3.1: Score-Based Calibration
**Objective:** Verify calibration algorithm

**Test Cases:**

| Correct Answers | Expected Difficulty | Category |
|-----------------|---------------------|----------|
| 0 | 1-2 | Novice |
| 1 | 2-3 | Novice |
| 2 | 4-5 | Intermediate |
| 3 | 5-6 | Intermediate |
| 4 | 7-8 | Advanced |
| 5 | 8-10 | Advanced |

**Steps:**
1. For each test case, answer exactly N questions correctly
2. Use medium confidence (5) for all answers
3. Verify difficulty matches expected range

---

### Scenario 3.2: Confidence Modifier Effect
**Objective:** Test how confidence affects calibration

**Test Cases:**
- **High confidence, low performance**: 1 correct, confidence 9-10 → Should detect overconfidence
- **Low confidence, high performance**: 4 correct, confidence 1-3 → Should detect underconfidence
- **Matched confidence**: 3 correct, confidence 5-7 → Well-calibrated

**Expected Results:**
- Overconfident users get slightly higher difficulty (test for misconceptions)
- Underconfident users get difficulty matching actual performance
- Well-calibrated users get appropriate difficulty

---

### Scenario 3.3: Dynamic Recalibration
**Objective:** Test if difficulty adjusts during session

**Steps:**
1. Start with 2 correct answers → Difficulty 4-5
2. In practice phase, answer 5+ questions correctly
3. Check if AI suggests increasing difficulty
4. Continue session with higher complexity

**Expected Results:**
- AI insights detect improved performance
- Recommendations to increase difficulty appear in Progress tab
- Subsequent practice questions adapt

---

## Lesson Generation Scenarios

### Scenario 4.1: Difficulty-Appropriate Content
**Objective:** Verify lesson adapts to calibrated difficulty

**Test Matrix:**

| Difficulty | Content Characteristics |
|------------|-------------------------|
| 1-3 | Simple language, basic concepts, step-by-step, lots of examples |
| 4-6 | Moderate complexity, assumes some background, balanced theory/practice |
| 7-10 | Technical depth, advanced concepts, minimal scaffolding, edge cases |

**Steps:**
1. Calibrate to each difficulty range
2. Request lesson on same topic at different levels
3. Compare content complexity

---

### Scenario 4.2: Focus Area Targeting
**Objective:** Test targeted lesson generation

**Steps:**
1. Start session: "Object-oriented programming"
2. Perform poorly on "inheritance" question in pretest
3. Request lesson with focus_area: "inheritance"
4. Verify lesson emphasizes inheritance concepts

**Expected Results:**
- Lesson centers on specified focus area
- Related concepts are included for context
- Practice questions also emphasize the focus area

---

### Scenario 4.3: Example Inclusion
**Objective:** Test include_examples parameter

**Steps:**
1. Generate lesson with `include_examples: true`
2. Generate lesson with `include_examples: false`
3. Compare content

**Expected Results:**
- With examples: Concrete code snippets, real-world scenarios, demonstrations
- Without examples: Theory-focused, conceptual explanations, abstract principles

---

### Scenario 4.4: Multi-Modal Content Delivery
**Objective:** Test if lessons incorporate various formats

**Steps:**
1. Request lesson on visual topic: "Network protocols"
2. Check for:
   - Text explanations
   - Code examples
   - Diagrams (if applicable)
   - Analogies
   - Interactive prompts

**Expected Results:**
- Lessons use multiple teaching modalities
- Content is engaging and varied
- Prompts encourage active learning

---

## Practice Question Scenarios

### Scenario 5.1: Quantity and Pacing
**Objective:** Test practice question generation

**Steps:**
1. After pretest, request practice questions
2. Verify 3-5 questions generated per request
3. Complete set, request more practice
4. Verify new questions are generated

**Expected Results:**
- Consistent quantity (3-5 questions)
- Questions don't repeat
- Difficulty remains appropriate
- Can request unlimited practice rounds

---

### Scenario 5.2: Difficulty Consistency
**Objective:** Ensure practice matches calibrated level

**Steps:**
1. Calibrate to difficulty 8
2. Generate practice questions
3. Verify questions are appropriately challenging
4. Compare to practice at difficulty 3

**Expected Results:**
- High-difficulty practice uses complex scenarios
- Low-difficulty practice uses basic exercises
- Clear distinction in question complexity

---

### Scenario 5.3: Scaffolded Learning
**Objective:** Test progressive difficulty within practice set

**Steps:**
1. Request practice questions
2. Examine if questions build on each other
3. Check if later questions reference earlier concepts

**Expected Results:**
- Questions may build progressively
- Later questions integrate earlier concepts
- Practice reinforces cumulative learning

---

## Evaluation & Feedback Scenarios

### Scenario 6.1: Correct Answer Evaluation
**Objective:** Test answer checking accuracy

**Test Cases:**
- Exact match: "Paris" vs "Paris"
- Case insensitive: "paris" vs "Paris"
- Whitespace tolerant: " Paris " vs "Paris"
- Partial match handling: "The answer is Paris" vs "Paris"

**Expected Results:**
- Exact, case-insensitive, and whitespace matches marked correct
- Partial matches may need improvement (known limitation)

---

### Scenario 6.2: Feedback Quality
**Objective:** Verify feedback is constructive

**Steps:**
1. Answer question correctly → Check for positive reinforcement
2. Answer incorrectly → Check for:
   - Correct answer display
   - Explanation of why answer is correct
   - Encouragement to continue

**Expected Results:**
- Correct: "Correct! Well done." or similar
- Incorrect: Shows correct answer with explanation
- Feedback is supportive and educational

---

### Scenario 6.3: Hint System
**Objective:** Test provide_hint functionality

**Steps:**
1. During practice, request hint via AI
2. AI calls `provide_hint` with focus_area
3. Verify hint is contextual and doesn't give away answer

**Expected Results:**
- Hint relates to current question/topic
- Provides guidance without full solution
- Encourages thinking process

---

## Metacognitive Tracking Scenarios

### Scenario 7.1: Confidence Rating Collection
**Objective:** Verify confidence tracking

**Steps:**
1. Answer pretest questions with varying confidence (1, 3, 5, 7, 10)
2. Check metrics.totalConfidence updates correctly
3. Verify average confidence calculation

**Expected Results:**
- Each answer records confidence value
- Total confidence = sum of all ratings
- Average confidence = total / questions answered
- Confidence displayed in Progress tab

---

### Scenario 7.2: Calibration Analysis
**Objective:** Test confidence vs performance analysis

**Test Cases:**

| Performance | Confidence | Expected Calibration Insight |
|-------------|------------|------------------------------|
| 1/5 correct | Avg 9 | "Overconfident - review misconceptions" |
| 5/5 correct | Avg 2 | "Underconfident - trust your knowledge" |
| 3/5 correct | Avg 6 | "Well-calibrated" |

**Steps:**
1. Create each scenario in separate sessions
2. Check Progress tab for calibration analysis
3. Verify AI insights match expected feedback

---

### Scenario 7.3: Confidence Trend Tracking
**Objective:** Monitor confidence changes over session

**Steps:**
1. Start with low confidence (2-3) on pretest
2. Engage with lessons and practice
3. Answer later practice with higher confidence (7-8)
4. Check if progress analytics show confidence growth

**Expected Results:**
- System tracks confidence per question
- Average confidence updates
- AI insights recognize confidence improvement

---

## Progress Analytics Scenarios

### Scenario 8.1: Real-Time Metrics Updates
**Objective:** Verify metrics update instantly

**Steps:**
1. Open Progress tab
2. Submit a practice answer
3. Immediately check Progress tab
4. Verify updates to:
   - Questions answered count
   - Accuracy rate
   - Average confidence
   - Session duration

**Expected Results:**
- All metrics update without page refresh
- Circular progress bar reflects new accuracy
- Session duration increments

---

### Scenario 8.2: Multi-Topic Tracking
**Objective:** Test topicsExplored array

**Steps:**
1. Start session: "Python"
2. Complete pretest
3. Start new session: "JavaScript"
4. Check topicsExplored in Progress tab

**Expected Results:**
- Array contains: ["Python", "JavaScript"]
- No duplicates
- Topics listed in order explored

---

### Scenario 8.3: Session Duration Accuracy
**Objective:** Verify time tracking

**Steps:**
1. Note session start time
2. Wait 5 minutes (engage with content)
3. Check session duration in Progress tab
4. Verify it shows ~5 minutes

**Expected Results:**
- Duration calculated from sessionStartTime to lastActivityTime
- Displayed in minutes
- Updates continuously

---

### Scenario 8.4: AI Insights Generation
**Objective:** Test personalized feedback

**Performance Patterns to Test:**
- High accuracy (>80%) → "Excellent performance! Consider increasing difficulty"
- Low accuracy (<40%) → "Keep practicing! Focus on foundational concepts"
- Improving trend → "Great progress! Your accuracy is improving"
- Overconfident → "Your confidence is higher than accuracy - review misconceptions"
- Underconfident → "You're doing better than you think! Trust your knowledge"

**Expected Results:**
- Insights are contextual and actionable
- Displayed prominently in Progress tab
- Update as performance changes

---

## UI State Management Scenarios

### Scenario 9.1: Panel Expand/Collapse
**Objective:** Test panel state transitions

**Steps:**
1. Enable Learning Mode → Panel appears expanded (500px)
2. Click collapse icon → Panel collapses to 60px
3. Verify collapsed view shows:
   - Phase indicator
   - Difficulty badge
   - Topics count
   - Quick stats
4. Click expand → Panel returns to 500px

**Expected Results:**
- Smooth transitions
- Collapsed view is informative
- State persists during session

---

### Scenario 9.2: Tab Navigation
**Objective:** Test switching between tabs

**Steps:**
1. Start in Lesson tab
2. Switch to Practice → Content updates
3. Switch to Progress → Analytics displayed
4. Return to Lesson → Previous content intact

**Expected Results:**
- Tab content loads correctly
- Active tab highlighted
- No data loss when switching
- Each tab functional independently

---

### Scenario 9.3: Phase Transitions
**Objective:** Verify phase state changes

**Phase Flow:**
1. `idle` → Initial state, no topic
2. `pretest` → Topic set, diagnostic in progress
3. `learning` → Pretest complete, active learning
4. `review` → Session review mode

**Steps:**
1. Monitor phase indicator in collapsed panel
2. Progress through phases
3. Verify label updates:
   - idle: "Ready to Start"
   - pretest: "Diagnostic Pretest"
   - learning: "Active Learning"
   - review: "Session Review"

---

### Scenario 9.4: Console Logs Visibility
**Objective:** Test console log feature

**Steps:**
1. Enable Learning Mode
2. Locate console logs display
3. Perform actions (set topic, answer questions)
4. Verify logs appear with:
   - Timestamp
   - Level (info, success, warning, error, question)
   - Message content
   - Color coding

**Expected Results:**
- Logs appear in real-time
- Color-coded by level
- Console can be toggled on/off
- Maintains last 500 logs

---

## Edge Cases & Error Handling

### Scenario 10.1: Empty/Invalid Topic
**Objective:** Handle invalid session start

**Test Cases:**
- Empty string: ""
- Only whitespace: "   "
- Very long topic: 500+ characters
- Special characters: "@#$%^&*"

**Expected Results:**
- System handles gracefully
- Error message if topic invalid
- No crash or undefined state

---

### Scenario 10.2: Skipping Pretest
**Objective:** Test if pretest can be bypassed

**Steps:**
1. Start session
2. Attempt to access Lesson tab before completing pretest
3. Observe behavior

**Expected Results:**
- System prevents access OR
- Uses default difficulty (5) if bypassed
- User clearly informed pretest is recommended

---

### Scenario 10.3: Incomplete Pretest
**Objective:** Handle partial pretest completion

**Steps:**
1. Start pretest
2. Answer only 3 of 5 questions
3. Attempt to switch to learning phase

**Expected Results:**
- System waits for all 5 answers OR
- Calibrates based on partial data with warning
- Progress indicator shows 3/5 completion

---

### Scenario 10.4: Network Failure During Session
**Objective:** Test offline resilience

**Steps:**
1. Start session, answer 2 pretest questions
2. Simulate network disconnect
3. Attempt to answer remaining questions
4. Reconnect
5. Verify session state

**Expected Results:**
- Session state preserved locally
- Graceful error on failed requests
- Recovery on reconnect without data loss

---

### Scenario 10.5: Rapid Tab Switching
**Objective:** Test UI stability

**Steps:**
1. Rapidly click between Lesson, Practice, Progress tabs
2. Observe for:
   - UI glitches
   - State corruption
   - Console errors

**Expected Results:**
- No visual glitches
- Content loads correctly
- No errors in console

---

### Scenario 10.6: Session Reset
**Objective:** Test reset functionality

**Steps:**
1. Complete full session (pretest + practice)
2. Call resetSession()
3. Verify all state cleared:
   - Topic cleared
   - Phase returns to idle
   - Metrics reset to 0
   - Console logs cleared

**Expected Results:**
- Complete state reset
- Ready for new session
- No residual data

---

## Multi-Topic Session Scenarios

### Scenario 11.1: Sequential Topic Learning
**Objective:** Test learning multiple topics in one session

**Steps:**
1. Complete session on "React"
2. Without resetting, start new topic: "Vue.js"
3. Verify:
   - Both topics in topicsExplored
   - Metrics accumulate across topics
   - Each topic has independent pretest

**Expected Results:**
- Seamless topic switching
- Cumulative metrics tracking
- Clear separation of topic-specific progress

---

### Scenario 11.2: Related Topic Progression
**Objective:** Test learning progression through related topics

**Steps:**
1. Topic 1: "Variables in JavaScript"
2. Topic 2: "Functions in JavaScript"
3. Topic 3: "Closures in JavaScript"
4. Verify difficulty increases if performance is consistent

**Expected Results:**
- System recognizes related topics
- May suggest increasing difficulty
- Builds on previous topic knowledge

---

### Scenario 11.3: Unrelated Topic Switching
**Objective:** Test switching to completely different domain

**Steps:**
1. Start with "Python programming" → High difficulty (8)
2. Switch to "Ancient Roman History"
3. Verify new pretest generated
4. Check if difficulty resets or adapts

**Expected Results:**
- New pretest for new domain
- Difficulty may reset to default or use confidence as guide
- Clear separation between unrelated topics

---

## Advanced Integration Scenarios

### Scenario 12.1: Learning Mode + Code Execution
**Objective:** Test integration with ExecuteCode tool

**Steps:**
1. Learn topic: "Python loops"
2. Practice question requires writing code
3. User submits code
4. AI uses ExecuteCode to verify correctness
5. Feedback includes execution results

**Expected Results:**
- Code executes in sandbox
- Output validates answer
- Feedback includes "Your code output: ..."

---

### Scenario 12.2: Learning Mode + Web Search
**Objective:** Test AI using external resources

**Steps:**
1. Topic: "Recent advances in quantum computing"
2. AI needs current information
3. AI calls Search tool for context
4. Generates lesson with up-to-date information

**Expected Results:**
- AI recognizes need for current data
- Searches appropriately
- Lesson includes recent developments

---

### Scenario 12.3: Learning Mode + Knowledge Repositories
**Objective:** Test integration with uploaded documents

**Steps:**
1. User uploads textbook PDF on "Linear Algebra"
2. Starts learning session: "Linear Algebra"
3. AI queries knowledge repository during lesson generation
4. Lesson references uploaded material

**Expected Results:**
- AI leverages user's own materials
- Lessons aligned with user's resources
- References specific pages/sections when helpful

---

### Scenario 12.4: Learning Mode + Vision Analysis
**Objective:** Test visual learning scenarios

**Steps:**
1. Topic: "Recognizing architectural styles"
2. User uploads image of building
3. Practice question: "Identify the architectural style"
4. AI uses vision analysis for evaluation

**Expected Results:**
- AI analyzes image correctly
- Provides architectural analysis
- Feedback is educational and detailed

---

### Scenario 12.5: Persistence Across Sessions
**Objective:** Test if learning progress persists

**Steps:**
1. Start learning session, complete pretest
2. Close browser/app
3. Reopen and check if:
   - Learning Mode still enabled (via cookies)
   - Session state preserved (for authenticated users)
   - Can continue from where left off

**Expected Results:**
- Learning Mode preference persists
- Session data available for authenticated users
- Graceful handling for unauthenticated users

---

### Scenario 12.6: Mobile Responsiveness
**Objective:** Test Learning Mode on mobile devices

**Steps:**
1. Access on mobile (< 768px width)
2. Enable Learning Mode
3. Verify panel adapts:
   - Full-screen or overlay mode
   - Touch-friendly controls
   - Readable text and UI elements
4. Complete pretest on mobile
5. Navigate tabs

**Expected Results:**
- Panel doesn't break layout
- All features accessible
- Smooth mobile experience
- Confidence slider touch-friendly

---

### Scenario 12.7: Accessibility Testing
**Objective:** Verify WCAG compliance

**Tests:**
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader compatibility (ARIA labels)
- Color contrast ratios
- Focus indicators
- Alternative text for icons

**Expected Results:**
- Full keyboard accessibility
- Screen reader announces all elements
- Meets WCAG 2.1 AA standards

---

## Performance & Scale Scenarios

### Scenario 13.1: Long Session Duration
**Objective:** Test stability over extended use

**Steps:**
1. Run session for 2+ hours
2. Answer 50+ questions
3. Explore 10+ topics
4. Monitor:
   - Memory usage
   - Response times
   - UI responsiveness

**Expected Results:**
- No memory leaks
- Consistent performance
- Metrics remain accurate

---

### Scenario 13.2: Console Log Overflow
**Objective:** Test log management at scale

**Steps:**
1. Generate 600+ log entries (system keeps 500)
2. Verify oldest logs are removed
3. Check performance impact

**Expected Results:**
- Log array capped at 500
- FIFO queue management
- No performance degradation

---

### Scenario 13.3: Rapid Question Answering
**Objective:** Stress test answer submission

**Steps:**
1. Answer questions as quickly as possible
2. Submit 10 answers in rapid succession
3. Verify all recorded correctly

**Expected Results:**
- All answers processed
- Metrics update accurately
- No race conditions

---

## Success Criteria Summary

For Learning Mode to be considered fully functional:

✅ **Core Features:**
- [x] Session initialization with topic
- [x] 5-question Bloom's Taxonomy pretest
- [x] Difficulty calibration (1-10 scale)
- [x] Lesson generation at appropriate difficulty
- [x] Practice question generation
- [x] Answer evaluation with feedback

✅ **Metacognition:**
- [x] Confidence rating collection (1-10)
- [x] Calibration analysis (confidence vs performance)
- [x] Personalized AI insights

✅ **Progress Tracking:**
- [x] Questions answered count
- [x] Accuracy percentage
- [x] Average confidence
- [x] Topics explored list
- [x] Session duration timer

✅ **UI/UX:**
- [x] Collapsible panel (60px ↔ 500px)
- [x] Three functional tabs (Lesson, Practice, Progress)
- [x] Phase indicators
- [x] Console logging
- [x] Responsive design

✅ **Robustness:**
- [x] Error handling
- [x] Edge case management
- [x] State persistence
- [x] Performance at scale

---

## Testing Checklist

Use this checklist to systematically validate Learning Mode:

### Basic Functionality
- [ ] Enable/disable Learning Mode from input menu
- [ ] Panel appears/disappears correctly
- [ ] Set topic and start session
- [ ] Complete 5-question pretest
- [ ] Difficulty calibrates correctly
- [ ] Switch between tabs
- [ ] Collapse/expand panel

### Pretest
- [ ] All 5 Bloom's levels represented
- [ ] Questions relevant to topic
- [ ] Multiple choice and open-ended formats
- [ ] Answers evaluated correctly
- [ ] Confidence ratings recorded

### Calibration
- [ ] 0-1 correct → difficulty 1-3
- [ ] 2-3 correct → difficulty 4-6
- [ ] 4-5 correct → difficulty 7-10
- [ ] Confidence modifier affects calibration
- [ ] Difficulty displayed in panel

### Lessons
- [ ] Content matches difficulty level
- [ ] Focus areas work correctly
- [ ] Examples included when requested
- [ ] Content is educational and clear

### Practice
- [ ] Questions generated at appropriate difficulty
- [ ] Can request multiple practice rounds
- [ ] Questions don't repeat
- [ ] Answers evaluated accurately
- [ ] Feedback is constructive

### Progress
- [ ] Accuracy rate displays correctly
- [ ] Average confidence calculates properly
- [ ] Session duration updates
- [ ] Topics explored list accurate
- [ ] AI insights are contextual and helpful
- [ ] Calibration analysis present

### Advanced
- [ ] Multi-topic sessions work
- [ ] Integration with other tools (code execution, search)
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Long sessions stable
- [ ] Reset clears all state

---

## Appendix: Example Test Data

### Sample Topics by Domain

**Programming:**
- JavaScript async/await
- Python list comprehensions
- Recursion algorithms
- Object-oriented design patterns
- SQL query optimization

**Mathematics:**
- Calculus derivatives
- Linear algebra matrices
- Probability distributions
- Graph theory basics
- Number theory

**Science:**
- Photosynthesis process
- Newton's laws of motion
- Chemical bonding
- DNA replication
- Climate change factors

**Humanities:**
- World War II causes
- Shakespearean sonnets
- Existentialism philosophy
- Renaissance art
- Economic supply and demand

**Technology:**
- Blockchain fundamentals
- REST API design
- Machine learning algorithms
- Network protocols
- Cloud computing concepts

### Sample Pretest Questions

**Foundational (Recall):**
- "What does HTML stand for?"
- "Define the term 'variable' in programming"
- "What is the capital of France?"

**Conceptual (Understanding):**
- "Explain the difference between class and object"
- "How does photosynthesis convert sunlight to energy?"
- "Why do we use version control in software development?"

**Application (Using):**
- "Given this code snippet, what will be the output?"
- "Calculate the derivative of f(x) = 3x² + 2x - 1"
- "Write a function that reverses a string"

**Analysis (Breaking Down):**
- "Why is this algorithm O(n²) instead of O(n)?"
- "What are the advantages and disadvantages of NoSQL databases?"
- "Analyze the strengths and weaknesses of this architectural design"

**Synthesis (Creating):**
- "Design a system to handle 1 million concurrent users"
- "Propose a solution to reduce carbon emissions in urban areas"
- "Create an analogy to explain quantum entanglement"

---

## Conclusion

This comprehensive test suite ensures Learning Mode delivers a robust, adaptive, and effective educational experience. By systematically validating each scenario, we can guarantee that learners receive personalized instruction calibrated to their knowledge level, with metacognitive insights that promote deeper understanding and self-awareness.

Regular testing against these scenarios will maintain quality as the system evolves and new features are added.
