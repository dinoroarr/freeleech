_default:
  just --list -u

generate-json:
    pkl eval tracker-info.pkl -f json | jq --compact-output > tracker-info.json

generate-readme:
    node index.js > README.md
