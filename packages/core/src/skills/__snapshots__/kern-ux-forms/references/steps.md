# Multi-step forms

A `formFlow` block renders a form in steps: KERN's Task List as the step list, the Progress bar, the step's fields and the buttons to move between steps. KERN asks for a Summary where people check their answers before they send them.

## Task List: the step list of a `formFlow` block

Lists tasks with their completion status for longer, multi-step processes.

Use it for:

- Longer processes spread over several steps, such as online services.
- When the required information does not fit on one page or several sessions are needed.
- When tasks can be completed in any order.

Do:

- Keep a Task List to at most 7 tasks.
- Keep the number of groups in a Task List group manageable.
- Write group and task labels short and clear so screen reader users can operate the list.
- Communicate only the correct status of a task.
- Number tasks across the whole list instead of restarting numbering per group.

Don't:

- Do not invent additional statuses beyond the ones defined.
- Do not add other buttons or actions inside the Task List.

Card: `kern://components/tasklist`

## Progress: the progress bar of a `formFlow` block

Shows progress through a multi-step process; use it for fixed-order flows, not for loading.

Use it for:

- Processes with a fixed sequence of steps, such as registration or payment flows.
- To break a complex process into smaller, easier-to-follow steps.

Do:

- Use Progress for linear, chronological processes that need a fixed step order.

Don't:

- Do not use Progress for loading processes.
- Avoid Progress for very long or complex processes with more than ten steps; it can overwhelm users.

Card: `kern://components/progress`

## Summary: a `summary` block in the step for checking the answers

Shows earlier form entries as term and value pairs so users can review and edit them.

Use it for:

- After users entered information through a Task List or Task List group and need to review it before continuing.
- Before sending a form, so entries can be checked calmly.

Do:

- Use the same wording for the same tasks and groups as in the related Task List or Task List group.
- Show the information in the same order in which it was entered.

Don't:

- Do not hide essential information; users must be able to see where to change their entries.
- Do not use other buttons or actions inside the Summary.

Card: `kern://components/summary`
