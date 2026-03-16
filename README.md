# ![JTL logo](https://avatars.githubusercontent.com/u/31404730?s=25&v=4) JTL-Platform App Samples

Welcome to the official sample repository for **JTL-Cloud Apps**! This repository contains comprehensive examples and templates to help you build, test, and deploy applications on the JTL platform.

## ⚡️ Prerequisites

- Node.js (v18 or higher)
- Corepack enabled (`corepack enable`)
- Install dependencies from the repository root with `corepack yarn install`
- .NET 9 SDK if you want to run the ASP.NET backend sample

## 🚀 Getting Started

1. **Clone the repository:**

   ```bash
   git clone https://github.com/jtl-software/jtl-platform-app-samples.git
   cd jtl-platform-app-samples
   ```

2. **Navigate to your desired example:**

   ```bash
   cd src/[example-name]
   ```

3. **Follow the README instructions** in each example directory for specific setup and run instructions.

## ✅ Quality Checks

Run these commands from the repository root:

- `corepack yarn lint`
- `corepack yarn typecheck`
- `corepack yarn test`
- `corepack yarn build`
- `corepack yarn run check`

## 📁 Available Examples

| Example         | Description                                      | Location               |
| --------------- | ------------------------------------------------ | ---------------------- |
| Hello World App | Full-stack application with backend and frontend | `src/hello-world-app/` |
