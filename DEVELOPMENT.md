# Development guide

This guide will help you set up this project.

## Requirements

- Node Version Manager: [nvm](https://github.com/nvm-sh/nvm)

### Setup local environment variables

```bash
cp .env .env.local
```

### Authenticate to GitHub Packages

Project uses shared packages (`@hyper-tuner/...`).

They are hosted using `GitHub Packages`, to install them you need to [authenticate to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) first.

#### Personal access token

Generate GitHub [Personal access token](https://github.com/settings/tokens).

Private token can be assign to ENV when running `npm install` in the same shell:

```bash
export NPM_GITHUB_TOKEN=YOUR_PRIVATE_GITHUB_TOKEN
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
