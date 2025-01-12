# DEVELOPMENT.md

## Table of Contents
- [DEVELOPMENT.md](#developmentmd)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Prerequisites](#prerequisites)
    - [Required Software](#required-software)
    - [Required Knowledge](#required-knowledge)
  - [Setting Up the Development Environment](#setting-up-the-development-environment)
    - [1. Clone the Repository](#1-clone-the-repository)
    - [2. Install Dependencies for each sub-project](#2-install-dependencies-for-each-sub-project)
    - [3. Environment Variables](#3-environment-variables)
  - [Code Structure](#code-structure)
  - [Running the Application](#running-the-application)
    - [Setup a Postgres Instance](#setup-a-postgres-instance)
    - [Start Local Development](#start-local-development)
    - [Using Docker Compose](#using-docker-compose)
  - [Migrations](#migrations)
  - [Testing](#testing)
  - [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
  - [Contributing Guidelines](#contributing-guidelines)

---

## Introduction

SwiftCPQ is a Node.js-based solution leveraging familiar technologies to accelerate the building process while maintaining simplicity and reliability.

While more reliable languages like C# could have been an option, Node.js with TypeScript was chosen for its speed and simplicity, whilst still having a level of typesaftey was my middleground.

This structure was thrown together quickly, if there is anything missing, please let me know in the [Discord](https://discord.com/invite/zF4kr8hrXs) ASAP.

---

## Prerequisites
List the tools, software, and dependencies required to work on the project.

### Required Software
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Postgres](https://www.postgresql.org/)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

### Required Knowledge
- Familiarity with Vue3, Pinia, Drizzle ORM, Express, EJS, Docker, TypeScript, Postgres, Redis, BullMQ

---

## Setting Up the Development Environment
Step-by-step instructions for cloning the repository, installing dependencies, and configuring the environment.

### 1. Clone the Repository
```bash
git clone https://github.com/ekky1328/SwiftCPQ.git
cd SwiftCPQ
```

### 2. Install Dependencies for each sub-project
```bash
cd client
npm install

cd ../server
npm install

cd ../templater
npm install
```

### 3. Environment Variables
- Create a `.env` file in the `server` root directory.
- See the example `.env.sample` file.

---

## Code Structure
Overview of the project's folder structure and the purpose of key files or directories.

Example:  
```
/client
├── /src
│   ├── /api              # CRUD API Functions
│   ├── /constants        # String constants
│   ├── /router           # Core pages
│   ├── /components       # Reusable UI components
│   ├── /store            # Pinia Store
│   ├── /types            # TypeScript types
│   └── /utils            # Utility functions

/server
├── /src
│   ├── /db
│   │   └── /schemas      # Drizzle ORM Database Schemas
│   ├── /server           # Express Server (or BullMQ Master)
│   │   ├── /api          # REST/CRUD API Server
│   │   ├── /content      # User static content files
│   │   ├── /public       # Core static content files
│   │   ├── /data         # Data Templates
│   │   ├── /interfaces   # Express middleware/handlers
│   │   └── /helpers      # Utility functions
│   ├── /worker           # Worker Server (BullMQ Slave)
│   └── /types            # TypeScript types

/templater
├── /src
│   ├── /api              # REST/CRUD API Server
│   ├── /controller       # Core Logic / Integrations
│   ├── /interfaces       # Express middleware/handlers
│   ├── /public           # Core static content files
│   ├── /views            # EJS Templates
│   │   └── /:template    # Each template gets its own folder
│   └── /helpers          # Utility functions

/website                  # Basic HTML/CSS/JS Website
```

---

## Running the Application
Instructions for running the application in development mode.

### Setup a Postgres Instance

**Using Standard Install**
If you want to install Postgres the standard way, here you go: [https://www.postgresql.org/](https://www.postgresql.org/)

**Using Docker**
```bash
docker run -d \
  --name $CONTAINER_NAME \
  -e PUID=1000 \
  -e PGID=1000 \
  -e TZ=Australia/Sydney \
	-e POSTGRES_PASSWORD=development \
	-e PGDATA=/var/lib/postgresql/data/pgdata \
	-v ~/DATA/postgres/development:/var/lib/postgresql/data \
  # My dev db runs remotely, uncomment this if you also have a homelab or vps
  # -p 5432:5432 \ 
  --restart unless-stopped \
	postgres
```

### Start Local Development
```bash
cd client
npm run dev

cd ../server
npm run dev
npm run dev-worker

cd ../templater
npm run dev
```

### Using Docker Compose

... Nothing here yet.

---

## Migrations

This project uses the Drizzle ORM framework for interacting with the database, which also handles migrations.

Please see this documentation for reference: [Migrations with Drizzle Kit](https://orm.drizzle.team/docs/kit-overview)

If you are unfimilar with Drizzle ORM, refer to the [documentation](https://orm.drizzle.team/docs) or watch these videos:
- [https://www.youtube.com/watch?v=i_mAHOhpBSA](Fireshipo - Drizzle ORM in 100 Seconds)
- [https://www.youtube.com/watch?v=Hh9xqRWYEJs](SyntaxFM - Drizzle The TypeScript SQL ORM)

If things change with the way we do migrations in this project, it will be documented here.

---

## Testing

... No testing right now, sorry, this will happen.

---

## Common Issues and Troubleshooting

... Nothing here yet.

---

## Contributing Guidelines
Refer to the `CONTRIBUTING.md` file if one exists or provide high-level instructions for contributing.
