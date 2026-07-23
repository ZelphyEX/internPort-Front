# Jonkler

A single-page website that asks the visitor what kind of content they're in the mood for, then shows a random pick from the matching list.

## Core flow

1. Landing view presents three choices: **Joke**, **Pickup Line**, **Poetry**.
2. User picks one.
3. Site displays a random string from that category's list.
4. User can request another random pick from the same category, or go back and choose a different category.

## Content data

Three separate string lists, one per category:

- `jokes: string[]`
- `pickupLines: string[]`
- `poetry: string[]`

Each list is a flat array of self-contained strings (a joke, a pickup line, or a short funny poem). Poetry entries may contain line breaks (`\n`) since they're multi-line. Selection is a uniform-random pick from the relevant array, avoiding immediate repeats of the last shown item where practical.

## Tech stack

Not yet decided. Default to a simple static HTML/CSS/JS site (no build step, no framework) unless the user asks for something else — this project doesn't need a backend or persistence.

## Sound

A classic sitcom-style laugh track plays instantly every time a result (joke, pickup line, or poem) is shown — on the initial category pick and on each "Another one" click. Audio file lives at `assets/laugh-track.mp3`.

## Files

- `index.html` — markup for the picker screen and result screen, plus the `<audio>` element for the laugh track.
- `style.css` — dark/gradient theme, card layout, buttons.
- `script.js` — the `content` object (`jokes`, `pickupLines`, `poetry` arrays), random selection (avoids immediate repeats), view-switching logic, and laugh-track playback.
- `assets/laugh-track.mp3` — the laugh track audio clip.

## Status

Implemented as a static site — open `index.html` directly in a browser, no build step or server required.
