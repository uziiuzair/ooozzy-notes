# Task Management System

**Purpose**: Track individual tasks with detailed specifications, progress, and outcomes

## How It Works

### Task Naming Convention
Tasks are numbered sequentially with descriptive names:
```
001-task-name.md
002-another-task.md
003-feature-implementation.md
```

### Task Lifecycle

**1. Task Creation** (by Uzair or Claude)
- Create new task file with next number
- Fill in template with requirements
- Set status to `todo`

**2. Task Execution** (by Claude)
- Read task file completely
- Update status to `in_progress`
- Work through acceptance criteria
- Document progress in task file
- Update ACTIVE_CONTEXT.md with current work

**3. Task Completion**
- Mark all acceptance criteria as complete
- Set status to `done`
- Document outcome and files changed
- Update ACTIVE_CONTEXT.md
- Archive task (move to tasks/archive/) or keep for reference

### Task Status Values
- `todo` - Not started
- `in_progress` - Currently being worked on
- `blocked` - Waiting on something
- `done` - Completed successfully
- `cancelled` - No longer needed

## Task File Template

```markdown
# Task: [Task Name]

**Task ID**: [001]
**Status**: [todo | in_progress | blocked | done | cancelled]
**Created**: [YYYY-MM-DD]
**Started**: [YYYY-MM-DD or empty]
**Completed**: [YYYY-MM-DD or empty]
**Assigned To**: Claude
**Rung**: [0.4 | 0.5 | etc. - which rung this contributes to]

## Objective

[Clear, concise description of what needs to be accomplished]

## Context

[Why this task is needed, background information, related work]

## Requirements

### Must Have
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Nice to Have
- [ ] Optional feature 1
- [ ] Optional feature 2

## Acceptance Criteria

- [ ] Criterion 1: [Specific, testable condition]
- [ ] Criterion 2: [Specific, testable condition]
- [ ] Criterion 3: [Specific, testable condition]
- [ ] TypeScript build passes
- [ ] No console errors
- [ ] Works on desktop + mobile
- [ ] Memory bank updated

## Technical Approach

[How this will be implemented - architecture, patterns, technologies]

## Files to Modify/Create

- [ ] `path/to/file1.ts` - [What changes]
- [ ] `path/to/file2.tsx` - [What changes]
- [ ] `path/to/file3.ts` - [What changes]

## Testing Checklist

- [ ] Test case 1
- [ ] Test case 2
- [ ] Test case 3
- [ ] Edge case handling
- [ ] Error scenarios

## Dependencies

- Requires: [Other tasks that must be done first]
- Blocks: [Tasks that depend on this one]
- Related: [Related tasks or documentation]

## Progress Log

### [YYYY-MM-DD HH:MM]
[Update on progress, decisions made, issues encountered]

### [YYYY-MM-DD HH:MM]
[Another update...]

## Completion Notes

**Status**: [done | cancelled]
**Completed**: [YYYY-MM-DD]

**Summary**: [What was accomplished]

**Files Changed**:
- `file1.ts` - [Changes made]
- `file2.tsx` - [Changes made]

**Lessons Learned**:
- [Lesson 1]
- [Lesson 2]

**Follow-up Tasks**:
- [Task that should be created as a result]
```

## Task Discovery Workflow

### At Start of Every Session

1. **Read ACTIVE_CONTEXT.md** - Understand current state
2. **Read this README.md** - Remember task system
3. **Check Task Table** - See what's in progress, todo, or done
4. **Read Active Task** - If task is in_progress, read that task file
5. **Confirm or Propose** - Ask Uzair what to work on next

### Task Table Location

The task table is maintained in **ACTIVE_CONTEXT.md** under the "Task Tracker" section.

## Best Practices

### For Task Creation
- **Be Specific**: Clear objectives and acceptance criteria
- **Be Testable**: Criteria should be verifiable
- **Be Complete**: Include all context needed
- **Link Rungs**: Connect to build ladder (rung number)

### For Task Execution
- **Read First**: Fully read task before starting
- **Update Often**: Log progress regularly
- **Ask Questions**: If unclear, ask Uzair
- **Document Decisions**: Record why choices were made

### For Task Completion
- **Verify Everything**: Check all acceptance criteria
- **Update Memory Bank**: ACTIVE_CONTEXT.md and PROGRESS.md
- **Clean Up**: Mark task as done with completion notes
- **Create Follow-ups**: Note any new tasks discovered

## Task Prioritization

Tasks are prioritized by:
1. **Rung Order**: Follow build ladder (0.4 → 0.5 → 0.6 → ...)
2. **Dependencies**: Complete prerequisite tasks first
3. **User Request**: Uzair's explicit priorities override
4. **Impact**: High-impact tasks before nice-to-haves

## Example Tasks

See `tasks/examples/` directory for sample completed tasks (if exists).

## Archive

Completed tasks can be moved to `tasks/archive/` to keep the main directory clean, or kept in main directory for reference. Discuss with Uzair.
