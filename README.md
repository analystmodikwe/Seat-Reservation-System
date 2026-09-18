Seat Reservation System

This is a seat reservation and ticketing system built for the Melsoft Academy technical assessment. It lets a user hold a seat for an event, confirm that hold before it expires, and join a waitlist when no seats are available. The system is designed so that two people can never end up holding the same seat, even if they try at the exact same moment, and every change to a seat's state is recorded in an event log so the current state of any seat can always be reconstructed from history alone.

Technology

The backend is written in Node.js with TypeScript and Express. State is kept in memory for this assessment, but the code is structured so that swapping in a real database would only mean writing new repository classes, without touching any of the business logic. The frontend is a React and TypeScript application built with Vite, styled with Tailwind CSS.

Project structure

The backend lives in the backend folder and is organized into a few layers. The repositories folder holds everything responsible for storing and retrieving data, one file per entity: seats, holds, the waitlist, and the event log. The services folder holds the actual business rules, including hold placement, extension, confirmation, release, and waitlist promotion. The generators folder holds the hold code generator. Routes live in the routes folder and are intentionally thin, since their only job is to parse a request, call a service, and return a response. The container file is where every repository and service actually gets created and wired together, so nothing elsewhere in the app ever has to know how a piece of data is stored, only what interface it implements.

The frontend lives in the frontend folder. Its api folder contains the client that talks to the backend and the shared type definitions. Its components folder holds the three required screens: the seat map, the manage hold screen, and the event log. Its hooks folder holds the logic for polling seat data and managing a hold's state.

Running the backend

From inside the backend folder, install dependencies with npm install. Start the server with npm start, which runs the API on port 5000 by default. The port can be changed by setting a PORT environment variable before starting the server.

Running the frontend

From inside the frontend folder, install dependencies with npm install. Start the development server with npm run dev. The frontend expects the backend to be reachable at the address set in its .env.local file, under the VITE_API_URL variable. By default this points at http://localhost:5000, so as long as the backend is running on that port, no changes are needed.

Running the tests

From inside the backend folder, run npm test. This runs the full automated test suite using Node's built in test runner, covering hold code generation and uniqueness, expiry behaviour, the per user hold limits, idempotent confirmation, waitlist promotion and re-offering, and a concurrency test that fires simultaneous requests at the same seat to confirm only one of them can ever succeed.

The tests rely on a fake clock rather than real timers, so expiry and rate limiting rules can be tested instantly instead of waiting out real seconds and minutes. This fake clock lives in the tests folder and can be advanced manually inside a test to simulate any amount of time passing.

Changing configuration

All of the tunable rules for this system live in one place, the config file in the backend's src folder. The number of seats per event, the length of time a hold lasts before expiring, the maximum number of concurrent active holds a single user can have, the maximum number of holds a user can place per hour, and the maximum number of times a single hold can be extended are all defined there. Each of these values can also be overridden with an environment variable of the same name without touching any code, which makes it possible to loosen or tighten these rules for testing or for a real deployment.

How the core rules are enforced

Every action that changes a seat's state, placing a hold, extending it, confirming it, or releasing it, acquires a lock on that specific seat number before doing anything else, and releases it once the action is complete or has failed. This is what guarantees that two people requesting the same seat at the same instant cannot both succeed, since the second request always waits for the first to finish before it can even read the seat's current state.

Confirming a hold is idempotent by design. If the same email and hold code are used to confirm a seat that is already confirmed, the request succeeds again with the same result and changes nothing, rather than failing or duplicating any state change.

When a seat becomes free, either because a hold expired or because someone released it, the system checks the waitlist and automatically offers that seat to whoever has been waiting the longest. If that person does not confirm before their automatic hold also expires, the seat is offered again to the next person in line, and the original person would need to rejoin the waitlist if they still want a seat.

Every one of these state changes, including waitlist joins and promotions, is written to an append only event log with a timestamp. Nothing in the system is ever allowed to modify or delete a past entry in that log, which is what makes it possible to reconstruct the full history of any seat from the log alone.