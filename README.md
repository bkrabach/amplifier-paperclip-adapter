# amplifier-paperclip-adapter

Paperclip adapter for Amplifier — connects Amplifier as an agent runtime to Paperclip's control plane.

## Quick Install

```bash
curl -sSL https://raw.githubusercontent.com/bkrabach/amplifier-paperclip-adapter/main/install.sh | bash
```

## Architecture

This project consists of two packages that together bridge Amplifier and Paperclip:

### `bridge/` — Python CLI

The Python bridge package exposes Amplifier sessions and agents as a Paperclip-compatible runtime. It handles:

- Translating Paperclip control-plane messages to Amplifier session lifecycle events
- Streaming agent output back to Paperclip
- Managing session state and agent coordination

### `adapter/` — TypeScript Plugin

The TypeScript adapter package implements the Paperclip plugin interface. It handles:

- Registering with the Paperclip control plane
- Forwarding task requests to the Python bridge via HTTP/stdio
- Reporting agent status and results back to Paperclip

## Dev Setup

### Python Bridge

```bash
# Install with dev dependencies
uv pip install -e ".[dev]"

# Run tests
pytest
```

### TypeScript Adapter

```bash
# Install dependencies
cd adapter
npm install

# Build
npm run build
```

## License

MIT
