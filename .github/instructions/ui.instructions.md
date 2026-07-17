---
description: 'UI, DOM, and event-handling rules for the Flashcard Trainer project.'
applyTo: 'js/ui.js, js/dom.js, index.html, css/styles.css'
---

# UI and DOM Instructions

## DOM Access

Required DOM elements must be looked up through `js/dom.js`.

Do not scatter direct DOM lookups throughout feature code.

Prefer:

```javascript
const elements = getElements();
```

Avoid adding repeated calls such as:

```javascript
document.getElementById("someId");
document.querySelector(".some-class");
```

outside `dom.js`, unless there is a clear reason.

## Required Elements

If a required element is missing, fail clearly using the existing required-element helper pattern.

Do not hide missing-element errors with broad null checks that make the app fail silently.

## Event Wiring

Register UI event listeners centrally in `wireEvents()` unless there is a strong reason not to.

Avoid scattering `addEventListener()` calls across unrelated modules.

## Rendering

Rendering functions should:

- read state
- update DOM text, attributes, classes, or disabled states
- avoid changing unrelated state unless the function is explicitly an interaction handler

Business logic should live in the appropriate helper/module rather than being embedded directly in rendering code.

## Accessibility

Preserve existing accessibility support, including:

- `aria-live` status updates
- meaningful button labels
- tab and panel state attributes
- clear disabled states

Do not remove accessibility attributes unless replacing them with an equivalent or better approach.

## Keyboard Behaviour

Do not add keyboard navigation or keyboard shortcuts unless explicitly requested.

The card flip hint must remain consistent with the implemented behaviour.
