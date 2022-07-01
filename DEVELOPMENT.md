# Development guide

This guide will help you set up this project.

## Requirements

- [Node](https://nodejs.org/) 16.x.x (Node Version Manager: [nvm](https://github.com/nvm-sh/nvm))
- [Firebase](https://console.firebase.google.com/)
  - Authentication
  - Storage
  - Firestore Database
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`brew install --cask google-cloud-sdk`)

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

### Install dependencies and run in development mode

```bash
# install packages
npm install

# run development server
npm start
```

## Firebase

### Storage

Authenticate:

```bash
gcloud auth login
```

Set up CORS:

```bash
gsutil cors set firebase/cors.json gs://<YOUR-BUCKET>
```
