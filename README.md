# SpeedyTuner Cloud

[![Netlify Status](https://api.netlify.com/api/v1/badges/83204fc5-98b8-483c-ac69-acaa656ba9ee/deploy-status)](https://app.netlify.com/sites/speedytuner/deploys)
![master](https://github.com/speedy-tuner/speedy-tuner-cloud/actions/workflows/lint.js.yml/badge.svg?branch=master)
[![CodeQL](https://github.com/speedy-tuner/speedy-tuner-cloud/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/speedy-tuner/speedy-tuner-cloud/actions/workflows/codeql-analysis.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/d810354c0bca64ec9316/maintainability)](https://codeclimate.com/github/speedy-tuner/speedy-tuner-cloud/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/d810354c0bca64ec9316/test_coverage)](https://codeclimate.com/github/speedy-tuner/speedy-tuner-cloud/test_coverage)
![License](https://img.shields.io/github/license/speedy-tuner/speedy-tuner-cloud)

Share your [Speeduino](https://speeduino.com/) tune and logs.

## [https://speedytuner.cloud](https://speedytuner.cloud)

![Screenshot](https://speedytuner.cloud/img/screen.png)

## Project main goals

- 🚀 always free and open source (FOSS)
- 💻 Cloud based web app with CDN
- 🔥 `60 FPS` animations and fast load times
- 👍 good user experience
  - 💎 intuitive, modern and responsive UI
  - 👶 easy for newcomers with tips, tools and simple diagnostics
  - 📱 touch screen friendly

## ECU firmware

- Documentation: [wiki.speeduino.com](https://wiki.speeduino.com/)
- Source code: [noisymime/speeduino](https://github.com/noisymime/speeduino)

## Contributing 🤝

There are many ways in which you can participate in the project and every bit of help is greatly appreciated.

- 👋 Say Hi and start a conversation over at [Discussions](https://github.com/karniv00l/speedy-tuner/discussions)
- 🐞 [Submit bugs and feature requests](https://github.com/karniv00l/speedy-tuner/issues)
- 🧪 Test on different platforms, hardware and Speeduino firmware
- 👓 Review source code
- ⌨️ Write tests and refactor code according to best practices

## Development

### Recommended dev environment

- [Node](https://nodejs.org/) 16.x.x

### Authenticate to GitHub Packages

Project uses shared packages (`@speedy-tuner/...`).

They are hosted using `GitHub Packages`, to install them you need to [authenticate to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) first.

### Install and run

```bash
# install packages
npm install

# run development server
npm start

# open in browser
open http://localhost:3000
```
