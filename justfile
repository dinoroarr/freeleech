_default:
  just --list -u

generate-json:
    pkl eval ./trackers.pkl -f json | jq --compact-output > trackers.json

generate-go:
    rm -rf gen && pkl-gen-go ./pkl/Trackers.pkl

generate-readme:
    node index.js > README.md
