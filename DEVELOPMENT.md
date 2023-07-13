# Development guide

This guide will help you set up this project.

## Using GitHub Codespaces

This project is configured to work with GitHub [Codespaces](https://github.com/features/codespaces). To use it, simply open the project in a Codespace using GitHub's UI.

## Local development

### Requirements

- Node Version Manager: [nvm](https://github.com/nvm-sh/nvm)

#### Setup local environment variables

```bash
cp .env .env.local
```

#### Setup correct Node.js version

```bash
nvm use
```

#### Install dependencies and run in development mode

```bash
# install packages
npm install

# run development server
npm start

# lint code
npm run lint

# fix / format code
npm run lint:fix

# regenerate PocketBase types
npm run typegen

# production build
npm run build
```
