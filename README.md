# Collection Database Website

A personal web app for cataloging and browsing my collectible items, with a
login-protected admin page for adding and editing entries.

**Status:** Actively maintained. I'm adding new content, fixing bugs and optimizing.

## Why I built it
I collect as a hobby and wanted one place to keep track of everything in
detail. I collect K-pop albums, K-pop photocards, and dolls.

## Features
- Browsable collection of items
- Admin login with a form to add and edit items (all entries are added manually)
- SQLite database, run locally on Node.js

## Tech stack
JavaScript · Node.js · SQLite3

## A challenge I solved: changing the database after launch
While cataloging items, I realized I needed more fields to describe them
accurately. Rather than altering the working database directly, I cloned it
and built a new version with the additional fields, keeping the original as a
backup in case the new one had problems. The repo includes dated backups from
that process. 

## How I used AI
I used AI tools to help solve coding problems, generate code, and explain what
it produced. I then reviewed and debugged the output myself to build my own
skills in reading code and finding errors.

## Roadmap
- Support multiple images per item (currently one image per item)
- Ongoing bug fixes, and performance/visual improvements

## Run it locally
Requires [Node.js](https://nodejs.org) to be installed.

1. Clone the repo
2. Run `npm install`
3. Run `node server.js`
4. Open `http://localhost:[port]` in your browser
