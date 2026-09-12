 # KKI Timer System - High-Performance Live Competition Stopwatch

KKI Timer System is a live competition stopwatch for maritime robotics events. It helps competition operators run Preparation and Race phases, monitor team time accurately, and keep official records ready for review.

## Key Features

- **Dual Split-Screen Mode**: A minimalist side-by-side view for the Preparation and Race phases.
- **60FPS Precision Engine**: Uses `requestAnimationFrame` and direct DOM manipulation for responsive, stutter-free millisecond timing.
- **Keyboard-Driven Navigation**: Fast shortcuts designed for reliable operation in high-pressure live environments.
- **Automated PDF Reporting**: Generates professional, branded team history logs ready for official sign-off.
- **Team and operator management**: Admins can manage competition teams, operator access, divisions, and session history.

### Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Spacebar` | Start or pause the focused timer instantly |
| `N` | Move focus between Preparation and Race |
| `V` or `D` | Open Dual Split-Screen mode |
| `R` | Reset the focused timer to its initial time |
| `S` | Set the competition target time |

## Tech Stack

- Next.js 15 with the App Router
- TypeScript
- Tailwind CSS
- MySQL with Prisma ORM
- jsPDF and `jspdf-autotable` for PDF reporting
- Lucide React for interface icons

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MySQL database

### Installation

```bash
npm install
```

Create a `.env` file with the database connection used by the deployment:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
APP_URL="http://localhost:3000"
```

Generate the Prisma client and apply the database migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

### Run the Local Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

## Usage Overview

1. An admin creates teams and operator accounts.
2. An operator signs in and selects the team that is ready to compete.
3. The operator sets target times with `S` and starts the focused phase with `Spacebar`.
4. The operator uses `N` to move between Preparation and Race, or `V`/`D` to monitor both phases together.
5. Session results are stored in team history and can be exported as branded PDF reports by an admin.

## Project Scope

KKI Timer System is maintained for the Kontes Kapal Indonesia maritime robotics competition at Politeknik Negeri Bengkalis.