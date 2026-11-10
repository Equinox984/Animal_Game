# Animal_Game — Alessia: The Jungle Chase

A small chase game set in an illustrated jungle. Play as **Alessia**, an adventurous tiger, and catch **Ollie**, a mischievous orangutan, with **Shadow**, your big-cat companion, by your side.

## Objective

Catch Ollie before the **90-second** timer runs out. There is no combat: simply get close enough to tag him. Along the way, collect **eight glowing paw prints**, worth 10 points each, for a maximum of **80 points**. Collecting paw prints is optional to win.

## Features

- Canvas-drawn jungle with foliage, a pond, fireflies, and animated characters.
- An orangutan who runs away when Alessia approaches and a feline companion who follows her.
- Sprinting with limited energy that regenerates while not sprinting.
- Countdown timer, scoring, and particle effects.
- Pause, restart, and optional sound effects.
- Responsive interface with directional buttons for touchscreens.
- Automatic pause when switching tabs or leaving the browser window.

## How to Play

Open `index.html` in a modern browser, or start a local server from the project directory:

```sh
python3 -m http.server 8081
```

Visit **http://localhost:8081** and click **Let’s get wild**.

### Controls

| Action | Control |
| --- | --- |
| Move Alessia | Arrow keys or WASD |
| Sprint | Hold Shift while moving |
| Pause or resume | Space bar or the pause button |
| Restart | The ↻ button in the game toolbar |
| Toggle sound | The ♫ button in the game toolbar |
| Move on mobile | On-screen directional buttons |

## Technologies

Built with **HTML5, CSS, and JavaScript**, using Canvas 2D for graphics and the Web Audio API for sound. No dependencies, package installation, or build step required.

Fonts load from Google Fonts when a connection is available, with system fonts as fallbacks. The game does not require any backend services.

## Project Structure

```text
Animal_Game/
├── .gitignore   # Local files excluded from version control
├── index.html   # Main page and game interface
├── style.css    # Visual design and responsive layout
├── game.js      # Movement, chase behavior, graphics, and sound
└── README.md    # Project information and instructions
```

## Deployment

The project can be served by any static hosting provider. Publish `index.html`, `style.css`, and `game.js` together, preserving their relative paths.
