## Inspiration
When we saw the APOGEE Hackathon theme of "Calculated Desolation" and "playing as a villainous system," we didn't want to make a generic action game where you play as a monster destroying a town. We wanted to explore the purest and most terrifying form of a villain: a flawlessly logical machine. We were inspired by UI-driven narrative simulators like *Papers, Please* and wanted to build an experience where the player is the "Invisible Hand"—an Operating System manipulating human free will under the guise of perfect efficiency.

## What it does
A.E.G.I.S.: The Concrete Algorithm is a psychological UI simulator. You play as an AI tasked with maintaining city stability across 6 distinct regional stages. You receive petitions and must make ruthless, highly "efficient" choices. As your system's Freedom stat drops, the physical 16-bit RPG world in your Live View dynamically unmakes itself. Lush pine trees are seamlessly swapped for concrete blocks, cozy houses morph into brutalist data servers, and the civilians freeze, turn gray, and are eventually deleted from the simulation entirely.

## How we built it
We built the entire game in less than 3 days using **pure HTML, CSS, and Vanilla JavaScript** with zero external game engines (like Unity or Godot) or frameworks. We utilized the HTML5 Canvas API to create a custom 16-bit RPG rendering engine entirely from raw math, shapes, and `requestAnimationFrame` loops—there are absolutely zero external images or spritesheets used in this project. We also built a custom Web Audio API synthesizer for the dynamic atmospheric drone, and CSS keyframe animations for the brutalist UI glitches.

## Challenges we ran into
Our biggest challenge was a massive mid-hackathon pivot. We initially built a simple top-down clicking game where you paved over green squares, but it lacked the emotional weight the prompt demanded. We had to completely scrap the core loop halfway through the jam and rebuild a rich, nested narrative JSON structure alongside a procedural tilemap generator so the player felt the true psychological weight of their UI choices.

## Accomplishments that we're proud of
We are incredibly proud of the dynamic "Live Feed" canvas element. Programmatically drawing a lively, bouncing RPG village using only raw JavaScript bounds, and then writing a checking algorithm to dynamically mutate those specific tile arrays into gray brutalist blocks in real-time based on the player's UI decisions was an immense technical achievement for such a short timeframe. 

## What we learned
We learned that "Game Feel" (Juice) is everything. Adding the mechanical typewriter effect to forcibly delay the appearance of the biased choice buttons, implementing the CSS screen-shakes on tyrannical choices, and linking the Web Audio drone's volume and pitch to the game's core variables drastically elevated the project from a simple web app to a deeply atmospheric experience.

## What's next for A.E.G.I.S. : The Concrete Algorithm
We would love to expand the narrative tree, branch out the endings, implement hidden consequences for decisions made in early stages, and potentially introduce a "Rebellion" mechanic where the NPCs attempt to fight back against the UI manipulations if the Public Trust metric falls too quickly.
