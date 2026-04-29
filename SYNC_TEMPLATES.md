# Weekly Sync Meeting Templates

This document provides templates for recurring weekly sync meetings. Use these to structure discussions and keep everyone aligned.

## Table of Contents

1. [Team Standup](#team-standup)
2. [Engineering Sync](#engineering-sync)
3. [Product Sync](#product-sync)
4. [Executive Sync](#executive-sync)
5. [All-Hands Meeting](#all-hands-meeting)
6. [1-on-1 Sync](#1-on-1-sync)
7. [Retrospective](#retrospective)

---

## Team Standup

**Frequency**: Daily (or 3x weekly for async teams)  
**Duration**: 15 minutes  
**Time**: 9:30 AM  
**Attendees**: Engineering team + Product manager  
**Format**: In-person or Zoom

### Agenda

```markdown
# Team Standup - [DATE]

## Opening (1 min)
- Welcome and quick energy check

## Round-robin Updates (12 min)
Each person: ~90 seconds

### [Team Member 1]
**Yesterday**: 
- [ ] What you completed

**Today**:
- [ ] What you're working on

**Blockers**:
- [ ] Any blockers or help needed?

### [Team Member 2]
**Yesterday**: 
- [ ] What you completed

**Today**:
- [ ] What you're working on

**Blockers**:
- [ ] Any blockers or help needed?

### [Team Member 3]
**Yesterday**: 
- [ ] What you completed

**Today**:
- [ ] What you're working on

**Blockers**:
- [ ] Any blockers or help needed?

## Discussion (2 min)
- Quick discussion of blockers
- Resource allocation if needed

## Closing (1 min)
- Confirm what's being worked on
- End on positive note

## Action Items
- [ ] [Action item if any]

## Notes
[Any additional notes from the standup]
```

### Best Practices

✓ Start on time  
✓ Keep to time limit  
✓ One person talking at a time  
✓ Write updates beforehand if async  
✓ Flag blockers early

✗ Don't problem-solve during standup  
✗ Don't go into technical detail  
✗ Don't make it a status report for management  
✗ Don't skip the standup

---

## Engineering Sync

**Frequency**: Weekly  
**Duration**: 45 minutes  
**Time**: Tuesday 10:00 AM  
**Attendees**: Engineering team + Tech Lead + Product Manager  
**Format**: In-person or Zoom

### Agenda

```markdown
# Engineering Sync - Week of [DATE]

## 1. Wins & Celebrations (5 min)
- What did we accomplish this week?
- Shout-outs for great work
- Merged PRs, fixed bugs, shipped features

### Highlights
- [ ] [Achievement 1]
- [ ] [Achievement 2]
- [ ] [Achievement 3]

## 2. Current Sprint Status (10 min)
- Sprint progress: [X/Y] items complete
- On track for sprint goal? Yes / No
- Velocity: [number] story points

### In Progress
- [ ] [Task 1] - [Owner] - [% complete]
- [ ] [Task 2] - [Owner] - [% complete]

### At Risk
- [ ] [Task that might slip] - [Owner] - Why at risk?

## 3. Blockers & Dependencies (10 min)
- What's blocking us?
- External dependencies?
- Resource needs?

### Blockers
- [ ] [Blocker 1] - [Owner] - Help needed from?
- [ ] [Blocker 2] - [Owner] - Help needed from?

### Dependencies
- [ ] Waiting on [external team] for [item]
- [ ] [Internal dependency] - [Status]

## 4. Technical Debt (5 min)
- What's hurting our velocity?
- What technical debt should we address?
- Refactoring needs?

### Items to Address
- [ ] [Tech debt item 1] - [Impact]
- [ ] [Tech debt item 2] - [Impact]

## 5. Code Quality & Metrics (5 min)
- Test coverage: [X%] (target: >80%)
- Lint violations: [number]
- Failed builds this week: [number]
- Code review turnaround: [average] hours

### Trends
- [ ] Coverage trend: Up / Down / Stable
- [ ] Build stability: Improving / Degrading
- [ ] Review speed: Improving / Degrading

## 6. Roadmap Discussion (5 min)
- Next sprint planning
- Upcoming features
- Q&A on product roadmap

### Next Sprint
- [ ] [Planned item 1]
- [ ] [Planned item 2]
- [ ] [Planned item 3]

## 7. Learning & Knowledge Sharing (5 min)
- New technologies tried?
- Interesting problems solved?
- Knowledge to share?

### This Week's Learnings
- [Learning 1 - shared by someone]
- [Learning 2 - shared by someone]

## Action Items
- [ ] [Action] - Owner: [Name] - Due: [Date]
- [ ] [Action] - Owner: [Name] - Due: [Date]

## Notes
[Additional notes or decisions made]
```

### Discussion Topics to Avoid

Don't use this time for:
- Individual code review (do in GitHub)
- Detailed design discussions (separate meeting)
- Team building activities (separate)
- Performance reviews (1-on-1s)

---

## Product Sync

**Frequency**: Weekly  
**Duration**: 60 minutes  
**Time**: Wednesday 2:00 PM  
**Attendees**: Product Manager + Engineering Lead + Design (if applicable)  
**Format**: In-person or Zoom

### Agenda

```markdown
# Product Sync - Week of [DATE]

## 1. Product Metrics & Health (10 min)
- User signups: [number] this week
- DAU: [number] (trend: ↑ / ↓ / →)
- Feature adoption: [metric]
- NPS: [score] (trend: ↑ / ↓ / →)

### Key Metrics
| Metric | This Week | Last Week | Target | Status |
|--------|-----------|-----------|--------|--------|
| Signups | | | | |
| DAU | | | | |
| NPS | | | | |
| Churn | | | | |

## 2. User Feedback & Requests (10 min)
- Customer feedback summary
- Top feature requests
- Bugs reported

### Common Themes
- [ ] [Theme 1] - [# of requests] users asking
- [ ] [Theme 2] - [# of requests] users asking
- [ ] [Bug 1] - [Impact]

## 3. Current Release Status (10 min)
- What shipped this week?
- What's in staging?
- What's blocked?

### Released
- [x] [Feature 1]
- [x] [Feature 2]

### In Progress
- [ ] [Feature 3] - [% complete]
- [ ] [Feature 4] - [% complete]

## 4. Roadmap Review (15 min)
- On track with quarterly goals?
- Reprioritization needed?
- Next sprint preview

### Q2 Roadmap Status
- [ ] [Goal 1] - [Status]
- [ ] [Goal 2] - [Status]
- [ ] [Goal 3] - [Status]

### Next Sprint Priorities
1. [Feature 1] - [Why it matters]
2. [Feature 2] - [Why it matters]
3. [Feature 3] - [Why it matters]

## 5. Competitive Analysis (5 min)
- What's the competition doing?
- Market news/trends?
- Threats or opportunities?

### Competitive Updates
- [Competitor A] launched [feature]
- [Market trend] emerging
- [Opportunity] we could exploit

## 6. Customer & Stakeholder Updates (5 min)
- Any escalations?
- Key customer needs?
- Investor/board updates?

### Customer Issues
- [ ] [Customer 1] needs [item]
- [ ] [Customer 2] needs [item]

## 7. Design & UX Discussion (5 min)
- Design work in progress?
- UX issues to address?
- Design debt?

### In Progress
- [ ] [Design 1] - [Status]
- [ ] [Design 2] - [Status]

## Action Items
- [ ] [Action] - Owner: [Name] - Due: [Date]
- [ ] [Action] - Owner: [Name] - Due: [Date]

## Decisions Made
- [Decision 1] - [Rationale]
- [Decision 2] - [Rationale]

## Notes
[Additional notes]
```

---

## Executive Sync

**Frequency**: Weekly  
**Duration**: 30 minutes  
**Time**: Thursday 3:00 PM  
**Attendees**: CEO + Engineering Lead + Product Manager  
**Format**: In-person or Zoom

### Agenda

```markdown
# Executive Sync - Week of [DATE]

## 1. Key Metrics (10 min)
- Revenue / MRR
- Customer count
- Daily active users
- Retention rate
- Churn rate

### Metrics Dashboard
| KPI | This Week | Target | Status |
|-----|-----------|--------|--------|
| MRR | $[X] | $[target] | [↑/↓/→] |
| Users | [X] | [target] | [↑/↓/→] |
| DAU | [X] | [target] | [↑/↓/→] |
| Retention | [X%] | [target]% | [↑/↓/→] |

## 2. Wins This Week (5 min)
- Major accomplishments
- Milestones reached
- Team celebrations

### Highlights
- [Win 1]
- [Win 2]

## 3. Risks & Blockers (5 min)
- What could impact targets?
- Resource constraints?
- External blockers?

### Current Risks
- [ ] [Risk 1] - [Mitigation]
- [ ] [Risk 2] - [Mitigation]

## 4. Quarterly Progress (5 min)
- On track with goals?
- Q2 vs Q1 comparison
- Q3 preview

### Goal Status
- [ ] Goal 1 - [% complete]
- [ ] Goal 2 - [% complete]

## 5. One-line Decision Items (5 min)
- Decisions needed this week?
- Approvals required?
- Escalations?

### Decisions Needed
- [ ] [Decision 1] - Need approval? Yes/No
- [ ] [Decision 2] - Need approval? Yes/No

## Notes & Follow-ups
[Any additional notes or follow-ups needed]
```

---

## All-Hands Meeting

**Frequency**: Bi-weekly or monthly  
**Duration**: 60 minutes  
**Time**: Friday 4:00 PM  
**Attendees**: Entire company  
**Format**: In-person or Zoom

### Agenda

```markdown
# All-Hands Meeting - [DATE]

## 1. Welcome & Opening (5 min)
- CEO opening remarks
- Celebrate team
- Energy/tone setting

## 2. Company Updates (10 min)
- Key business metrics
- Wins and milestones
- Company news

### This Month's Wins
- [Win 1]
- [Win 2]
- [Win 3]

## 3. Product Update (10 min)
- Product Manager presents
- What shipped?
- What's coming?
- Customer feedback highlights

### This Sprint
- [Shipped feature]
- [Customer testimonial]
- [Next priority]

## 4. Engineering Update (10 min)
- Infrastructure improvements
- Technical metrics
- Engineering initiatives

### This Week
- [Infrastructure update]
- [Performance improvement]
- [Technical debt addressed]

## 5. Team Spotlights (10 min)
- Celebrate individuals
- Share accomplishments
- Recognize great work

### Shout-outs
- [Person 1] for [accomplishment]
- [Person 2] for [accomplishment]

## 6. Q&A & Discussion (10 min)
- Open questions
- Company direction
- Concerns or ideas

### Q&A Topics
- [Question 1 from team]
- [Question 2 from team]

## 7. Closing Remarks (5 min)
- CEO closing thoughts
- Next all-hands date
- Social hangout (optional)

## Announcements
- [Announcement 1]
- [Announcement 2]

## Meeting Notes
[Key notes from discussion]
```

---

## 1-on-1 Sync

**Frequency**: Weekly  
**Duration**: 30 minutes  
**Time**: Varies by person  
**Attendees**: Manager + Individual  
**Format**: In-person or Zoom

### Agenda Template

```markdown
# 1-on-1 with [Person Name] - [DATE]

## Opening (2 min)
- How are you doing?
- Anything blocking you?
- Energy level check

## Updates (5 min)
### What's Going Well
- [ ] [Thing 1]
- [ ] [Thing 2]

### Challenges or Frustrations
- [ ] [Challenge 1]
- [ ] [Challenge 2]

## Work Discussion (10 min)
### Progress
- Current projects: [List]
- Blockers: [Any?]
- Help needed: [What?]

### Development
- Learning goals: [What are they learning?]
- Skill development: [What to work on?]
- Career growth: [Where headed?]

## Feedback & Growth (10 min)
### Feedback from Manager
- Positive: [What they're doing well]
- Areas to improve: [What to work on]
- Recognition: [Great work on...]

### Feedback from Individual
- Manager feedback for them?
- Company feedback?
- Team feedback?

## Personal (5 min)
- Work-life balance: Good?
- Anything else on their mind?
- Personal stuff: [If they want to share]

## Action Items
- [ ] [Action] - Due: [Date]
- [ ] [Action] - Due: [Date]

## Notes
[Key takeaways and commitments]

## Next 1-on-1
- Date: [Next week same time]
- Focus: [What to discuss next]
```

### 1-on-1 Tips

✓ Be on time  
✓ Minimize distractions  
✓ Create safe space for honesty  
✓ Balance feedback and recognition  
✓ Focus on their growth  
✓ Take notes  

✗ Don't make it all about task status  
✗ Don't overload with feedback  
✗ Don't reschedule unnecessarily  
✗ Don't have agenda-only meetings  

---

## Retrospective

**Frequency**: Weekly or monthly (usually Friday)  
**Duration**: 45-60 minutes  
**Time**: Friday 4:00 PM  
**Attendees**: Engineering team + Product Manager  
**Format**: In-person or Zoom

### Agenda Template

```markdown
# Retrospective - Week/Sprint of [DATE]

## Opening (5 min)
- Explain format
- Set psychological safety tone
- No blaming, just learning

## What Went Well (10 min)
- Celebrate wins
- What should we do more of?
- Positive moments from the week/sprint

### Wins
- [ ] [Win 1]
- [ ] [Win 2]
- [ ] [Win 3]

### Do More Of
- [ ] [Practice 1]
- [ ] [Practice 2]

## What Could Be Better (10 min)
- Challenges we faced
- Things that slowed us down
- Processes that didn't work

### Challenges
- [ ] [Challenge 1]
- [ ] [Challenge 2]
- [ ] [Challenge 3]

### Do Less Of
- [ ] [Practice 1]
- [ ] [Practice 2]

## What Should We Stop Doing (5 min)
- Things actively hurting us
- Wasteful processes
- Bad habits to break

### Stop Doing
- [ ] [Practice 1]
- [ ] [Practice 2]

## Action Items (10 min)
- What will we actually change?
- Who's responsible?
- How will we measure success?

### Changes to Implement
- [ ] [Change 1] - Owner: [Name] - How to measure: [Metric]
- [ ] [Change 2] - Owner: [Name] - How to measure: [Metric]

## Previous Retro Follow-up (5 min)
- Did we do the actions from last retro?
- What helped / what didn't?
- Lessons learned?

### Last Retro Actions
- [x] [Action 1] - [Result]
- [ ] [Action 2] - [Status]
- [x] [Action 3] - [Result]

## Closing (5 min)
- What's one thing you're excited about?
- Appreciation for team
- Commitment to improvements

## Notes
[Key decisions and commitments]
```

### Retrospective Tips

✓ Do these regularly (weekly better than waiting)  
✓ Create psychological safety  
✓ Focus on systems, not people  
✓ Keep actions SMART (Specific, Measurable, Achievable, Relevant, Time-bound)  
✓ Track previous actions  
✓ Celebrate wins  

✗ Don't blame individuals  
✗ Don't have too many action items  
✗ Don't skip difficult conversations  
✗ Don't make it all negative  

---

## General Meeting Best Practices

### Before Every Meeting
- [ ] Prepare agenda (24 hours before)
- [ ] Send materials in advance
- [ ] Confirm attendees and time
- [ ] Test technology if remote

### During Every Meeting
- [ ] Start on time
- [ ] Introduce topic and goals
- [ ] Record decisions and action items
- [ ] Manage time
- [ ] End on time

### After Every Meeting
- [ ] Send notes within 24 hours
- [ ] List action items with owners and due dates
- [ ] Schedule follow-ups if needed
- [ ] Update shared documents

### Remote Meeting Tips
- [ ] Test video/audio beforehand
- [ ] Use camera (build connection)
- [ ] Share screen when needed
- [ ] Minimize other distractions
- [ ] Use chat for quick notes
- [ ] Record if possible (with permission)

---

## Meeting Cadence Summary

| Meeting | Frequency | Duration | Day/Time |
|---------|-----------|----------|----------|
| Daily Standup | Daily | 15 min | 9:30 AM |
| Engineering Sync | Weekly | 45 min | Tue 10 AM |
| Product Sync | Weekly | 60 min | Wed 2 PM |
| Executive Sync | Weekly | 30 min | Thu 3 PM |
| All-Hands | Bi-weekly | 60 min | Fri 4 PM |
| 1-on-1 | Weekly | 30 min | Varies |
| Retrospective | Weekly | 45 min | Fri 4 PM |

---

## Questions?

For guidance on running these meetings, contact:
- **Meeting Facilitator**: [Name]
- **HR/Operations**: [Name]
- **Engineering Lead**: [Name]

---

**Version**: 1.0  
**Last Updated**: April 29, 2024  
**Owner**: Operations / People Team
