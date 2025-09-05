import trackerInfo from "./tracker-info.json" with { type: "json" };
import * as rrulePkg from "rrule"
import * as DateFNS from "date-fns"
import _ from "lodash";

const RRule = rrulePkg.default.RRule;

export function generateReadme() {
  // Only add each tracker once
  const addedTrackers = new Set();
  const freeleech = [];

  for (const tracker of trackerInfo.freeleech.reverse()) {
    if (addedTrackers.has(tracker.tracker)) {
      continue;
    }
    addedTrackers.add(tracker.tracker);

    freeleech.push(tracker);
  }

  // Sort by tracker name
  const sortedFreeleech = _.orderBy(freeleech, ["tracker"])

  let output = "";
  output += `
# Torrent Tracker Freeleech Status

A list of torrent trackers and their freeleech status.

This list is automatically generated, updated every hour, last updated at ${new Date().toUTCString()} (UTC).

| Tracker | Currently Freelech? | When Freelech? |
`

  for (const freeleechInfo of sortedFreeleech) {
    const tracker = trackerInfo.trackers.find(t => t.code === freeleechInfo.tracker);
    const isFreeleech = getIsFreeleech(freeleechInfo);
    const whenFreeleech = getWhenFreeleech(freeleechInfo);

    output += `| [${tracker.name}](${tracker.domain}) | ${isFreeleech ? "✅ Yes" : "❌ No"} | ${whenFreeleech} |\n`
  }

  output += `
## Notes

- "Freeleech" means that downloading torrents from the tracker does not count against your download ratio.
- The information in this list may not be accurate. Always check the tracker's website for the most up-to-date information.
- We are not affiliated with any of the trackers listed here. Use at your own risk.
- If you notice any inaccuracies, please open an issue or a pull request!
`

  console.log(output);
}

function getIsFreeleech(tracker) {
  switch (tracker.type) {
    case "permanent": {
      return true;
    }
    case "recurring": {
      const startOfHour = DateFNS.startOfHour(new Date());
      const endOfHour = DateFNS.endOfHour(new Date());

      const rruleConverted = RRule.fromText(tracker.rrule);
      const rrule = new RRule({
        ...rruleConverted.options,
        tzid: tracker.timezone || "UTC",
      });

      return rrule.between(startOfHour, endOfHour).length > 0;
    }
    case "one-time": {
      const [start, end] = tracker.time.split("/")

      return DateFNS.isWithinInterval(new Date(), {
        start: new Date(start),
        end: new Date(end),
      });
    }
  }
}

function getWhenFreeleech(tracker) {
  switch (tracker.type) {
    case "permanent": {
      return "Permanent";
    }
    case "recurring": {
      return tracker.rrule;
    }
    case "one-time": {
      const [start, end] = tracker.time.split("/")

      return `From ${new Date(start).toUTCString()} to ${new Date(end).toUTCString()} (UTC)`;
    }
  }
}
