_default:
  just --list -u

generate-json:
    pkl eval tracker-info.pkl -f json | jq --compact-output > tracker-info.json

generate-go:
    rm -rf gen && pkl-gen-go ./pkl/Trackers.pkl

generate-readme:
    node index.js > README.md
