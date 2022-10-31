# Development guide

This guide will help you set up this project.

## Requirements

- Node Version Manager: [nvm](https://github.com/nvm-sh/nvm)

### Setup local environment variables

```bash
cp .env .env.local
```

### Setup correct Node.js version

```bash
nvm use
```

### Install dependencies and run in development mode

```bash
# install packages
npm install

# run development server
npm start

# lint code
npm run lint

# production build
npm run build
```
