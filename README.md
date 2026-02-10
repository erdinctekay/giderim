# giderim

Privacy-focused, local-first income and expense tracking PWA.

[Website](https://giderim.tekay.dev) · [Issues](https://github.com/erdinctekay/gider.im-pwa/issues) · [Discussions](https://github.com/erdinctekay/gider.im-pwa/discussions)

## About

giderim is a free, privacy-focused income and expense tracking application. Your data is encrypted locally and never leaves your device unless you choose to sync it with your own self-hosted server. No tracking, no ads, no data collection.

This project is a continuation of [gider.im](https://github.com/needim/gider.im-pwa) by [Nedim](https://github.com/needim), who deprecated the original PWA in favor of native apps built with a different stack. I've been using this app with my wife since 2024 and decided to continue maintaining and developing it.

## Technologies

- Built with **React & Vite**
- Styled with **TailwindCSS**
- Powered by **[Evolu](https://github.com/evoluhq/evolu)** (local-first SQLite + CRDT sync)
- PWA (Progressive Web App) for offline support
- Self-hosted sync server via **@evolu/server**

## Features

- **Privacy First**: Your data is encrypted locally and stored securely.
- **Open Source**: Code is open-source under AGPL-3.0 and available for review.
- **Free & Ad-Free**: No hidden costs, no ads, no interruptions.
- **PWA**: Install on any device, works offline.
- **Cross-Platform**: Access on any device, anywhere.
- **Multiple Currencies**: Track finances in any currency.
- **Recurring Transactions**: Set up recurring income and expenses.
- **Groups & Tags**: Organize transactions with groups and color-coded tags.
- **Filters**: Find transactions quickly.
- **Dark Mode**: Easy on the eyes.
- **Multi-Language**: English and Turkish (more welcome via PR).
- **Self-hosted Sync**: Optionally sync across devices with your own server.
- **Import & Export**: Import Evolu database files.

## Development

```bash
# Install dependencies
corepack up
pnpm install

# Start dev server
pnpm dev

# Optional: HTTPS for local development
# Install mkcert (https://github.com/FiloSottile/mkcert)
mkcert -install
mkcert localhost
```

### Sync Server (optional)

To run a local sync server for development:

```bash
docker compose up -d
```

See `server/` directory and `.env.example` for configuration.

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change. Check out [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## Credits

Originally created by [Nedim Arabaci](https://github.com/needim) as [gider.im](https://github.com/needim/gider.im-pwa). Continued and maintained by [Erdinc Tekay](https://github.com/erdinctekay).

## License

[AGPL-3.0](LICENSE)
